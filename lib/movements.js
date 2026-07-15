/**
 * Estado ATUAL dos negócios a partir do log de MOVIMENTAÇÃO.
 *
 * A aba "Deals" é um snapshot que CONGELA (não atualiza etapa/status de deals
 * antigos). A aba "Movimentação" é o log VIVO de transições de etapa — então o
 * estado atual de cada deal = a ÚLTIMA movimentação dele (maior DATA
 * ATUALIZAÇÃO). Ex.: um lead pode aparecer 6x (pré-qual ↔ novos leads) e o que
 * vale é a última.
 */

import { parseDate } from "@/lib/filters";

/**
 * Reduz o log de movimentações ao ESTADO ATUAL: 1 linha por DEAL ID, a mais
 * recente (maior data de atualização). Cada linha ganha `_movedAt` (Date da
 * última movimentação) para filtros de recência.
 *
 * @param {Array<Record<string, any>>} movimentacao  linhas mapeadas (mapDealRow)
 * @returns {Array<Record<string, any>>}
 */
export function currentStateFromMovements(movimentacao = []) {
  const latest = new Map();
  for (const row of movimentacao) {
    const id = String(row.dealId ?? "").trim();
    if (!id) continue;
    const d = parseDate(row.dataAtualizacao) || parseDate(row.dataCriacao);
    const prev = latest.get(id);
    if (!prev || (d && (!prev._movedAt || d > prev._movedAt))) {
      latest.set(id, { ...row, _movedAt: d });
    }
  }
  return Array.from(latest.values());
}
