/**
 * Auditoria de Lojas — Score de Higiene do CRM (Etapa 5).
 * Opera sobre o filteredData sem mutá-lo.
 */

import { parseDate } from "@/lib/filters";
import { INITIAL_STAGES } from "@/lib/metrics";

const HOURS_24_MS = 24 * 60 * 60 * 1000;

/** Penalidades do score (inicia em 100). */
export const SCORE_PENALTY = {
  tiBh: 5, // lead com PROPRIETÁRIO "TI BH" (falta de transferência)
  emptyFields: 5, // lead finalizado com MOTIVO DE PERDA ou CF_UTM_SOURCE vazio
  stagnant: 2, // lead estagnado
};

function norm(value) {
  return String(value ?? "").trim().toLowerCase();
}

/** Lead estagnado: na etapa inicial há mais de 24h. */
function isStagnant(row, now) {
  const estagio = norm(row.estagio);
  if (!estagio) return false;
  if (!INITIAL_STAGES.some((s) => estagio.includes(norm(s)))) return false;
  const created = parseDate(row.dataCriacao);
  return Boolean(created) && now - created.getTime() > HOURS_24_MS;
}

/**
 * Agrupa por Loja (PIPELINE) e calcula o Score de CRM (0–100) de cada uma.
 *
 * @param {Array<Record<string, any>>} filteredData
 * @returns {Array<{
 *   loja: string,
 *   totalLeads: number,
 *   stagnant: number,
 *   tiBh: number,
 *   emptyFields: number,
 *   score: number,
 * }>}
 */
export function computeStoreHygiene(filteredData) {
  const now = Date.now();
  const map = new Map();

  for (const row of filteredData) {
    const loja = String(row.pipeline ?? "").trim() || "Sem Loja";
    const entry =
      map.get(loja) || {
        loja,
        totalLeads: 0,
        stagnant: 0,
        tiBh: 0,
        emptyFields: 0,
      };

    entry.totalLeads += 1;

    // Falta de transferência: proprietário "TI BH".
    if (norm(row.proprietario) === "ti bh") entry.tiBh += 1;

    // Lead finalizado com campos de higiene vazios.
    const status = norm(row.status);
    const finalized = status === "ganho" || status === "perdido";
    if (finalized) {
      const motivoEmpty = String(row.motivoPerda ?? "").trim() === "";
      const sourceEmpty = String(row.utmSource ?? "").trim() === "";
      if (motivoEmpty || sourceEmpty) entry.emptyFields += 1;
    }

    // Lead estagnado.
    if (isStagnant(row, now)) entry.stagnant += 1;

    map.set(loja, entry);
  }

  return Array.from(map.values())
    .map((e) => {
      const raw =
        100 -
        e.tiBh * SCORE_PENALTY.tiBh -
        e.emptyFields * SCORE_PENALTY.emptyFields -
        e.stagnant * SCORE_PENALTY.stagnant;
      const score = Math.max(0, Math.min(100, raw));
      return { ...e, score };
    })
    .sort((a, b) => b.score - a.score);
}
