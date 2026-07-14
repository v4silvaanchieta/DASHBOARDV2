/**
 * Engine de séries temporais (Tendências).
 *
 * Opera sobre os arrays BRUTOS (CRM, SDR, Campanhas) já isolados pela unidade do
 * usuário, mas SEM o filtro global de data — permitindo ver o histórico (até 1
 * ano) mesmo com o painel filtrado em "Ontem". Não muta os arrays de entrada.
 */

import { parseDate } from "@/lib/filters";

/** Opções de janela do gráfico de tendência (rótulo curto tipo "pill"). */
export const TREND_RANGES = [
  { id: "30d", label: "30D", days: 30 },
  { id: "3m", label: "3M", days: 90 },
  { id: "1y", label: "1A", days: 365 },
];

const RANGE_DAYS = { "30d": 30, "3m": 90, "1y": 365 };

/**
 * Data de corte inicial (meia-noite local) = hoje − N dias, conforme o range.
 *
 * @param {"30d"|"3m"|"1y"} range
 * @param {Date} [now=new Date()]
 * @returns {Date}
 */
export function trendCutoff(range, now = new Date()) {
  const days = RANGE_DAYS[range] ?? 30;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - days);
  return start;
}

/** "YYYY-MM-DD" (local) de uma Date. */
function toYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const norm = (v) => String(v ?? "").trim().toLowerCase();

/**
 * Agrupa os dados brutos DIA A DIA dentro da janela do `range`, gerando a série
 * temporal com as 4 métricas de tendência. Divisões por zero retornam 0.
 *
 *  - CPA         = Investimento do dia / Conversas Iniciadas do dia
 *  - CTR         = (Cliques do dia / Impressões do dia) * 100
 *  - QUALIFICADO = (Deals que entraram no CRM no dia / Leads SDR IA do dia) * 100
 *  - GANHO       = (Vendas Ganhas no dia / Deals totais do dia) * 100
 *
 * @param {{
 *   deals?: Array<Record<string, any>>,      // CRM (dataCriacao, status, ...)
 *   leadsSdr?: Array<Record<string, any>>,   // SDR IA (data, ...)
 *   campaigns?: Array<Record<string, any>>,  // Tráfego pago (date, spend, ...)
 * }} sources
 * @param {"30d"|"3m"|"1y"} range
 * @param {Date} [now=new Date()]
 * @returns {Array<{ date: string, cpa: number, ctr: number, qualificado: number, ganho: number }>}
 */
export function generateTrendData(
  { deals = [], leadsSdr = [], campaigns = [] } = {},
  range = "30d",
  now = new Date()
) {
  const cutoff = trendCutoff(range, now);
  const buckets = new Map();

  // Retorna o bucket do dia da data (ou null se fora da janela / data inválida).
  const at = (rawDate) => {
    const d = parseDate(rawDate);
    if (!d || d < cutoff) return null;
    const key = toYMD(d);
    let b = buckets.get(key);
    if (!b) {
      b = {
        date: key,
        spend: 0,
        conversas: 0,
        cliques: 0,
        impressoes: 0,
        sdr: 0,
        deals: 0,
        ganhos: 0,
      };
      buckets.set(key, b);
    }
    return b;
  };

  // Campanhas (tráfego pago) — soma métricas de mídia por dia (campo Date).
  for (const c of campaigns) {
    const b = at(c.date);
    if (!b) continue;
    b.spend += Number(c.spend) || 0;
    b.conversas += Number(c.conversations) || 0;
    b.cliques += Number(c.clicks) || 0;
    b.impressoes += Number(c.impressions) || 0;
  }

  // Leads SDR IA — volume por dia (campo data).
  for (const l of leadsSdr) {
    const b = at(l.data);
    if (b) b.sdr += 1;
  }

  // Deals (CRM) — entradas e ganhos por dia de criação.
  for (const d of deals) {
    const b = at(d.dataCriacao);
    if (!b) continue;
    b.deals += 1;
    if (norm(d.status) === "ganho") b.ganhos += 1;
  }

  return Array.from(buckets.values())
    .map((b) => ({
      date: b.date,
      cpa: b.conversas > 0 ? b.spend / b.conversas : 0,
      ctr: b.impressoes > 0 ? (b.cliques / b.impressoes) * 100 : 0,
      qualificado: b.sdr > 0 ? (b.deals / b.sdr) * 100 : 0,
      ganho: b.deals > 0 ? (b.ganhos / b.deals) * 100 : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Resumo do período (médias PONDERADAS) — usado nos números ao lado dos
 * sparklines. NÃO usar o último dia da série: agrega os totais de TODO o período
 * e só então divide (ponderação correta). Divisões por zero retornam 0.
 *
 *  - CPA Médio         = Σ Investimento / Σ Conversas
 *  - CTR Médio         = (Σ Cliques / Σ Impressões) * 100
 *  - Qualificação Média = (Σ Deals no CRM / Σ Leads SDR IA) * 100
 *  - Ganho Médio       = (Σ Vendas Ganhas / Σ Deals) * 100
 *
 * @param {{
 *   deals?: Array<Record<string, any>>,
 *   leadsSdr?: Array<Record<string, any>>,
 *   campaigns?: Array<Record<string, any>>,
 * }} sources
 * @param {"30d"|"3m"|"1y"} range
 * @param {Date} [now=new Date()]
 * @returns {{ cpa: number, ctr: number, qualificado: number, ganho: number }}
 */
export function computeTrendSummary(
  { deals = [], leadsSdr = [], campaigns = [] } = {},
  range = "30d",
  now = new Date()
) {
  const cutoff = trendCutoff(range, now);
  const within = (rawDate) => {
    const d = parseDate(rawDate);
    return Boolean(d) && d >= cutoff;
  };

  let spend = 0;
  let conversas = 0;
  let cliques = 0;
  let impressoes = 0;
  let sdr = 0;
  let dealsCount = 0;
  let ganhos = 0;

  for (const c of campaigns) {
    if (!within(c.date)) continue;
    spend += Number(c.spend) || 0;
    conversas += Number(c.conversations) || 0;
    cliques += Number(c.clicks) || 0;
    impressoes += Number(c.impressions) || 0;
  }
  for (const l of leadsSdr) {
    if (within(l.data)) sdr += 1;
  }
  for (const d of deals) {
    if (!within(d.dataCriacao)) continue;
    dealsCount += 1;
    if (norm(d.status) === "ganho") ganhos += 1;
  }

  return {
    cpa: conversas > 0 ? spend / conversas : 0,
    ctr: impressoes > 0 ? (cliques / impressoes) * 100 : 0,
    qualificado: sdr > 0 ? (dealsCount / sdr) * 100 : 0,
    ganho: dealsCount > 0 ? (ganhos / dealsCount) * 100 : 0,
  };
}
