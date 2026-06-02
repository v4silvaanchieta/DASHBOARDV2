"use client";

import { formatDuration, SLA_TARGET_MINUTES } from "@/lib/metrics";

/**
 * Card de Gestão de SLA (Speed to Lead) — Etapa 3.
 * Verde se a média < SLA_TARGET_MINUTES, vermelho se superior.
 *
 * @param {{ sla: { avgMinutes: number, sampleSize: number, waitingCount: number, withinTarget: boolean } }} props
 */
export default function SlaCard({ sla }) {
  const { avgMinutes, sampleSize, waitingCount, withinTarget } = sla;

  const tone = withinTarget
    ? {
        card: "border-emerald-200 bg-emerald-50",
        value: "text-emerald-700",
        badge: "bg-emerald-100 text-emerald-700",
        badgeText: "Dentro do SLA",
      }
    : {
        card: "border-red-200 bg-red-50",
        value: "text-red-700",
        badge: "bg-red-100 text-red-700",
        badgeText: "Fora do SLA",
      };

  return (
    <div className={`rounded-xl border ${tone.card} p-5 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Gestão de SLA · Speed to Lead
          </p>
          <p className="text-xs text-slate-400">
            Meta: 1º atendimento em &lt; {SLA_TARGET_MINUTES} min
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone.badge}`}
        >
          {tone.badgeText}
        </span>
      </div>

      <p className={`mt-3 text-3xl font-bold tracking-tight ${tone.value}`}>
        {sampleSize > 0 ? formatDuration(avgMinutes) : "—"}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Tempo médio de resposta · base de {sampleSize}{" "}
        {sampleSize === 1 ? "lead atendido" : "leads atendidos"}
      </p>

      <div className="mt-4 border-t border-slate-200/70 pt-3">
        <p
          className={`text-sm font-medium ${
            waitingCount > 0 ? "text-red-600" : "text-slate-500"
          }`}
        >
          ⚠️ Alerta: {waitingCount} leads aguardando atendimento
        </p>
      </div>
    </div>
  );
}
