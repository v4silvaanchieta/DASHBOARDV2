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
 * Valores de campanha "lixo"/orgânico (sem rastreio de tráfego pago). Comparados
 * em minúsculas/aparados.
 */
const ORGANIC_CAMPAIGN_VALUES = new Set([
  "",
  "sem campanha",
  "(not set)",
  "desconhecido",
]);

/**
 * true se o lead tem campanha RASTREÁVEL (tráfego pago) — i.e., NÃO é orgânico,
 * vazio nem um placeholder de template não resolvido ("{{campaign.name}}").
 *
 * @param {string} value  Valor de CF_UTM_CAMPAIGN.
 * @returns {boolean}
 */
export function isTrackableCampaign(value) {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "" || ORGANIC_CAMPAIGN_VALUES.has(v)) return false;
  if (v.includes("{{")) return false; // template não resolvido -> descarta
  return true;
}

/**
 * Performance por Campanha (CF_UTM_CAMPAIGN), ESTRITAMENTE tráfego pago.
 *
 * Remove na raiz os leads orgânicos do CRM (sem UTM de campanha) que geravam a
 * linha "Sem Campanha" com centenas de leads soltos. Como só restam leads com
 * UTM de campanha, cada venda (Ganho) somada já é comprovadamente rastreável
 * àquela campanha (cumpre a regra "só soma se a origem bater").
 *
 * @param {Array<Record<string, any>>} filteredData
 * @returns {Array<{ campaign: string, leads: number, vendas: number, taxa: number }>}
 */
export function computeCampaignPerformance(filteredData) {
  const map = new Map();

  // Filtro rigoroso na raiz: descarta orgânico/sem rastreio antes de agrupar.
  const trackable = filteredData.filter((row) =>
    isTrackableCampaign(row.utmCampaign)
  );

  for (const row of trackable) {
    const campaign = String(row.utmCampaign).trim();
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
