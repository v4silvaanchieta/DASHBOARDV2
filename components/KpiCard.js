"use client";

/**
 * Card de KPI genérico (Etapa 3).
 *
 * @param {{
 *   label: string,
 *   value: string | number,
 *   icon?: string,
 *   hint?: string,
 *   tone?: "default" | "danger" | "success",
 * }} props
 */
export default function KpiCard({
  label,
  value,
  icon,
  hint,
  tone = "default",
}) {
  const tones = {
    default: {
      card: "border-slate-200 bg-white",
      value: "text-slate-900",
      iconBg: "bg-slate-100 text-slate-600",
    },
    danger: {
      card: "border-red-200 bg-red-50",
      value: "text-red-700",
      iconBg: "bg-red-100 text-red-600",
    },
    success: {
      card: "border-emerald-200 bg-emerald-50",
      value: "text-emerald-700",
      iconBg: "bg-emerald-100 text-emerald-600",
    },
  };

  const t = tones[tone] ?? tones.default;

  return (
    <div className={`rounded-xl border ${t.card} p-5 shadow-sm`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        {icon && (
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${t.iconBg}`}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>
      <p className={`mt-3 text-2xl font-bold tracking-tight ${t.value}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
