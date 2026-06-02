"use client";

import { formatDuration, SLA_TARGET_MINUTES } from "@/lib/metrics";

/**
 * Card de Gestão de SLA (Speed to Lead) — premium (Etapa 6).
 * Card branco padronizado; destaque verde se < SLA_TARGET_MINUTES, vermelho se acima.
 *
 * @param {{ sla: { avgMinutes: number, sampleSize: number, waitingCount: number, withinTarget: boolean } }} props
 */
export default function SlaCard({ sla }) {
  const { avgMinutes, sampleSize, waitingCount, withinTarget } = sla;

  const valueColor = withinTarget ? "text-emerald-600" : "text-red-600";
  const badge = withinTarget
    ? { cls: "bg-emerald-50 text-emerald-700", text: "Dentro do SLA" }
    : { cls: "bg-red-50 text-red-700", text: "Fora do SLA" };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Gestão de SLA · Speed to Lead
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            Pré-Qualificação (SDR/IA) → Novos Leads · meta &lt; {SLA_TARGET_MINUTES} min
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>
          {badge.text}
        </span>
      </div>

      <p className={`mt-3 text-3xl font-bold tracking-tight ${valueColor}`}>
        {sampleSize > 0 ? formatDuration(avgMinutes) : "—"}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Tempo médio de resposta · base de {sampleSize}{" "}
        {sampleSize === 1 ? "lead atendido" : "leads atendidos"}
      </p>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <p
          className={`text-sm font-medium ${
            waitingCount > 0 ? "text-red-600" : "text-slate-500"
          }`}
        >
          Alerta: {waitingCount} leads aguardando atendimento
        </p>
      </div>
    </div>
  );
}
