"use client";

/**
 * Card de KPI premium (Etapa 6).
 * Sempre fundo branco, borda suave e sombra leve — sem cores pastel de fundo.
 * O `accent` colore apenas o chip do ícone.
 *
 * @param {{
 *   label: string,
 *   value: string | number,
 *   icon?: string,
 *   hint?: string,
 *   accent?: "slate" | "emerald" | "red" | "indigo" | "amber",
 * }} props
 */
export default function KpiCard({
  label,
  value,
  icon,
  hint,
  accent = "slate",
}) {
  const accents = {
    slate: "bg-slate-100 text-slate-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
  };

  const iconClass = accents[accent] ?? accents.slate;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        {icon && (
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${iconClass}`}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
