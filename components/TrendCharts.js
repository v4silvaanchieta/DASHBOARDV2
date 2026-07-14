"use client";

import { useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  TREND_RANGES,
  generateTrendData,
  computeTrendSummary,
} from "@/lib/trends";

const fmtBRL = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(v) ? v : 0
  );
const fmtPct = (v) => `${(Number(v) || 0).toFixed(1).replace(".", ",")}%`;

/**
 * Métricas de tendência. CPA em vermelho (padrão de custo); as demais em verde.
 */
const METRICS = [
  { key: "cpa", label: "CPA", color: "#ef4444", fmt: fmtBRL },
  { key: "ctr", label: "CTR", color: "#10b981", fmt: fmtPct },
  { key: "qualificado", label: "Qualificação", color: "#10b981", fmt: fmtPct },
  { key: "ganho", label: "Ganhos", color: "#10b981", fmt: fmtPct },
];

/** Tooltip minimalista: só a data e o valor formatado. */
function SparkTooltip({ active, payload, label, fmt }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <p className="text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-semibold text-slate-800 dark:text-slate-100">
        {fmt(payload[0].value)}
      </p>
    </div>
  );
}

/**
 * Tendências — sparklines históricos (até 1 ano) das métricas-chave.
 *
 * Consome os arrays BRUTOS já isolados pela unidade (crmData, campaignsData,
 * leadsSdr) IGNORANDO o filtro global de data; a janela é o `trendRange`
 * (30D / 3M / 1A), recalculando a série instantaneamente ao clicar.
 *
 * @param {{
 *   crmData?: Array<Record<string, any>>,
 *   campaignsData?: Array<Record<string, any>>,
 *   leadsSdr?: Array<Record<string, any>>,
 * }} props
 */
export default function TrendCharts({
  crmData = [],
  campaignsData = [],
  leadsSdr = [],
}) {
  const [trendRange, setTrendRange] = useState("30d");

  const series = useMemo(
    () =>
      generateTrendData(
        { deals: crmData, leadsSdr, campaigns: campaignsData },
        trendRange
      ),
    [crmData, campaignsData, leadsSdr, trendRange]
  );

  // Médias PONDERADAS de todo o período (não o último dia) — números ao lado
  // dos sparklines.
  const summary = useMemo(
    () =>
      computeTrendSummary(
        { deals: crmData, leadsSdr, campaigns: campaignsData },
        trendRange
      ),
    [crmData, campaignsData, leadsSdr, trendRange]
  );

  const hasData = series.length > 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Tendências
        </h3>

        {/* Pills de período (30D / 3M / 1A) */}
        <div className="inline-flex gap-1">
          {TREND_RANGES.map((r) => {
            const active = trendRange === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setTrendRange(r.id)}
                aria-pressed={active}
                className={[
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  active
                    ? "bg-velot text-white shadow-sm"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700",
                ].join(" ")}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {hasData ? (
        <div className="space-y-4">
          {METRICS.map((m) => (
              <div key={m.key} className="flex items-center gap-4">
                {/* Label + MÉDIA PONDERADA — centralizados (H e V) */}
                <div className="flex w-24 shrink-0 flex-col items-center justify-center text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {m.label}
                  </p>
                  <p className="mt-0.5 text-base font-bold text-slate-800 dark:text-slate-100">
                    {m.fmt(summary[m.key])}
                  </p>
                </div>

                {/* Sparkline ocupando o resto */}
                <div className="h-14 flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={series}
                      margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
                    >
                      <XAxis dataKey="date" hide />
                      <YAxis hide domain={["auto", "auto"]} />
                      <Tooltip
                        content={<SparkTooltip fmt={m.fmt} />}
                        cursor={{ stroke: m.color, strokeOpacity: 0.3 }}
                      />
                      <Line
                        dataKey={m.key}
                        type="monotone"
                        stroke={m.color}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
          ))}
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center text-center text-sm text-slate-400 dark:text-slate-500">
          Sem dados no período selecionado.
        </div>
      )}
    </div>
  );
}
