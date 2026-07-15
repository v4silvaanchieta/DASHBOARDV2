/**
 * Cálculo de métricas dos KPIs do dashboard (Etapa 3).
 * Todas as funções operam sobre o `filteredData` e NÃO mutam o array.
 */

import { parseDate } from "@/lib/filters";
import { phoneKey } from "@/lib/crossref";

/**
 * Fragmentos de estágio considerados "etapa inicial" (lead aguardando atendimento).
 * Casados por substring contra o valor real (ex.: "PRÉ-QUALIFICAÇÃO (SDR / IA)").
 */
export const INITIAL_STAGES = ["pré-qualificação", "sdr", "prospecção"];

/**
 * Fragmentos de estágio que indicam que o lead já avançou para atendimento.
 * Ex.: "NOVOS LEADS (Atendimento Humano)".
 */
export const ATTENDED_STAGES = ["novos leads", "em atendimento"];

/** Limite de SLA (Speed to Lead), em minutos. */
export const SLA_TARGET_MINUTES = 5;

const HOURS_48_MS = 48 * 60 * 60 * 1000;

/**
 * Normaliza string para comparação: trim + lower + REMOVE ACENTOS. Blindagem
 * contra divergência de nomenclatura (maiúsc./minúsc., espaços, acentos) na
 * etapa/status — para nenhum lead ser barrado por diferença de escrita.
 */
function norm(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/** true se o status indica card aberto/ativo. */
function isOpenStatus(status) {
  const s = norm(status);
  return s === "aberto" || s === "open" || s === "aberta";
}

/**
 * Regra ÚNICA de "Lead Estagnado" (usada na Visão Geral, no carrossel de alertas
 * e na aba de Relatórios). Foco no gargalo de entrada (boca do funil):
 *  - Card ABERTO em estágio "PRÉ-QUALIFICAÇÃO" ou "PROSPECÇÃO IA"; E
 *  - DATA ATUALIZAÇÃO (ou DATA CRIAÇÃO, se não houver) há mais de 48h.
 * Cards em "Novos Leads", "Triagem" ou fases posteriores NÃO contam.
 *
 * @param {Record<string, any>} row
 * @param {number} [now=Date.now()]
 * @returns {boolean}
 */
export function isStagnantLead(row, now = Date.now()) {
  if (!isOpenStatus(row.status)) return false;
  if (!stageIn(row, INITIAL_STAGES)) return false;
  const ref = parseDate(row.dataAtualizacao) || parseDate(row.dataCriacao);
  return Boolean(ref) && now - ref.getTime() > HOURS_48_MS;
}

/**
 * Status FECHADOS/inativos — o negócio JÁ saiu da fila (não está mais
 * "aguardando"): ganho, perdido, arquivado, cancelado. Comparados sem acento/caixa.
 */
const CLOSED_STATUSES = new Set([
  "ganho",
  "perdido",
  "arquivado",
  "cancelado",
  "won",
  "lost",
  "archived",
]);

/**
 * true se o lead está ATUALMENTE ABERTO E PARADO na entrada do SDR — espelho fiel
 * do que está na fila AGORA (não o histórico):
 *  1. Etapa atual = Pré-Qualificação (SDR / IA); etapas posteriores não contam.
 *  2. TRAVA DE STATUS: o negócio precisa estar EM ANDAMENTO (ativo/aberto).
 *     Qualquer status fechado — ganho, perdido, arquivado, cancelado — é ignorado.
 * Diferente de isStagnantLead: aqui NÃO exige as 48h.
 *
 * @param {Record<string, any>} row
 * @returns {boolean}
 */
export function isAwaitingSdrLead(row) {
  // (1) etapa EXATAMENTE "Pré-Qualificação (SDR / IA)". Qualquer outra etapa
  //     (prospecção, novos leads, triagem, ganho/perdido…) NÃO entra na fila.
  if (!norm(row?.estagio).includes("pre-qualificacao")) return false;
  // (2) trava de status: só entra se o negócio ainda estiver ATIVO (não fechado).
  const status = norm(row?.status);
  return status !== "" && !CLOSED_STATUSES.has(status);
}

/** true se o status normalizado for "ganho". */
function isGanho(row) {
  return norm(row.status) === "ganho";
}

/** true se o status normalizado for "perdido". */
function isPerdido(row) {
  return norm(row.status) === "perdido";
}

/** true se o estágio do lead contém algum dos fragmentos informados (substring). */
function stageIn(row, stages) {
  const estagio = norm(row.estagio);
  if (!estagio) return false;
  return stages.some((s) => estagio.includes(norm(s)));
}

/**
 * Chave de deduplicação de um lead/negócio. O MESMO contato costuma gerar
 * vários "negócios" no CRM (re-entradas), inflando a contagem de leads.
 * Agrupamos por telefone (últimos 8 dígitos, robusto a +55/DDD); sem telefone,
 * cai para o nome; sem nome, para o DEAL ID; sem nada, retorna null (a linha
 * conta como única, pois não há como identificá-la como duplicata).
 *
 * @param {Record<string, any>} row
 * @returns {string|null}
 */
export function leadDedupKey(row) {
  const phone = phoneKey(row?.telefone) || phoneKey(row?.cfTelefone);
  if (phone) return `tel:${phone}`;
  const name =
    String(row?.nomeContato ?? "").trim().toLowerCase() ||
    String(row?.nomeDeal ?? "").trim().toLowerCase();
  if (name) return `nome:${name}`;
  const id = String(row?.dealId ?? "").trim();
  if (id) return `id:${id}`;
  return null;
}

/**
 * Conta LEADS ÚNICOS num array de negócios, removendo as re-entradas do mesmo
 * contato (ver leadDedupKey). Linhas sem nenhuma chave contam como 1 cada.
 *
 * @param {Array<Record<string, any>>} data
 * @returns {number}
 */
export function countUniqueLeads(data) {
  const seen = new Set();
  let withoutKey = 0;
  for (const row of data) {
    const key = leadDedupKey(row);
    if (key === null) {
      withoutKey += 1;
      continue;
    }
    seen.add(key);
  }
  return seen.size + withoutKey;
}

/**
 * true se o deal AVANÇOU da entrada SDR/pré-qualificação para o funil comercial
 * (foi "qualificado e enviado à loja"): venda ganha OU card aberto que já saiu
 * da etapa de pré-qualificação/SDR. Perdidos não contam como enviados ativos.
 *
 * @param {Record<string, any>} row
 * @returns {boolean}
 */
export function isQualifiedLead(row) {
  const s = norm(row?.status);
  if (s === "ganho") return true;
  if (s === "perdido") return false;
  return !stageIn(row, INITIAL_STAGES);
}

/**
 * Formata um número em moeda brasileira (BRL).
 * @param {number} value
 * @returns {string}
 */
export function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);
}

/**
 * Formata uma duração em minutos para um texto legível.
 * Ex.: 3.2 -> "3,2 min" | 95 -> "1h 35min"
 * @param {number} minutes
 * @returns {string}
 */
export function formatDuration(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return "—";
  if (minutes < 60) {
    return `${minutes.toFixed(1).replace(".", ",")} min`;
  }
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}min`;
}

/**
 * Calcula todas as métricas dos cards superiores a partir do filteredData.
 *
 * @param {Array<Record<string, any>>} filteredData
 * @returns {{
 *   faturamento: number,
 *   leadsGerados: number,
 *   leadsParados: number,
 *   vendasRealizadas: number,
 *   vendasPerdidas: number,
 *   taxaConversao: number,
 * }}
 */
export function computeMetrics(filteredData) {
  const now = Date.now();

  const acc = filteredData.reduce(
    (a, row) => {
      // Faturamento: soma de QUANTIA onde STATUS == ganho.
      if (isGanho(row)) {
        a.faturamento += Number(row.quantia) || 0;
        a.vendasRealizadas += 1;
      }
      if (isPerdido(row)) {
        a.vendasPerdidas += 1;
        a.faturamentoPerdido += Number(row.quantia) || 0;
      }

      // Leads parados/estagnados: regra única (1ª fase + 48h). Ver isStagnantLead.
      if (isStagnantLead(row, now)) {
        a.leadsParados += 1;
      }

      return a;
    },
    {
      faturamento: 0,
      faturamentoPerdido: 0,
      vendasRealizadas: 0,
      vendasPerdidas: 0,
      leadsParados: 0,
    }
  );

  const leadsGerados = filteredData.length;
  // Leads ÚNICOS: remove re-entradas do mesmo contato (mesmo telefone) que
  // inflam a contagem bruta de negócios. Usado nos cards de "leads recebidos".
  const leadsUnicos = countUniqueLeads(filteredData);
  // Taxa de conversão = % de negócios ganhos sobre o total de negócios (métrica
  // a nível de deal, mantida na base bruta para numerador/denominador casarem).
  const taxaConversao =
    leadsGerados > 0 ? (acc.vendasRealizadas / leadsGerados) * 100 : 0;

  return {
    faturamento: acc.faturamento,
    faturamentoPerdido: acc.faturamentoPerdido,
    leadsGerados,
    leadsUnicos,
    leadsParados: acc.leadsParados,
    vendasRealizadas: acc.vendasRealizadas,
    vendasPerdidas: acc.vendasPerdidas,
    taxaConversao,
  };
}

/**
 * Calcula o SLA (Speed to Lead).
 * - Média de minutos entre DATA CRIAÇÃO e DATA ATUALIZAÇÃO para leads
 *   que avançaram para "EM ATENDIMENTO" ou "NOVOS LEADS".
 * - Conta quantos leads continuam parados na etapa inicial (aguardando atendimento).
 *
 * @param {Array<Record<string, any>>} filteredData
 * @returns {{
 *   avgMinutes: number,
 *   sampleSize: number,
 *   waitingCount: number,
 *   withinTarget: boolean,
 * }}
 */
export function computeSLA(filteredData, targetMinutes = SLA_TARGET_MINUTES) {
  let totalMinutes = 0;
  let sampleSize = 0;
  let waitingCount = 0;

  for (const row of filteredData) {
    // Leads aguardando atendimento (parados na primeira etapa).
    if (stageIn(row, INITIAL_STAGES)) {
      waitingCount += 1;
    }

    // Amostra de SLA: leads que já estão em atendimento.
    if (stageIn(row, ATTENDED_STAGES)) {
      const created = parseDate(row.dataCriacao);
      const updated = parseDate(row.dataAtualizacao);
      if (created && updated) {
        const diffMs = updated.getTime() - created.getTime();
        if (diffMs >= 0) {
          totalMinutes += diffMs / 60000;
          sampleSize += 1;
        }
      }
    }
  }

  const avgMinutes = sampleSize > 0 ? totalMinutes / sampleSize : 0;

  return {
    avgMinutes,
    sampleSize,
    waitingCount,
    targetMinutes,
    withinTarget: sampleSize > 0 && avgMinutes < targetMinutes,
  };
}
