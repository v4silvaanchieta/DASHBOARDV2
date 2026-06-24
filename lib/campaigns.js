/**
 * Isolamento de dados da aba CAMPANHAS (tráfego pago) por unidade/cidade.
 *
 * REGRA ABSOLUTA DE SEGURANÇA: a aba Campanhas não tem coluna de pipeline. A
 * unidade/cidade vem dentro do `Adset Name` entre colchetes, ex.:
 *   "[01] - [PONTA GROSSA] [ABERTO] [20 - 50]".
 * A pipeline da unidade logada é "Velot <Cidade>" (ex.: "Velot Ponta Grossa").
 * Casamos o nome da cidade (minúsculo, sem acento) dentro do Adset Name para
 * garantir que uma unidade JAMAIS veja campanhas de outra.
 */

/** minúsculas + remove acentos + trim (comparação blindada). */
function norm(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

/**
 * Extrai a cidade da pipeline da unidade.
 * "Velot Ponta Grossa" -> "ponta grossa"
 *
 * @param {string} pipeline
 * @returns {string}  cidade normalizada (minúscula, sem acento), ou "".
 */
export function cityFromPipeline(pipeline) {
  return norm(String(pipeline ?? "").replace(/^\s*velot\s*/i, ""));
}

/**
 * BARREIRA: true se o Adset Name pertence à cidade da pipeline informada.
 * Comparação por substring normalizada (sem acento/caixa), conforme a regra.
 *
 * @param {string} adsetName  Valor do campo Adset Name da campanha.
 * @param {string} pipeline   Pipeline da unidade (ex.: "Velot Ponta Grossa").
 * @returns {boolean}
 */
export function campaignMatchesPipeline(adsetName, pipeline) {
  const city = cityFromPipeline(pipeline);
  if (!city) return false;
  return norm(adsetName).includes(city);
}

/** Soma segura de um campo numérico de um array de campanhas. */
function sumBy(data, key) {
  return data.reduce((s, r) => s + (Number(r[key]) || 0), 0);
}

/**
 * Totais consolidados das campanhas já filtradas/isoladas. Derivados:
 *  - CTR = cliques / impressões
 *  - CPC = investimento / cliques
 *  - CPM = investimento / impressões * 1000
 *  - custo por conversa = investimento / conversas iniciadas
 *
 * @param {Array<Record<string, any>>} data
 */
export function computeCampaignTotals(data) {
  const spend = sumBy(data, "spend");
  const impressions = sumBy(data, "impressions");
  const clicks = sumBy(data, "clicks");
  const conversations = sumBy(data, "conversations");
  return {
    spend,
    impressions,
    clicks,
    conversations,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    costPerConversation: conversations > 0 ? spend / conversations : 0,
  };
}

/**
 * Agrupador genérico: soma spend/impressions/clicks/conversations por chave e
 * deriva CTR, CPC e CPA (custo por conversa). Não ordena (cabe a quem chama).
 *
 * @param {Array<Record<string, any>>} data
 * @param {(row:Record<string,any>) => { id: string, fields: Record<string,any> }} keyOf
 * @returns {Array<Record<string, any>>}
 */
function groupCampaignsBy(data, keyOf) {
  const map = new Map();
  for (const r of data) {
    const { id, fields } = keyOf(r);
    const e =
      map.get(id) ||
      { ...fields, spend: 0, impressions: 0, clicks: 0, conversations: 0 };
    e.spend += Number(r.spend) || 0;
    e.impressions += Number(r.impressions) || 0;
    e.clicks += Number(r.clicks) || 0;
    e.conversations += Number(r.conversations) || 0;
    map.set(id, e);
  }
  return Array.from(map.values()).map((e) => ({
    ...e,
    ctr: e.impressions > 0 ? (e.clicks / e.impressions) * 100 : 0,
    cpc: e.clicks > 0 ? e.spend / e.clicks : 0,
    cpa: e.conversations > 0 ? e.spend / e.conversations : 0,
  }));
}

/**
 * Agrupa por Campaign Name. Ordena por investimento (maior primeiro).
 * @param {Array<Record<string, any>>} data
 */
export function groupCampaignsByName(data) {
  return groupCampaignsBy(data, (r) => {
    const name = String(r.campaignName ?? "").trim() || "Sem Campanha";
    return { id: name, fields: { name } };
  }).sort((a, b) => b.spend - a.spend);
}

/**
 * Agrupa por Adset Name (Conjunto = cidade/segmentação). Ordena por investimento.
 * @param {Array<Record<string, any>>} data
 */
export function groupCampaignsByAdset(data) {
  return groupCampaignsBy(data, (r) => {
    const adset = String(r.adsetName ?? "").trim() || "Sem Conjunto";
    return { id: adset, fields: { adset } };
  }).sort((a, b) => b.spend - a.spend);
}

/**
 * Agrupa por Ad Name (Criativo) + Campanha (mesmo nome pode existir em campanhas
 * diferentes). Ordena destacando os MELHORES criativos: mais conversas primeiro,
 * desempatando por menor CPA.
 * @param {Array<Record<string, any>>} data
 */
export function groupCampaignsByAd(data) {
  return groupCampaignsBy(data, (r) => {
    const ad = String(r.adName ?? "").trim() || "Sem Anúncio";
    const campaign = String(r.campaignName ?? "").trim() || "Sem Campanha";
    return { id: `${ad}|||${campaign}`, fields: { ad, campaign } };
  }).sort((a, b) => b.conversations - a.conversations || a.cpa - b.cpa);
}
