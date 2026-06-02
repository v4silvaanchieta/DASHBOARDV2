/**
 * Lógica de agregação para os gráficos (Etapa 4).
 * Opera sobre o `filteredData` sem mutá-lo.
 */

/** Remove acentos e normaliza para comparação tolerante. */
function normalizeStr(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/**
 * Definição das etapas do funil, na ordem de exibição.
 * `keywords` são casadas (sem acento/caixa) contra a coluna ESTÁGIO.
 */
export const FUNNEL_STAGES = [
  { label: "LEADS CAMPANHA", keywords: ["leads campanha", "campanha"] },
  { label: "SDR IA", keywords: ["sdr ia", "sdr"] },
  {
    label: "PRÉ-QUALIFICAÇÃO",
    keywords: ["pre-qualificacao", "pre qualificacao", "qualificacao"],
  },
  { label: "NOVOS LEADS", keywords: ["novos leads", "novo lead"] },
  { label: "TRIAGEM", keywords: ["triagem"] },
  { label: "ANÁLISE/CRÉDITO", keywords: ["analise", "credito"] },
  { label: "GANHO", keywords: ["ganho"] },
];

/** Paleta de cores reutilizável pelos gráficos. */
export const CHART_COLORS = [
  "#4f46e5",
  "#6366f1",
  "#0ea5e9",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#ec4899",
  "#22c55e",
  "#64748b",
];

/**
 * Agrupa o filteredData por ESTÁGIO e mapeia para as etapas do funil.
 * Cada lead é atribuído à PRIMEIRA etapa cujas keywords casam (sem dupla contagem).
 *
 * @param {Array<Record<string, any>>} filteredData
 * @returns {Array<{ stage: string, count: number }>}
 */
export function computeFunnel(filteredData) {
  const counts = FUNNEL_STAGES.map(() => 0);

  for (const row of filteredData) {
    const estagio = normalizeStr(row.estagio);
    if (!estagio) continue;

    const idx = FUNNEL_STAGES.findIndex((stage) =>
      stage.keywords.some((kw) => estagio.includes(kw))
    );
    if (idx >= 0) counts[idx] += 1;
  }

  return FUNNEL_STAGES.map((stage, i) => ({
    stage: stage.label,
    count: counts[i],
  }));
}

/**
 * Análise de perdas: filtra STATUS == "perdido", agrupa por MOTIVO DE PERDA,
 * soma QUANTIA (faturamento perdido) e conta leads por motivo.
 *
 * @param {Array<Record<string, any>>} filteredData
 * @returns {{
 *   slices: Array<{ name: string, count: number, value: number }>,
 *   totalLost: number,
 *   totalCount: number,
 * }}
 */
export function computeLossAnalysis(filteredData) {
  const groups = new Map();
  let totalLost = 0;
  let totalCount = 0;

  for (const row of filteredData) {
    if (normalizeStr(row.status) !== "perdido") continue;

    const motivo =
      String(row.motivoPerda ?? "").trim() || "Não informado";
    const quantia = Number(row.quantia) || 0;

    const current = groups.get(motivo) || { name: motivo, count: 0, value: 0 };
    current.count += 1;
    current.value += quantia;
    groups.set(motivo, current);

    totalLost += quantia;
    totalCount += 1;
  }

  const slices = Array.from(groups.values()).sort(
    (a, b) => b.count - a.count
  );

  return { slices, totalLost, totalCount };
}
