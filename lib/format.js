/**
 * Helpers de formatação e de comparação period-over-period (Δ%).
 * Compartilhados entre a Visão Geral e a aba Campanhas para garantir o MESMO
 * comportamento de badge/variação em todo o app.
 */

/**
 * Calcula o badge de variação (Δ%) entre o valor atual e o de comparação.
 * `goodWhenDown` inverte a cor para métricas em que CAIR é bom (ex.: custo,
 * perdas, leads parados).
 * Retorna null quando não há período de comparação (compare == null).
 *
 * @param {number} current
 * @param {number|null|undefined} compare
 * @param {boolean} [goodWhenDown=false]
 * @returns {{ label: string, tone: "good"|"bad"|"neutral" }|null}
 */
export function makeDelta(current, compare, goodWhenDown = false) {
  if (compare == null) return null;
  if (compare === 0) {
    if (!current) return { label: "0%", tone: "neutral" };
    return { label: "novo", tone: goodWhenDown ? "bad" : "good" };
  }
  const pct = ((current - compare) / compare) * 100;
  const up = pct > 0.05;
  const down = pct < -0.05;
  const arrow = up ? "▲" : down ? "▼" : "•";
  let tone = "neutral";
  if (up) tone = goodWhenDown ? "bad" : "good";
  else if (down) tone = goodWhenDown ? "good" : "bad";
  return {
    label: `${arrow} ${Math.abs(pct).toFixed(1).replace(".", ",")}%`,
    tone,
  };
}

/** Inteiro no formato pt-BR (ex.: 1234 -> "1.234"). */
export const fmtCount = (n) => Number(n || 0).toLocaleString("pt-BR");

/** Percentual pt-BR com 1 casa (ex.: 12.34 -> "12,3%"). */
export const fmtPct = (n) => `${Number(n || 0).toFixed(1).replace(".", ",")}%`;

/**
 * Texto discreto "vs [valor anterior] no período anterior" (ou undefined quando
 * não há período de comparação).
 *
 * @param {number|null|undefined} previous
 * @param {(v:number)=>string} fmt  Formatador do valor anterior.
 * @returns {string|undefined}
 */
export function prevHint(previous, fmt) {
  if (previous == null) return undefined;
  return `vs ${fmt(previous)} no período anterior`;
}
