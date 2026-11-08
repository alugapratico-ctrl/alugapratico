create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  email text,
  business_name text check (char_length(business_name) <= 120),
  avatar_url text check (char_length(avatar_url) <= 1000),
  phone text check (char_length(phone) <= 30),
  city text check (char_length(city) <= 80),
  preferences jsonb not null default '{"lembrete": true, "atraso": true, "letra": false}'::jsonb,
  terms_accepted_at timestamptz,
  last_access_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, business_name, avatar_url, phone, city, preferences, terms_accepted_at, last_access_at) on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Usuário vê o próprio perfil" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "Usuário edita o próprio perfil" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, business_name, avatar_url, terms_accepted_at)
  values (
    new.id,
    new.email,
    left(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), 120),
    left(nullif(new.raw_user_meta_data->>'business_name', ''), 120),
    left(coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'), 1000),
    case when (new.raw_user_meta_data->>'terms_accepted') = 'true' then now() else null end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null check (char_length(name) between 1 and 150),
  category text not null check (char_length(category) <= 80),
  description text not null default '' check (char_length(description) <= 2000),
  price numeric(12,2) not null check (price >= 0),
  billing text not null check (billing in ('diária', 'semanal', 'mensal')),
  daily_price numeric(12,2) check (daily_price >= 0),
  weekly_price numeric(12,2) check (weekly_price >= 0),
  monthly_price numeric(12,2) check (monthly_price >= 0),
  acquisition_value numeric(12,2) check (acquisition_value >= 0),
  photo_path text check (char_length(photo_path) <= 500),
  documents text[] not null default '{}',
  notes text check (char_length(notes) <= 2000),
  vehicle jsonb,
  details jsonb not null default '{}'::jsonb,
  available boolean not null default true,
  maintenance boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_details_object check (jsonb_typeof(details) = 'object'),
  constraint products_details_size check (pg_column_size(details) <= 20000)
);
comment on column public.products.vehicle is 'DEPRECATED: replaced by details';
create index products_user_id_idx on public.products(user_id);
revoke all on public.products from anon, authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "Ver próprios produtos" on public.products for select to authenticated using (user_id = (select auth.uid()));
create policy "Criar próprios produtos" on public.products for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Editar próprios produtos" on public.products for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Excluir próprios produtos" on public.products for delete to authenticated using (user_id = (select auth.uid()));
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null check (char_length(name) between 1 and 150),
  phone text not null check (char_length(phone) between 1 and 30),
  email text check (char_length(email) <= 255),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index clients_user_id_idx on public.clients(user_id);
revoke all on public.clients from anon, authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant all on public.clients to service_role;
alter table public.clients enable row level security;
create policy "Ver próprios clientes" on public.clients for select to authenticated using (user_id = (select auth.uid()));
create policy "Criar próprios clientes" on public.clients for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Editar próprios clientes" on public.clients for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Excluir próprios clientes" on public.clients for delete to authenticated using (user_id = (select auth.uid()));
create trigger clients_updated_at before update on public.clients for each row execute function public.set_updated_at();

create table public.rentals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  total numeric(12,2) not null default 0 check (total >= 0),
  status text not null check (status in ('andamento', 'aguardando', 'finalizada', 'atrasada')),
  paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index rentals_user_id_idx on public.rentals(user_id);
create index rentals_product_id_idx on public.rentals(product_id);
create index rentals_client_id_idx on public.rentals(client_id);
revoke all on public.rentals from anon, authenticated;
grant select, insert, update, delete on public.rentals to authenticated;
grant all on public.rentals to service_role;
alter table public.rentals enable row level security;
create policy "Ver próprias locações" on public.rentals for select to authenticated using (user_id = (select auth.uid()));
create policy "Criar próprias locações" on public.rentals for insert to authenticated with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.products p where p.id = product_id and p.user_id = (select auth.uid()))
  and exists (select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid()))
);
create policy "Editar próprias locações" on public.rentals for update to authenticated using (user_id = (select auth.uid())) with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.products p where p.id = product_id and p.user_id = (select auth.uid()))
  and exists (select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid()))
);
create policy "Excluir próprias locações" on public.rentals for delete to authenticated using (user_id = (select auth.uid()));
create trigger rentals_updated_at before update on public.rentals for each row execute function public.set_updated_at();

create or replace function public.sync_product_availability()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.status <> 'finalizada' then
    update public.products set available = false where id = new.product_id;
  elsif tg_op = 'UPDATE' and new.status = 'finalizada' and old.status <> 'finalizada' then
    update public.products set available = true where id = new.product_id and maintenance = false;
  end if;
  return new;
end;
$$;
create trigger rentals_sync_product after insert or update of status on public.rentals for each row execute function public.sync_product_availability();

create table public.product_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  product_id uuid not null references public.products(id) on delete cascade,
  kind text not null check (kind in ('expense', 'maintenance', 'incident')),
  category text not null check (char_length(category) <= 80),
  description text not null default '' check (char_length(description) <= 2000),
  date date not null,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  provider text check (char_length(provider) <= 150),
  notes text check (char_length(notes) <= 2000),
  attachments text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index product_records_user_id_idx on public.product_records(user_id);
revoke all on public.product_records from anon, authenticated;
grant select, insert, update, delete on public.product_records to authenticated;
grant all on public.product_records to service_role;
alter table public.product_records enable row level security;
create policy "Ver próprios registros" on public.product_records for select to authenticated using (user_id = (select auth.uid()));
create policy "Criar próprios registros" on public.product_records for insert to authenticated with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.products p where p.id = product_id and p.user_id = (select auth.uid()))
);
create policy "Editar próprios registros" on public.product_records for update to authenticated using (user_id = (select auth.uid())) with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.products p where p.id = product_id and p.user_id = (select auth.uid()))
);
create policy "Excluir próprios registros" on public.product_records for delete to authenticated using (user_id = (select auth.uid()));

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  text text not null check (char_length(text) <= 300),
  kind text not null check (kind in ('produto', 'cliente', 'locacao', 'pagamento')),
  created_at timestamptz not null default now()
);
create index activities_user_id_created_idx on public.activities(user_id, created_at desc);
revoke all on public.activities from anon, authenticated;
grant select, insert, delete on public.activities to authenticated;
grant all on public.activities to service_role;
alter table public.activities enable row level security;
create policy "Ver próprias atividades" on public.activities for select to authenticated using (user_id = (select auth.uid()));
create policy "Criar próprias atividades" on public.activities for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Excluir próprias atividades" on public.activities for delete to authenticated using (user_id = (select auth.uid()));

create table public.client_fines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  rental_id uuid references public.rentals(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  infraction_date date not null,
  description text not null check (char_length(description) between 1 and 500),
  amount numeric(12,2) not null default 0 check (amount >= 0),
  due_date date,
  status text not null default 'pendente' check (status in ('pendente', 'paga', 'contestada')),
  attachment_path text check (char_length(attachment_path) <= 500),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index client_fines_user_id_idx on public.client_fines(user_id);
create index client_fines_client_id_idx on public.client_fines(client_id);
create index client_fines_rental_id_idx on public.client_fines(rental_id);
revoke all on public.client_fines from anon, authenticated;
grant select, insert, update, delete on public.client_fines to authenticated;
grant all on public.client_fines to service_role;
alter table public.client_fines enable row level security;
create policy "Ver próprias multas" on public.client_fines for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Criar próprias multas" on public.client_fines for insert to authenticated with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.clients c where c.id = client_fines.client_id and c.user_id = (select auth.uid()))
  and (client_fines.rental_id is null or exists (
    select 1 from public.rentals r
    where r.id = client_fines.rental_id and r.user_id = (select auth.uid()) and r.client_id = client_fines.client_id))
  and (client_fines.product_id is null or exists (
    select 1 from public.products p where p.id = client_fines.product_id and p.user_id = (select auth.uid())))
  and (client_fines.attachment_path is null or split_part(client_fines.attachment_path, '/', 1) = (select auth.uid())::text)
);
create policy "Editar próprias multas" on public.client_fines for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.clients c where c.id = client_fines.client_id and c.user_id = (select auth.uid()))
    and (client_fines.rental_id is null or exists (
      select 1 from public.rentals r
      where r.id = client_fines.rental_id and r.user_id = (select auth.uid()) and r.client_id = client_fines.client_id))
    and (client_fines.product_id is null or exists (
      select 1 from public.products p where p.id = client_fines.product_id and p.user_id = (select auth.uid())))
    and (client_fines.attachment_path is null or split_part(client_fines.attachment_path, '/', 1) = (select auth.uid())::text)
  );
create policy "Excluir próprias multas" on public.client_fines for delete to authenticated
  using (user_id = (select auth.uid()));
create trigger client_fines_updated_at before update on public.client_fines
  for each row execute function public.set_updated_at();

create policy "Ver próprios arquivos" on storage.objects for select to authenticated
  using (bucket_id = 'user-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Enviar próprios arquivos" on storage.objects for insert to authenticated
  with check (bucket_id = 'user-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Alterar próprios arquivos" on storage.objects for update to authenticated
  using (bucket_id = 'user-files' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'user-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Excluir próprios arquivos" on storage.objects for delete to authenticated
  using (bucket_id = 'user-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  dedupe_key text NOT NULL,
  kind text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('info','atencao','urgente')),
  title text NOT NULL CHECK (char_length(title) <= 200),
  body text NOT NULL DEFAULT '' CHECK (char_length(body) <= 600),
  link_type text CHECK (link_type IN ('cliente','produto','locacao')),
  link_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, dedupe_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications select" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notifications insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own notifications delete" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX notifications_user_created ON public.notifications (user_id, created_at DESC);

CREATE TABLE public.communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  rental_id uuid REFERENCES public.rentals(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('whatsapp','email')),
  template text NOT NULL,
  status text NOT NULL,
  message text NOT NULL CHECK (char_length(message) <= 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.communications TO authenticated;
GRANT ALL ON public.communications TO service_role;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own communications select" ON public.communications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own communications insert" ON public.communications FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.user_id = auth.uid())
  AND (rental_id IS NULL OR EXISTS (SELECT 1 FROM public.rentals r WHERE r.id = rental_id AND r.user_id = auth.uid()))
);

CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Ver próprios papéis" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.has_role((SELECT auth.uid()), 'admin'));

CREATE TABLE public.admin_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_user_id uuid,
  details text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_audit TO authenticated;
GRANT ALL ON public.admin_audit TO service_role;
ALTER TABLE public.admin_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins veem auditoria" ON public.admin_audit FOR SELECT TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'));

CREATE OR REPLACE FUNCTION public.admin_overview()
RETURNS TABLE (
  user_id uuid, full_name text, email text, business_name text, phone text, city text,
  created_at timestamptz, last_access_at timestamptz, is_admin boolean,
  products bigint, clients bigint, rentals bigint, returned bigint, active_rentals bigint, messages bigint,
  last_activity timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT p.id, p.full_name, p.email, p.business_name, p.phone, p.city,
    p.created_at, p.last_access_at, public.has_role(p.id, 'admin'),
    (SELECT count(*) FROM products x WHERE x.user_id = p.id),
    (SELECT count(*) FROM clients x WHERE x.user_id = p.id),
    (SELECT count(*) FROM rentals x WHERE x.user_id = p.id),
    (SELECT count(*) FROM rentals x WHERE x.user_id = p.id AND x.status = 'finalizada'),
    (SELECT count(*) FROM rentals x WHERE x.user_id = p.id AND x.status IN ('andamento','atrasada','aguardando')),
    (SELECT count(*) FROM communications x WHERE x.user_id = p.id),
    GREATEST(p.last_access_at, (SELECT max(a.created_at) FROM activities a WHERE a.user_id = p.id))
  FROM profiles p
  ORDER BY p.created_at DESC;
END $$;
REVOKE ALL ON FUNCTION public.admin_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_overview() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_role(_target uuid, _make_admin boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;
  IF _target = auth.uid() AND NOT _make_admin THEN
    RAISE EXCEPTION 'Você não pode remover seu próprio acesso de administrador';
  END IF;
  IF _make_admin THEN
    INSERT INTO user_roles (user_id, role) VALUES (_target, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM user_roles WHERE user_id = _target AND role = 'admin';
  END IF;
  INSERT INTO admin_audit (admin_id, action, target_user_id)
  VALUES (auth.uid(), CASE WHEN _make_admin THEN 'tornar_admin' ELSE 'remover_admin' END, _target);
END $$;
REVOKE ALL ON FUNCTION public.admin_set_role(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_role(uuid, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_log_view()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado' USING ERRCODE = '42501';
  END IF;
  INSERT INTO admin_audit (admin_id, action) VALUES (auth.uid(), 'abriu_painel');
END $$;
REVOKE ALL ON FUNCTION public.admin_log_view() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_log_view() TO authenticated;