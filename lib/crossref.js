/**
 * Cruzamento entre as abas (Etapa 6).
 * - LEADS SDR x DEALS por telefone (fallback nome) -> geração por loja/pipeline.
 * - Classificação de PIPELINE em Matriz vs Unidades (franquias locais).
 */

function norm(value) {
  return String(value ?? "").trim().toLowerCase();
}

/**
 * Normaliza um telefone para os últimos 8 dígitos (chave de cruzamento robusta
 * a variações de +55 e DDD entre as abas).
 *
 * @param {string|number} value
 * @returns {string}  últimos 8 dígitos, ou "" se inválido.
 */
export function phoneKey(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length < 8) return "";
  return digits.slice(-8);
}

/**
 * Classifica um PIPELINE da aba DEALS.
 * @param {string} pipeline
 * @returns {"matriz"|"unidade"|"outros"}
 */
export function classifyPipeline(pipeline) {
  const p = norm(pipeline);
  if (!p) return "outros";
  if (p.includes("matriz")) return "matriz";
  if (p.startsWith("velot")) return "unidade";
  return "outros";
}

/**
 * Indexa os deals por chave de telefone (telefone e cf_telefone).
 * @param {Array<Record<string, any>>} deals
 * @returns {Map<string, Record<string, any>>}
 */
function indexDealsByPhone(deals) {
  const index = new Map();
  for (const deal of deals) {
    for (const phone of [deal.telefone, deal.cfTelefone]) {
      const key = phoneKey(phone);
      if (key && !index.has(key)) index.set(key, deal);
    }
  }
  return index;
}

/**
 * Cruza LEADS SDR com DEALS e agrupa os leads convertidos por PIPELINE.
 *
 * @param {Array<Record<string, any>>} leadsSdr
 * @param {Array<Record<string, any>>} deals
 * @returns {{
 *   sdrTotal: number,
 *   matched: number,
 *   unmatched: number,
 *   byStore: Array<{ store: string, count: number }>,
 * }}
 */
export function computeStoreGeneration(leadsSdr, deals) {
  const dealIndexByPhone = indexDealsByPhone(deals);
  const dealNameIndex = new Map();
  for (const deal of deals) {
    const n = norm(deal.nomeContato) || norm(deal.nomeDeal);
    if (n && !dealNameIndex.has(n)) dealNameIndex.set(n, deal);
  }

  const stores = new Map();
  let matched = 0;

  for (const lead of leadsSdr) {
    const key = phoneKey(lead.telefone);
    let deal = key ? dealIndexByPhone.get(key) : undefined;
    if (!deal) {
      const n = norm(lead.nome);
      if (n) deal = dealNameIndex.get(n);
    }
    if (!deal) continue;

    matched += 1;
    const store = String(deal.pipeline ?? "").trim() || "Sem Pipeline";
    stores.set(store, (stores.get(store) || 0) + 1);
  }

  const byStore = Array.from(stores.entries())
    .map(([store, count]) => ({ store, count }))
    .sort((a, b) => b.count - a.count);

  return {
    sdrTotal: leadsSdr.length,
    matched,
    unmatched: leadsSdr.length - matched,
    byStore,
  };
}

/**
 * Conta deals retidos na Matriz vs avançados para Unidades (franquias locais).
 *
 * @param {Array<Record<string, any>>} deals
 * @returns {{ matriz: number, unidade: number, outros: number, total: number }}
 */
export function computeMatrizVsUnidade(deals) {
  const acc = { matriz: 0, unidade: 0, outros: 0, total: 0 };
  for (const deal of deals) {
    acc[classifyPipeline(deal.pipeline)] += 1;
    acc.total += 1;
  }
  return acc;
}
