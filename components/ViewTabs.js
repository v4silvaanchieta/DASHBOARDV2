"use client";

/**
 * Alternador segmentado (pílulas) para trocar a visão de um card sem sair do
 * lugar — ex.: Funil Marketing↔Comercial, Visualização CRM↔Ranking.
 *
 * @param {{
 *   value: string,
 *   onChange: (v: string) => void,
 *   options: Array<{ value: string, label: string }>,
 * }} props
 */
export default function ViewTabs({ value, onChange, options = [] }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={[
              "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
              active
                ? "bg-white text-velot shadow-sm dark:bg-slate-900"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
            ].join(" ")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
