-- Quantidade e arquivamento
ALTER TABLE public.products ADD COLUMN quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 1000000);
ALTER TABLE public.products ADD COLUMN archived_at timestamptz;
ALTER TABLE public.clients ADD COLUMN archived_at timestamptz;
ALTER TABLE public.rentals ADD COLUMN quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 1000000);
ALTER TABLE public.rentals ADD COLUMN cancelled_at timestamptz;
ALTER TABLE public.rentals DROP CONSTRAINT rentals_status_check;
ALTER TABLE public.rentals ADD CONSTRAINT rentals_status_check CHECK (status IN ('andamento', 'aguardando', 'finalizada', 'atrasada', 'cancelada'));
CREATE INDEX rentals_product_period_idx ON public.rentals (product_id, start_date, end_date);

-- "available" passa a ser só a marcação manual do dono (disponível/indisponível); estoque é calculado pelas datas.
DROP TRIGGER IF EXISTS rentals_sync_product ON public.rentals;
COMMENT ON FUNCTION public.sync_product_availability() IS 'DEPRECATED: replaced by quantity-based check_rental_availability';

-- Validação de disponibilidade no banco (com trava na linha do produto contra pedidos simultâneos)
CREATE OR REPLACE FUNCTION public.check_rental_availability()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  p public.products%ROWTYPE;
  used integer;
  needs_check boolean;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'cancelada' AND NEW.status <> 'cancelada' THEN
      RAISE EXCEPTION 'Esta locação foi cancelada e não pode ser reaberta nem marcada como devolvida.' USING ERRCODE = 'P0001';
    END IF;
    IF OLD.status = 'finalizada' AND NEW.status = 'cancelada' THEN
      RAISE EXCEPTION 'Esta locação já foi devolvida e não pode ser cancelada.' USING ERRCODE = 'P0001';
    END IF;
    IF NEW.status = 'cancelada' AND OLD.status <> 'cancelada' THEN
      NEW.cancelled_at := now();
    END IF;
  END IF;

  IF NEW.status IN ('finalizada', 'cancelada') THEN
    RETURN NEW;
  END IF;

  needs_check := TG_OP = 'INSERT'
    OR NEW.product_id IS DISTINCT FROM OLD.product_id
    OR NEW.start_date IS DISTINCT FROM OLD.start_date
    OR NEW.end_date IS DISTINCT FROM OLD.end_date
    OR NEW.quantity IS DISTINCT FROM OLD.quantity
    OR OLD.status IN ('finalizada', 'cancelada');
  IF NOT needs_check THEN
    RETURN NEW;
  END IF;

  -- Trava o produto: duas reservas ao mesmo tempo esperam uma pela outra.
  SELECT * INTO p FROM public.products WHERE id = NEW.product_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado.' USING ERRCODE = 'P0001';
  END IF;
  IF p.archived_at IS NOT NULL THEN
    RAISE EXCEPTION 'Este produto está arquivado e não aceita novas reservas.' USING ERRCODE = 'P0001';
  END IF;
  IF NOT p.available OR p.maintenance THEN
    RAISE EXCEPTION 'Este produto está marcado como indisponível e não aceita reservas.' USING ERRCODE = 'P0001';
  END IF;

  SELECT coalesce(sum(r.quantity), 0) INTO used
  FROM public.rentals r
  WHERE r.product_id = NEW.product_id
    AND r.id <> NEW.id
    AND r.status NOT IN ('finalizada', 'cancelada')
    AND r.start_date <= NEW.end_date
    AND r.end_date >= NEW.start_date;

  IF used + NEW.quantity > p.quantity THEN
    RAISE EXCEPTION 'Estoque insuficiente neste período: % de % unidade(s) já reservada(s); disponível: %.',
      used, p.quantity, greatest(p.quantity - used, 0) USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER rentals_check_availability BEFORE INSERT OR UPDATE ON public.rentals
  FOR EACH ROW EXECUTE FUNCTION public.check_rental_availability();

-- Impede reduzir o estoque abaixo do que já está comprometido (hoje em diante)
CREATE OR REPLACE FUNCTION public.check_product_quantity()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  peak integer;
BEGIN
  IF NEW.quantity >= OLD.quantity THEN
    RETURN NEW;
  END IF;
  SELECT coalesce(max(s.total), 0) INTO peak FROM (
    SELECT (SELECT sum(r2.quantity) FROM public.rentals r2
            WHERE r2.product_id = NEW.id AND r2.status NOT IN ('finalizada', 'cancelada')
              AND r2.start_date <= d.day AND r2.end_date >= d.day) AS total
    FROM (SELECT greatest(r.start_date, current_date) AS day FROM public.rentals r
          WHERE r.product_id = NEW.id AND r.status NOT IN ('finalizada', 'cancelada') AND r.end_date >= current_date) d
  ) s;
  IF NEW.quantity < peak THEN
    RAISE EXCEPTION 'Não é possível reduzir o estoque para %: já há % unidade(s) reservada(s) no mesmo período.', NEW.quantity, peak USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER products_check_quantity BEFORE UPDATE OF quantity ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.check_product_quantity();

-- Exclusão só sem histórico
CREATE OR REPLACE FUNCTION public.guard_product_delete()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.rentals WHERE product_id = OLD.id)
     OR EXISTS (SELECT 1 FROM public.product_records WHERE product_id = OLD.id)
     OR EXISTS (SELECT 1 FROM public.client_fines WHERE product_id = OLD.id) THEN
    RAISE EXCEPTION 'Este produto tem histórico e não pode ser excluído. Use "Arquivar".' USING ERRCODE = 'P0001';
  END IF;
  RETURN OLD;
END;
$$;
CREATE TRIGGER products_guard_delete BEFORE DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.guard_product_delete();

CREATE OR REPLACE FUNCTION public.guard_client_delete()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.rentals WHERE client_id = OLD.id)
     OR EXISTS (SELECT 1 FROM public.client_fines WHERE client_id = OLD.id)
     OR EXISTS (SELECT 1 FROM public.communications WHERE client_id = OLD.id) THEN
    RAISE EXCEPTION 'Este cliente tem histórico e não pode ser excluído. Use "Desativar".' USING ERRCODE = 'P0001';
  END IF;
  RETURN OLD;
END;
$$;
CREATE TRIGGER clients_guard_delete BEFORE DELETE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.guard_client_delete();

-- Locações nunca são apagadas: só canceladas
DROP POLICY "Excluir próprias locações" ON public.rentals;
REVOKE DELETE ON public.rentals FROM authenticated;