"use client";

/**
 * Funil comercial vertical (4 etapas decrescentes). Cada barra é centralizada e
 * proporcional ao MAIOR valor entre as etapas; entre as barras, a tag
 * "Captura: X%" mostra a taxa de passagem para a etapa imediatamente abaixo.
 *
 * Números absolutos por etapa — para unidade, as etapas do meio podem ficar
 * iguais/parecidas (o SDR da unidade já é o CRM dela), o que é esperado.
 *
 * @param {{
 *   stages: Array<{ label: string, value: number, barClass?: string }>,
 * }} props
 */
export default function ConversionFunnel({ stages }) {
  const fmt = (n) => Number(n || 0).toLocaleString("pt-BR");
  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Funil Comercial
      </h3>

      <div className="space-y-1">
        {stages.map((s, i) => {
          // Largura proporcional ao maior valor, com piso p/ legibilidade.
          const width = Math.max((s.value / max) * 100, 30);
          const next = stages[i + 1];
          const capture =
            next && s.value > 0 ? (next.value / s.value) * 100 : null;

          return (
            <div key={s.label}>
              <div
                className={`mx-auto flex min-h-[58px] flex-col items-center justify-center rounded-lg px-3 py-2 text-center text-white shadow-sm ${
                  s.barClass ?? "bg-indigo-500"
                }`}
                style={{ width: `${width}%` }}
              >
                <span className="text-[11px] font-medium uppercase leading-tight tracking-wide text-white/90">
                  {s.label}
                </span>
                <span className="text-lg font-bold leading-tight">
                  {fmt(s.value)}
                </span>
              </div>

              {capture != null && (
                <div className="py-1 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  ↓ Captura: {capture.toFixed(1).replace(".", ",")}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
