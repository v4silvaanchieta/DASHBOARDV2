"use client";

import { ArrowUpRight } from "lucide-react";

/**
 * Card de KPI premium (Etapa 6).
 * Sempre fundo branco, borda suave e sombra leve — sem cores pastel de fundo.
 * O `accent` colore apenas o chip do ícone. Se `onNavigate` for passado, o card
 * vira clicável (mostra uma seta ↗ e leva para outra aba).
 *
 * @param {{
 *   label: string,
 *   value: string | number,
 *   icon?: string,
 *   hint?: string,
 *   accent?: "slate" | "emerald" | "red" | "indigo" | "amber",
 *   delta?: { label: string, tone: "good" | "bad" | "neutral" } | null,
 *   extra?: React.ReactNode,
 *   onNavigate?: () => void,
 * }} props
 */
export default function KpiCard({
  label,
  value,
  icon,
  hint,
  accent = "slate",
  delta = null,
  extra = null,
  onNavigate = null,
}) {
  const accents = {
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    emerald:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    red: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    indigo:
      "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  };

  const deltaTones = {
    good: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    bad: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
    neutral: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  };

  const iconClass = accents[accent] ?? accents.slate;
  const clickable = typeof onNavigate === "function";

  return (
    <div
      onClick={clickable ? onNavigate : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onNavigate();
              }
            }
          : undefined
      }
      className={`group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 ${
        clickable
          ? "cursor-pointer hover:border-velot focus:border-velot focus:outline-none focus:ring-1 focus:ring-velot"
          : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <div className="flex items-center gap-1.5">
          {icon && (
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${iconClass}`}
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          {clickable && (
            <ArrowUpRight
              size={16}
              className="text-slate-300 transition-colors group-hover:text-velot dark:text-slate-600"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50">
          {value}
        </p>
        {delta && (
          <span
            className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${
              deltaTones[delta.tone] ?? deltaTones.neutral
            }`}
            title="Variação vs período de comparação"
          >
            {delta.label}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      {extra && (
        <p className="mt-1.5 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
          {extra}
        </p>
      )}
    </div>
  );
}
