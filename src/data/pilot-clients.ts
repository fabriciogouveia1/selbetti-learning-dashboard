// Clientes do piloto Selbetti Learning.
// Fonte: planilha "Acompanhamento de Inscrições Selbetti learning (Enxuta).xlsx".
// A Twygo não guarda Diretoria / Ref. comercial / AM / data de cadastro,
// então esses dados ficam aqui. Cliente novo: adicione uma linha abaixo.
//
// `match`: trechos (sem acento, minúsculos) que identificam o cliente no campo
// `enterprise` dos usuários da Twygo.

export type PilotClient = {
  key: string;
  name: string;
  match: string[];
  diretoria: string;
  refComercial: string;
  am: string;
  /** Data de cadastro do cliente (YYYY-MM-DD). */
  cadastro: string;
};

export const PILOT_CLIENTS: PilotClient[] = [
  {
    key: "credigente",
    name: "Credi&Gente",
    match: ["credi&gente"],
    diretoria: "Edenei Pereira",
    refComercial: "Helcio França",
    am: "Edir Helena Pereira",
    cadastro: "2026-08-26",
  },
  {
    key: "gelprime",
    name: "Gelprime",
    match: ["gelprime"],
    diretoria: "Edenei Pereira",
    refComercial: "Helcio França",
    am: "André Silvano dos Santos",
    cadastro: "2026-08-26",
  },
  {
    key: "unimed-sc",
    name: "Unimed Santa Catarina",
    match: ["unimed santa catarina"],
    diretoria: "Edenei Pereira",
    refComercial: "Rodrigo Bedin",
    am: "Ediney Menegatti Saturno",
    cadastro: "2026-09-02",
  },
  {
    key: "calcenter",
    name: "Calcenter",
    match: ["calcenter"],
    diretoria: "Edenei Pereira",
    refComercial: "Rodrigo Bedin",
    am: "Diego Alberto Probst",
    cadastro: "2026-09-02",
  },
  {
    key: "copercampos",
    name: "Copercampos",
    match: ["copercampos", "campos novos"],
    diretoria: "Edenei Pereira",
    refComercial: "Rodrigo Bedin",
    am: "Amarildo Nunes Neto",
    cadastro: "2026-09-04",
  },
  {
    key: "plaenge",
    name: "Plaenge",
    match: ["plaenge"],
    diretoria: "Edenei Pereira",
    refComercial: "Helcio França",
    am: "André Silvano dos Santos",
    cadastro: "2026-09-08",
  },
  {
    key: "unimed-rs",
    name: "Unimed Central de Serviços-RS",
    match: ["unimed central"],
    diretoria: "Edenei Pereira",
    refComercial: "Higor Keller",
    am: "Ketlin Salomão",
    cadastro: "2026-09-11",
  },
  {
    key: "anima",
    name: "Ânima Holding",
    match: ["anima holding", "anima"],
    diretoria: "Luiz Gustavo",
    refComercial: "Rodrigo Porto",
    am: "Fabio Ruppenthal Ceroni",
    cadastro: "2026-09-11",
  },
  {
    key: "cotrijal",
    name: "Cotrijal",
    match: ["cotrijal"],
    diretoria: "Edenei Pereira",
    refComercial: "Higor Keller",
    am: "Carina Treher da Silva",
    cadastro: "2026-09-16",
  },
  {
    key: "engie",
    name: "Engie",
    match: ["engie"],
    diretoria: "Edenei Pereira",
    refComercial: "Rodrigo Bedin",
    am: "Eduardo Bittelbrunn",
    cadastro: "2026-09-18",
  },
  {
    key: "fruki",
    name: "Fruki Bebidas",
    match: ["fruki"],
    diretoria: "Edenei Pereira",
    refComercial: "Higor Keller",
    am: "Guilherme Bassani Boeira",
    cadastro: "2026-09-21",
  },
  {
    key: "nexdom",
    name: "Nexdom Healthtech",
    match: ["nexdom"],
    diretoria: "Edenei Pereira",
    refComercial: "Rodrigo Bedin",
    am: "Eduardo Bittelbrunn",
    cadastro: "2026-09-21",
  },
];

/** Empresas que não são clientes do piloto (uso interno / equipe Twygo / testes). */
export const NON_PILOT_ENTERPRISES = ["selbetti", "twygo", "outsider"];

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function findPilotClient(enterprise: string | null | undefined): PilotClient | null {
  const e = normalize(enterprise ?? "");
  if (!e) return null;
  return PILOT_CLIENTS.find((c) => c.match.some((m) => e.includes(m))) ?? null;
}
