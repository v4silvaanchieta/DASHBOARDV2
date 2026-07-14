"use client";

import { useMemo, useState } from "react";
import { TREND_RANGES, generateTrendData } from "@/lib/trends";

const fmtBRL = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(v) ? v : 0
  );
const fmtPct = (v) => `${(Number(v) || 0).toFixed(1).replace(".", ",")}%`;

/**
 * Tendências — histórico temporal (até 1 ano) das métricas-chave.
 *
 * Consome os arrays BRUTOS já isolados pela unidade (crmData, campaignsData,
 * leadsSdr) IGNORANDO o filtro global de data; a janela é controlada localmente
 * pelo `trendRange` (30d / 3m / 1y). A série é gerada por `generateTrendData`.
 *
 * (Fase atual: engine + shell. Os gráficos de linha entram na próxima fase e
 * consomem diretamente o array `series`.)
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

  const last = series.length > 0 ? series[series.length - 1] : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Tendências
          </h3>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            Histórico independente do filtro global · isolado por unidade
          </p>
        </div>

        {/* Seletor de janela (30d / 3m / 1y) */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-800/60">
          {TREND_RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setTrendRange(r.id)}
              aria-pressed={trendRange === r.id}
              className={[
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                trendRange === r.id
                  ? "bg-velot text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
              ].join(" ")}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {series.length > 0 ? (
        <>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {series.length}
            </span>{" "}
            dias com dados · de {series[0].date} a {last.date}
          </p>

          {/* Prévia do último dia (a série completa alimenta os gráficos na
              próxima fase). */}
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "CPA", value: fmtBRL(last.cpa) },
              { label: "CTR", value: fmtPct(last.ctr) },
              { label: "Qualificado", value: fmtPct(last.qualificado) },
              { label: "Ganho", value: fmtPct(last.ganho) },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {m.label}
                </p>
                <p className="mt-0.5 text-lg font-bold text-slate-800 dark:text-slate-100">
                  {m.value}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
            Última leitura ({last.date}) · gráficos de linha na próxima fase.
          </p>
        </>
      ) : (
        <div className="flex h-24 items-center justify-center text-center text-sm text-slate-400 dark:text-slate-500">
          Sem dados no período selecionado.
        </div>
      )}
    </div>
  );
}
