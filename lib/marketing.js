/**
 * Performance de Marketing (Etapa 5).
 * Opera sobre o filteredData sem mutá-lo.
 */

import { isV4Lead } from "@/lib/filters";

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
 * true se o valor de CF_UTM_CAMPAIGN é uma campanha RASTREÁVEL e ESPECÍFICA —
 * i.e., NÃO é orgânico, vazio nem um placeholder não resolvido ("{{...}}").
 *
 * @param {string} value
 * @returns {boolean}
 */
export function isTrackableCampaign(value) {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "" || ORGANIC_CAMPAIGN_VALUES.has(v)) return false;
  if (v.includes("{{")) return false; // template não resolvido -> descarta
  return true;
}

/** Prefixos usados nos rótulos de atribuição (sem campanha específica). */
export const PAID_CAMPAIGN_PREFIX = "Tráfego Pago — ";
export const ORGANIC_CAMPAIGN_LABEL = "Orgânico";

/**
 * Rótulo de campanha de um lead do CRM (atribuição de ORIGEM). Nenhum lead é
 * descartado — todos vieram de algum lugar:
 *  1. UTM de campanha específica e rastreável  -> usa o nome da campanha;
 *  2. Sem campanha específica mas É tráfego pago (tag V4 ou link de WhatsApp)
 *     -> atribui ao conjunto de anúncio da unidade/cidade (ex.: lead V4 em
 *        Ponta Grossa veio do adset de Ponta Grossa) -> "Tráfego Pago — <loja>";
 *  3. Orgânico (sem tag/WhatsApp): usa a ORIGEM (UTM Source) do CRM se houver,
 *     senão rotula como "Orgânico".
 *
 * @param {Record<string, any>} row
 * @returns {string}
 */
export function campaignLabel(row) {
  if (isTrackableCampaign(row?.utmCampaign)) return String(row.utmCampaign).trim();

  if (isV4Lead(row)) {
    const loja = String(row?.pipeline ?? "").trim();
    return loja ? `${PAID_CAMPAIGN_PREFIX}${loja}` : `${PAID_CAMPAIGN_PREFIX}sem unidade`;
  }

  const origem = String(row?.utmSource ?? "").trim();
  return origem || ORGANIC_CAMPAIGN_LABEL;
}

/**
 * Performance por Campanha — TODOS os leads atribuídos por origem (ver
 * campaignLabel): campanhas específicas, tráfego pago por unidade e orgânico.
 *
 * @param {Array<Record<string, any>>} filteredData
 * @returns {Array<{ campaign: string, leads: number, vendas: number, taxa: number }>}
 */
export function computeCampaignPerformance(filteredData) {
  const map = new Map();

  for (const row of filteredData) {
    const campaign = campaignLabel(row);
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
