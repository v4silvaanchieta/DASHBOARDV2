"use client";

/**
 * Área demarcada (placeholder) da nova casca one-page. Marca visualmente onde
 * cada bloco de conteúdo entrará, mantendo o padrão premium (borda tracejada,
 * dark/light). Substituída pelo componente real na fase de população.
 *
 * @param {{ icon?: string, title: string, subtitle?: string, minH?: string }} props
 */
export default function AreaPlaceholder({
  icon = "▦",
  title,
  subtitle,
  minH = "min-h-[220px]",
}) {
  return (
    <div
      className={`flex ${minH} flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white/40 p-6 text-center transition-colors dark:border-slate-700 dark:bg-slate-900/30`}
    >
      <span className="text-2xl" aria-hidden="true">
        {icon}
      </span>
      <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
        {title}
      </p>
      {subtitle && (
        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}
