"use client";

import {
  DATE_RANGE_OPTIONS,
  PIPELINE_ALL,
  SOURCE_ALL,
} from "@/lib/filters";

/**
 * Barra de filtros do dashboard (Etapa 2).
 * Componente controlado: recebe os valores atuais e callbacks de mudança.
 *
 * @param {{
 *   filters: { dateRange: string, pipeline: string, source: string },
 *   onChange: (next: { dateRange: string, pipeline: string, source: string }) => void,
 *   pipelineOptions: string[],
 *   sourceOptions: string[],
 *   disabled?: boolean,
 * }} props
 */
export default function FilterBar({
  filters,
  onChange,
  pipelineOptions,
  sourceOptions,
  disabled = false,
}) {
  const update = (patch) => onChange({ ...filters, ...patch });

  const selectClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-velot focus:outline-none focus:ring-1 focus:ring-velot disabled:cursor-not-allowed disabled:bg-slate-100";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Filtro de Data */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Período (Data de Criação)
          </span>
          <select
            className={selectClass}
            value={filters.dateRange}
            disabled={disabled}
            onChange={(e) => update({ dateRange: e.target.value })}
          >
            {DATE_RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        {/* Filtro de Loja/Franquia (PIPELINE) */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Loja / Franquia
          </span>
          <select
            className={selectClass}
            value={filters.pipeline}
            disabled={disabled}
            onChange={(e) => update({ pipeline: e.target.value })}
          >
            <option value={PIPELINE_ALL}>Todas as Lojas</option>
            {pipelineOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        {/* Filtro de Origem (CF_UTM_SOURCE) */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Origem (UTM Source)
          </span>
          <select
            className={selectClass}
            value={filters.source}
            disabled={disabled}
            onChange={(e) => update({ source: e.target.value })}
          >
            <option value={SOURCE_ALL}>Todas as Origens</option>
            {sourceOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
