/**
 * Performance de Marketing (Etapa 5).
 * Opera sobre o filteredData sem mutá-lo.
 */

function norm(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/** Estágios considerados "avançados" (Triagem para frente). */
const ADVANCED_KEYWORDS = ["triagem", "analise", "credito", "ganho"];

/**
 * Performance por Campanha (CF_UTM_CAMPAIGN).
 *
 * @param {Array<Record<string, any>>} filteredData
 * @returns {Array<{ campaign: string, leads: number, vendas: number, taxa: number }>}
 */
export function computeCampaignPerformance(filteredData) {
  const map = new Map();

  for (const row of filteredData) {
    const campaign = String(row.utmCampaign ?? "").trim() || "Sem Campanha";
    const entry = map.get(campaign) || { campaign, leads: 0, vendas: 0 };
    entry.leads += 1;
    if (norm(row.status) === "ganho") entry.vendas += 1;
    map.set(campaign, entry);
  }

  return Array.from(map.values())
    .map((e) => ({
      ...e,
      taxa: e.leads > 0 ? (e.vendas / e.leads) * 100 : 0,
    }))
    .sort((a, b) => b.leads - a.leads);
}

/**
 * Eficiência da IA: leads com CF_UTM_SOURCE == "SDR IA" vs quantos avançaram
 * para etapas avançadas (Triagem para frente).
 *
 * @param {Array<Record<string, any>>} filteredData
 * @returns {{ sdrTotal: number, advanced: number, efficiency: number }}
 */
export function computeAiEfficiency(filteredData) {
  let sdrTotal = 0;
  let advanced = 0;

  for (const row of filteredData) {
    if (norm(row.utmSource) !== "sdr ia") continue;
    sdrTotal += 1;
    const estagio = norm(row.estagio);
    if (ADVANCED_KEYWORDS.some((kw) => estagio.includes(kw))) {
      advanced += 1;
    }
  }

  return {
    sdrTotal,
    advanced,
    efficiency: sdrTotal > 0 ? (advanced / sdrTotal) * 100 : 0,
  };
}
