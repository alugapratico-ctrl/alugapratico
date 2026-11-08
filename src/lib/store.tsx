import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import type { ProductDetails } from "@/lib/product-details";
import { attachmentError, type Fine, type FineStatus } from "@/lib/fines";

const pad = (n: number) => String(n).padStart(2, "0");
export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// Data de hoje no horário do navegador (as páginas privadas só desenham no navegador).
export const TODAY = toISODate(new Date());

export type Billing = "diária" | "semanal" | "mensal";
export type VehicleDetails = {
  brand?: string;
  model?: string;
  year?: string;
  plate?: string;
  color?: string;
  mileage?: string;
  document?: string;
};
export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  billing: Billing;
  dailyPrice?: number | undefined;
  weeklyPrice?: number | undefined;
  monthlyPrice?: number | undefined;
  acquisitionValue?: number | undefined;
  photo?: string | undefined;
  photoPath?: string | undefined;
  documents?: string[] | undefined;
  notes?: string | undefined;
  vehicle?: VehicleDetails | undefined;
  details: ProductDetails;
  available: boolean;
  maintenance?: boolean | undefined;
};
export type ProductInput = Pick<Product, "name" | "category" | "description" | "price" | "billing" | "available" | "details">;
export type ProductRecordKind = "expense" | "maintenance" | "incident";
export type ProductRecord = {
  id: string;
  productId: string;
  kind: ProductRecordKind;
  category: string;
  description: string;
  date: string;
  amount: number;
  provider?: string | undefined;
  notes?: string | undefined;
  attachments?: string[] | undefined;
};
export type Client = { id: string; name: string; phone: string; email?: string | undefined; notes?: string | undefined };
export type RentalStatus = "andamento" | "aguardando" | "finalizada" | "atrasada";
export type Rental = {
  id: string;
  clientId: string;
  productId: string;
  start: string;
  end: string;
  total: number;
  status: RentalStatus;
  paid: boolean;
};
export type Activity = { id: string; text: string; when: string; kind: "produto" | "cliente" | "locacao" | "pagamento" };

export const CATEGORIES = ["Veículos", "Ferramentas e equipamentos", "Roupas e acessórios", "Espaços para eventos", "Imóveis", "Outros"];

export const STATUS_INFO: Record<RentalStatus, { label: string; className: string; dot: string }> = {
  andamento: { label: "Em andamento", className: "bg-info-soft text-info", dot: "bg-info" },
  aguardando: { label: "Aguardando retirada", className: "bg-warning-soft text-warning", dot: "bg-warning" },
  finalizada: { label: "Finalizada", className: "bg-success-soft text-success", dot: "bg-success" },
  atrasada: { label: "Atrasada", className: "bg-danger-soft text-destructive", dot: "bg-destructive" },
};

export const BUCKET = "user-files";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function relativeTime(iso: string, now = Date.now()) {
  const diff = Math.max(0, now - Date.parse(iso));
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Agora mesmo";
  if (min < 60) return `Há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Há ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Ontem";
  if (d < 7) return `Há ${d} dias`;
  return fmtDate(iso.slice(0, 10));
}

/** Mensagem clara para falhas ao salvar ou carregar dados. */
export function dataErrorMessage(error: { message?: string; code?: string } | null | undefined) {
  const msg = (error?.message ?? "").toLowerCase();
  if ((typeof navigator !== "undefined" && !navigator.onLine) || msg.includes("failed to fetch") || msg.includes("load failed"))
    return "Sem conexão com a internet. Verifique sua conexão e tente novamente.";
  if (error?.code === "42501" || msg.includes("row-level security") || msg.includes("permission"))
    return "Você não tem permissão para fazer isso.";
  if (error?.code === "23503") return "Este item está ligado a outro registro e não pode ser alterado assim.";
  if (msg.includes("jwt") || msg.includes("auth")) return "Sua sessão expirou. Entre novamente.";
  return "Não foi possível salvar agora. Tente novamente.";
}

class DataError extends Error {}
function check<T extends { error: { message?: string; code?: string } | null }>(res: T): T {
  if (res.error) throw new DataError(dataErrorMessage(res.error));
  return res;
}

const num = (v: number | string | null | undefined) => (v === null || v === undefined ? undefined : Number(v));

function mapProduct(row: Tables<"products">, urls: Map<string, string>): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    price: Number(row.price),
    billing: row.billing as Billing,
    dailyPrice: num(row.daily_price),
    weeklyPrice: num(row.weekly_price),
    monthlyPrice: num(row.monthly_price),
    acquisitionValue: num(row.acquisition_value),
    photoPath: row.photo_path ?? undefined,
    photo: row.photo_path ? urls.get(row.photo_path) : undefined,
    documents: row.documents ?? [],
    notes: row.notes ?? undefined,
    vehicle: (row.vehicle as VehicleDetails | null) ?? undefined,
    details: row.details && typeof row.details === "object" && !Array.isArray(row.details) ? (row.details as ProductDetails) : {},
    available: row.available,
    maintenance: row.maintenance,
  };
}

function mapRental(row: Tables<"rentals">): Rental {
  const status = row.status as RentalStatus;
  return {
    id: row.id,
    clientId: row.client_id,
    productId: row.product_id,
    start: row.start_date,
    end: row.end_date,
    total: Number(row.total),
    // Locação em andamento que passou da data de devolução aparece como atrasada.
    status: status === "andamento" && row.end_date < TODAY ? "atrasada" : status,
    paid: row.paid,
  };
}

async function fetchAll(userId: string) {
  const [p, c, r, pr, a, fi] = await Promise.all([
    supabase.from("products").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("clients").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("rentals").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("product_records").select("*").eq("user_id", userId).order("date", { ascending: false }),
    supabase.from("activities").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    supabase.from("client_fines").select("*").eq("user_id", userId).order("infraction_date", { ascending: false }),
  ]);
  [p, c, r, pr, a, fi].forEach(check);

  const paths = [
    ...(p.data ?? []).map((x) => x.photo_path),
    ...(fi.data ?? []).map((x) => x.attachment_path),
  ].filter((x): x is string => !!x);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60 * 12);
    data?.forEach((s) => { if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl); });
  }

  return {
    products: (p.data ?? []).map((row) => mapProduct(row, urls)),
    clients: (c.data ?? []).map((row): Client => ({ id: row.id, name: row.name, phone: row.phone, email: row.email ?? undefined, notes: row.notes ?? undefined })),
    rentals: (r.data ?? []).map(mapRental),
    productRecords: (pr.data ?? []).map((row): ProductRecord => ({
      id: row.id, productId: row.product_id, kind: row.kind as ProductRecordKind, category: row.category, description: row.description,
      date: row.date, amount: Number(row.amount), provider: row.provider ?? undefined, notes: row.notes ?? undefined, attachments: row.attachments ?? [],
    })),
    activities: (a.data ?? []).map((row): Activity => ({ id: row.id, text: row.text, kind: row.kind as Activity["kind"], when: relativeTime(row.created_at) })),
    fines: (fi.data ?? []).map((row): Fine => ({
      id: row.id, clientId: row.client_id, rentalId: row.rental_id ?? undefined, productId: row.product_id ?? undefined,
      infractionDate: row.infraction_date, description: row.description, amount: Number(row.amount), dueDate: row.due_date ?? undefined,
      status: row.status as FineStatus, attachmentPath: row.attachment_path ?? undefined,
      attachmentUrl: row.attachment_path ? urls.get(row.attachment_path) : undefined, notes: row.notes ?? undefined,
    })),
  };
}

/** Envia o anexo de uma multa (foto ou PDF) para a pasta privada do usuário. */
async function uploadFineAttachment(userId: string, file: File) {
  const err = attachmentError(file);
  if (err) throw new DataError(err);
  const ext = (file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "") || (file.type === "application/pdf" ? "pdf" : "jpg");
  const path = `${userId}/multas/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new DataError(dataErrorMessage(error));
  return path;
}

export type FineInput = Omit<Fine, "id" | "attachmentPath" | "attachmentUrl">;

/** Envia uma imagem para a pasta privada do usuário e devolve o caminho salvo. */
export async function uploadUserImage(userId: string, folder: "produtos" | "perfil", file: File) {
  if (!file.type.startsWith("image/")) throw new DataError("Escolha um arquivo de imagem (foto).");
  if (file.size > MAX_PHOTO_BYTES) throw new DataError("A foto é muito grande. Escolha uma de até 5 MB.");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new DataError(dataErrorMessage(error));
  return path;
}

type Data = Awaited<ReturnType<typeof fetchAll>>;
type Store = Data & {
  userId: string;
  addProduct: (p: ProductInput, photoFile?: File) => Promise<void>;
  updateProduct: (id: string, p: ProductInput, photoFile?: File) => Promise<void>;
  addProductRecord: (record: Omit<ProductRecord, "id">) => Promise<void>;
  finishProductMaintenance: (productId: string) => Promise<void>;
  addClient: (c: Omit<Client, "id">) => Promise<void>;
  addRental: (r: Omit<Rental, "id">) => Promise<void>;
  finishRental: (id: string) => Promise<void>;
  addFine: (f: FineInput, file?: File) => Promise<void>;
  updateFine: (id: string, f: FineInput, opts?: { file?: File | undefined; removeAttachment?: boolean }) => Promise<void>;
  setFineStatus: (id: string, status: FineStatus) => Promise<void>;
  deleteFine: (id: string) => Promise<void>;
};

const Ctx = createContext<Store | null>(null);

export const storeKey = (userId: string) => ["dados", userId] as const;

export function StoreProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: storeKey(userId), queryFn: () => fetchAll(userId), staleTime: 30_000 });

  if (query.isPending) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center" role="status">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg font-semibold text-foreground">Carregando seus dados…</p>
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-soft text-destructive"><WifiOff className="h-8 w-8" /></span>
        <h1 className="text-2xl font-extrabold text-foreground">Não conseguimos carregar seus dados</h1>
        <p className="text-base text-muted-foreground">{query.error instanceof Error ? query.error.message : "Verifique sua internet e tente novamente."}</p>
        <Button size="lg" className="h-14 px-8 text-lg" onClick={() => query.refetch()}>Tentar novamente</Button>
      </div>
    );
  }

  const refresh = () => queryClient.invalidateQueries({ queryKey: storeKey(userId) });
  const log = async (text: string, kind: Activity["kind"]) => {
    await supabase.from("activities").insert({ user_id: userId, text: text.slice(0, 300), kind });
  };
  const productRow = (p: ProductInput) => ({
    name: p.name.trim(),
    category: p.category,
    description: p.description.trim(),
    price: p.price,
    billing: p.billing,
    available: p.available,
    details: p.details as Json,
  });
  const fineRow = (f: FineInput) => ({
    client_id: f.clientId,
    rental_id: f.rentalId ?? null,
    product_id: f.productId ?? null,
    infraction_date: f.infractionDate,
    description: f.description.trim(),
    amount: f.amount,
    due_date: f.dueDate ?? null,
    status: f.status,
    notes: f.notes?.trim() || null,
  });
  const clientName = (id: string) => query.data.clients.find((c) => c.id === id)?.name ?? "cliente";

  const store: Store = {
    ...query.data,
    userId,
    addProduct: async (p, photoFile) => {
      const photo_path = photoFile ? await uploadUserImage(userId, "produtos", photoFile) : null;
      check(await supabase.from("products").insert({ ...productRow(p), user_id: userId, photo_path }));
      await log(`Produto cadastrado: ${p.name}`, "produto");
      await refresh();
    },
    updateProduct: async (id, p, photoFile) => {
      const old = query.data.products.find((x) => x.id === id);
      const photo_path = photoFile ? await uploadUserImage(userId, "produtos", photoFile) : undefined;
      check(await supabase.from("products").update({ ...productRow(p), ...(photo_path ? { photo_path } : {}) }).eq("id", id).eq("user_id", userId));
      if (photo_path && old?.photoPath) await supabase.storage.from(BUCKET).remove([old.photoPath]);
      await log(`Produto atualizado: ${p.name}`, "produto");
      await refresh();
    },
    addProductRecord: async (record) => {
      check(await supabase.from("product_records").insert({
        user_id: userId, product_id: record.productId, kind: record.kind, category: record.category, description: record.description,
        date: record.date, amount: record.amount, provider: record.provider ?? null, notes: record.notes ?? null, attachments: record.attachments ?? [],
      }));
      if (record.kind === "maintenance") {
        check(await supabase.from("products").update({ available: false, maintenance: true }).eq("id", record.productId).eq("user_id", userId));
      }
      const product = query.data.products.find((p) => p.id === record.productId);
      await log(`Novo registro em ${product?.name ?? "produto"}: ${record.category}`, "produto");
      await refresh();
    },
    finishProductMaintenance: async (productId) => {
      check(await supabase.from("products").update({ available: true, maintenance: false }).eq("id", productId).eq("user_id", userId));
      await log("Manutenção concluída; produto disponível novamente", "produto");
      await refresh();
    },
    addClient: async (c) => {
      check(await supabase.from("clients").insert({ user_id: userId, name: c.name.trim(), phone: c.phone.trim(), email: c.email?.trim() || null, notes: c.notes?.trim() || null }));
      await log(`Cliente cadastrado: ${c.name}`, "cliente");
      await refresh();
    },
    addRental: async (r) => {
      // A disponibilidade do produto é atualizada pelo próprio banco de dados.
      check(await supabase.from("rentals").insert({
        user_id: userId, client_id: r.clientId, product_id: r.productId, start_date: r.start, end_date: r.end, total: r.total, status: r.status, paid: r.paid,
      }));
      const prod = query.data.products.find((p) => p.id === r.productId);
      const cli = query.data.clients.find((c) => c.id === r.clientId);
      await log(`Nova locação: ${prod?.name ?? "produto"} para ${cli?.name ?? "cliente"}`, "locacao");
      await refresh();
    },
    finishRental: async (id) => {
      check(await supabase.from("rentals").update({ status: "finalizada", paid: true }).eq("id", id).eq("user_id", userId));
      await log("Uma locação foi finalizada e o produto voltou a ficar disponível", "locacao");
      await refresh();
    },
    addFine: async (f, file) => {
      const attachment_path = file ? await uploadFineAttachment(userId, file) : null;
      const res = await supabase.from("client_fines").insert({ ...fineRow(f), user_id: userId, attachment_path });
      if (res.error && attachment_path) await supabase.storage.from(BUCKET).remove([attachment_path]);
      check(res);
      await log(`Multa registrada para ${clientName(f.clientId)}`, "cliente");
      await refresh();
    },
    updateFine: async (id, f, opts) => {
      const old = query.data.fines.find((x) => x.id === id);
      const newPath = opts?.file ? await uploadFineAttachment(userId, opts.file) : undefined;
      const attachment = newPath ? { attachment_path: newPath } : opts?.removeAttachment ? { attachment_path: null } : {};
      const res = await supabase.from("client_fines").update({ ...fineRow(f), ...attachment }).eq("id", id).eq("user_id", userId);
      if (res.error && newPath) await supabase.storage.from(BUCKET).remove([newPath]);
      check(res);
      if ((newPath || opts?.removeAttachment) && old?.attachmentPath) await supabase.storage.from(BUCKET).remove([old.attachmentPath]);
      await log(`Multa atualizada de ${clientName(f.clientId)}`, "cliente");
      await refresh();
    },
    setFineStatus: async (id, status) => {
      check(await supabase.from("client_fines").update({ status }).eq("id", id).eq("user_id", userId));
      await refresh();
    },
    deleteFine: async (id) => {
      const old = query.data.fines.find((x) => x.id === id);
      check(await supabase.from("client_fines").delete().eq("id", id).eq("user_id", userId));
      if (old?.attachmentPath) await supabase.storage.from(BUCKET).remove([old.attachmentPath]);
      if (old) await log(`Multa excluída de ${clientName(old.clientId)}`, "cliente");
      await refresh();
    },
  };
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore fora do StoreProvider");
  return s;
}

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
export const daysBetween = (a: string, b: string) =>
  Math.max(1, Math.round((Date.parse(b) - Date.parse(a)) / 86400000));

export function calcTotal(price: number, billing: Billing, start: string, end: string) {
  const days = daysBetween(start, end);
  const unit = billing === "diária" ? 1 : billing === "semanal" ? 7 : 30;
  return Math.ceil(days / unit) * price;
}

const MONTH_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
/** Receita (locações pagas) e quantidade de locações dos últimos meses, pela data de retirada. */
export function monthlySummary(rentals: Rental[], months = 6, today = TODAY) {
  const [y = 0, m = 1] = today.split("-").map(Number);
  return Array.from({ length: months }, (_, i) => {
    const t = (m - 1) - (months - 1 - i);
    const yy = y + Math.floor(t / 12);
    const mm = ((t % 12) + 12) % 12;
    const prefix = `${yy}-${pad(mm + 1)}`;
    const inMonth = rentals.filter((r) => r.start.startsWith(prefix));
    return { mes: MONTH_SHORT[mm], valor: inMonth.filter((r) => r.paid).reduce((s, r) => s + r.total, 0), qtd: inMonth.length };
  });
}
