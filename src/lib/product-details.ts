// Informações específicas do produto, de acordo com a categoria.
// Os valores são guardados no campo `details` do produto; campos personalizados ficam em `details.custom`.

export type DetailFieldType = "text" | "number" | "select" | "yesno" | "textarea";
export type DetailField = {
  key: string;
  label: string;
  type: DetailFieldType;
  placeholder?: string;
  options?: string[];
  /** Para números: aceita casas decimais. */
  decimal?: boolean;
  min?: number;
  max?: number;
  suffix?: string;
  /** Ocupa a linha inteira no formulário. */
  wide?: boolean;
  upper?: boolean;
};
export type CustomField = { label: string; value: string };
export type DetailValue = string | number | boolean;
export type ProductDetails = { [key: string]: DetailValue | CustomField[] | undefined; custom?: CustomField[] };

const CONSERVACAO = ["Novo", "Ótimo", "Bom", "Regular", "Precisa de reparo"];
const YEAR = { min: 1900, max: 2100 };

export const DETAIL_FIELDS: Record<string, DetailField[]> = {
  "Veículos": [
    { key: "marca", label: "Marca", type: "text", placeholder: "Ex.: Volkswagen" },
    { key: "modelo", label: "Modelo", type: "text", placeholder: "Ex.: Gol" },
    { key: "versao", label: "Versão", type: "text", placeholder: "Ex.: 1.0 MPI" },
    { key: "cor", label: "Cor", type: "text", placeholder: "Ex.: Prata" },
    { key: "anoFabricacao", label: "Ano de fabricação", type: "number", placeholder: "Ex.: 2021", ...YEAR },
    { key: "anoModelo", label: "Ano do modelo", type: "number", placeholder: "Ex.: 2022", ...YEAR },
    { key: "placa", label: "Placa", type: "text", placeholder: "Ex.: ABC1D23", upper: true },
    { key: "combustivel", label: "Combustível", type: "select", options: ["Gasolina", "Etanol", "Flex", "Diesel", "GNV", "Elétrico", "Híbrido"] },
    { key: "transmissao", label: "Transmissão", type: "select", options: ["Manual", "Automática"] },
    { key: "lugares", label: "Quantidade de lugares", type: "number", placeholder: "Ex.: 5", min: 1, max: 100 },
    { key: "quilometragem", label: "Quilometragem atual (opcional)", type: "number", placeholder: "Ex.: 45000", suffix: "km", wide: true },
  ],
  "Ferramentas e equipamentos": [
    { key: "tipoEquipamento", label: "Tipo de equipamento", type: "text", placeholder: "Ex.: Furadeira" },
    { key: "marca", label: "Marca", type: "text", placeholder: "Ex.: Bosch" },
    { key: "modelo", label: "Modelo", type: "text", placeholder: "Ex.: GSB 13 RE" },
    { key: "potencia", label: "Potência", type: "text", placeholder: "Ex.: 650W" },
    { key: "voltagem", label: "Voltagem", type: "select", options: ["110V", "220V", "Bivolt", "Não se aplica"] },
    { key: "conservacao", label: "Estado de conservação", type: "select", options: CONSERVACAO },
    { key: "especificacao", label: "Capacidade ou especificação técnica", type: "text", placeholder: "Ex.: Mandril de 13 mm", wide: true },
    { key: "numeroSerie", label: "Número de série (opcional)", type: "text", placeholder: "Ex.: 123456789", wide: true },
    { key: "acessorios", label: "Acessórios inclusos", type: "textarea", placeholder: "Ex.: Maleta, 2 brocas e chave de mandril", wide: true },
  ],
  "Roupas e acessórios": [
    { key: "tipoPeca", label: "Tipo de peça ou acessório", type: "text", placeholder: "Ex.: Vestido longo" },
    { key: "marca", label: "Marca", type: "text", placeholder: "Ex.: Ateliê Flor" },
    { key: "tamanho", label: "Tamanho", type: "text", placeholder: "Ex.: M ou 40" },
    { key: "cor", label: "Cor", type: "text", placeholder: "Ex.: Azul-marinho" },
    { key: "material", label: "Material", type: "text", placeholder: "Ex.: Cetim" },
    { key: "pecasInclusas", label: "Peças inclusas", type: "number", placeholder: "Ex.: 1", min: 1, max: 1000 },
    { key: "conservacao", label: "Estado de conservação", type: "select", options: CONSERVACAO, wide: true },
  ],
  "Espaços para eventos": [
    { key: "tipoEspaco", label: "Tipo de espaço", type: "text", placeholder: "Ex.: Salão de festas" },
    { key: "capacidade", label: "Capacidade máxima (pessoas)", type: "number", placeholder: "Ex.: 120", min: 1, max: 100000 },
    { key: "area", label: "Área aproximada", type: "number", placeholder: "Ex.: 200", decimal: true, suffix: "m²" },
    { key: "banheiros", label: "Banheiros", type: "number", placeholder: "Ex.: 2", max: 1000 },
    { key: "vagas", label: "Vagas de estacionamento", type: "number", placeholder: "Ex.: 10", max: 10000 },
    { key: "cozinha", label: "Possui cozinha?", type: "yesno" },
    { key: "areaCoberta", label: "Possui área coberta?", type: "yesno" },
    { key: "churrasqueira", label: "Possui churrasqueira?", type: "yesno" },
    { key: "piscina", label: "Possui piscina?", type: "yesno" },
    { key: "outrosRecursos", label: "Outros recursos ou comodidades", type: "textarea", placeholder: "Ex.: Som ambiente, mesas e cadeiras", wide: true },
  ],
  "Imóveis": [
    { key: "tipoImovel", label: "Tipo de imóvel", type: "text", placeholder: "Ex.: Apartamento" },
    { key: "quartos", label: "Quartos", type: "number", placeholder: "Ex.: 2", max: 100 },
    { key: "suites", label: "Suítes", type: "number", placeholder: "Ex.: 1", max: 100 },
    { key: "banheiros", label: "Banheiros", type: "number", placeholder: "Ex.: 2", max: 100 },
    { key: "vagasGaragem", label: "Vagas de garagem", type: "number", placeholder: "Ex.: 1", max: 100 },
    { key: "area", label: "Área aproximada", type: "number", placeholder: "Ex.: 65", decimal: true, suffix: "m²" },
    { key: "mobiliado", label: "Mobiliado?", type: "yesno", wide: true },
    { key: "endereco", label: "Endereço ou localização", type: "text", placeholder: "Ex.: Rua das Flores, 120 — Centro", wide: true },
  ],
};

export const CUSTOM_FIELDS_CATEGORY = "Outros";
export const MAX_CUSTOM_FIELDS = 30;
const MAX_TEXT = 300;
const MAX_LONG_TEXT = 1000;

export const fieldsFor = (category: string) => DETAIL_FIELDS[category] ?? [];
export const allowsCustomFields = (category: string) => category === CUSTOM_FIELDS_CATEGORY;

/** Valores do formulário: tudo como texto ("sim"/"nao" para perguntas de sim ou não). */
export type DetailForm = { values: Record<string, string>; custom: CustomField[] };

export function detailsToForm(details: ProductDetails | null | undefined): DetailForm {
  const values: Record<string, string> = {};
  const custom: CustomField[] = [];
  if (!details || typeof details !== "object") return { values, custom };
  for (const [k, v] of Object.entries(details)) {
    if (k === "custom") continue;
    if (typeof v === "boolean") values[k] = v ? "sim" : "nao";
    else if (typeof v === "number" || typeof v === "string") values[k] = String(v);
  }
  if (Array.isArray(details.custom)) {
    for (const c of details.custom) if (c && typeof c.label === "string") custom.push({ label: c.label, value: String(c.value ?? "") });
  }
  return { values, custom };
}

/** Indica se há alguma informação específica preenchida para a categoria. */
export function hasDetailValues(category: string, form: DetailForm) {
  const filled = fieldsFor(category).some((f) => (form.values[f.key] ?? "").trim() !== "");
  const customFilled = allowsCustomFields(category) && form.custom.some((c) => c.label.trim() || c.value.trim());
  return filled || customFilled;
}

/**
 * Monta as informações que serão salvas: só os campos da categoria escolhida, sem campos vazios.
 * Devolve uma mensagem de erro clara quando algum valor não é válido.
 */
export function buildDetails(category: string, form: DetailForm): { details: ProductDetails; error?: string } {
  const details: ProductDetails = {};
  for (const f of fieldsFor(category)) {
    const raw = (form.values[f.key] ?? "").trim();
    if (!raw) continue;
    if (f.type === "number") {
      const n = Number(raw.replace(",", "."));
      const min = f.min ?? 0;
      if (!Number.isFinite(n) || (!f.decimal && !Number.isInteger(n)) || n < min || (f.max !== undefined && n > f.max)) {
        return { details: {}, error: `Confira o campo "${f.label}": digite um número válido${f.max !== undefined ? ` entre ${min} e ${f.max}` : ""}.` };
      }
      details[f.key] = n;
    } else if (f.type === "yesno") {
      if (raw === "sim" || raw === "nao") details[f.key] = raw === "sim";
    } else if (f.type === "select") {
      if (f.options?.includes(raw)) details[f.key] = raw;
    } else {
      const max = f.type === "textarea" ? MAX_LONG_TEXT : MAX_TEXT;
      if (raw.length > max) return { details: {}, error: `O campo "${f.label}" pode ter no máximo ${max} letras.` };
      details[f.key] = f.upper ? raw.toUpperCase() : raw;
    }
  }
  if (allowsCustomFields(category)) {
    const custom: CustomField[] = [];
    for (const c of form.custom) {
      const label = c.label.trim();
      const value = c.value.trim();
      if (!label && !value) continue;
      if (!label) return { details: {}, error: "Dê um nome para cada campo personalizado." };
      if (label.length > 60) return { details: {}, error: "O nome de um campo personalizado pode ter no máximo 60 letras." };
      if (value.length > MAX_TEXT) return { details: {}, error: `O valor de "${label}" pode ter no máximo ${MAX_TEXT} letras.` };
      custom.push({ label, value });
    }
    if (custom.length > MAX_CUSTOM_FIELDS) return { details: {}, error: `Você pode adicionar até ${MAX_CUSTOM_FIELDS} campos personalizados.` };
    if (custom.length) details.custom = custom;
  }
  return { details };
}

/** Lista de informações para mostrar nos detalhes do produto (rótulo e valor já formatados). */
export function detailEntries(category: string, details: ProductDetails | null | undefined): { label: string; value: string }[] {
  if (!details) return [];
  const out: { label: string; value: string }[] = [];
  for (const f of fieldsFor(category)) {
    const v = details[f.key];
    if (v === undefined || v === null || v === "" || Array.isArray(v)) continue;
    let value: string;
    if (typeof v === "boolean") value = v ? "Sim" : "Não";
    else if (typeof v === "number") value = (f.key.startsWith("ano") ? String(v) : v.toLocaleString("pt-BR")) + (f.suffix ? ` ${f.suffix}` : "");
    else value = v;
    out.push({ label: f.label.replace(" (opcional)", ""), value });
  }
  if (Array.isArray(details.custom)) for (const c of details.custom) out.push({ label: c.label, value: c.value || "—" });
  return out;
}

/** Resumo curto (até 3 informações) para o cartão do produto. */
export function detailSummary(category: string, details: ProductDetails | null | undefined) {
  return detailEntries(category, details).slice(0, 3).map((e) => e.value).join(" · ");
}
