"use client";

/**
 * Motivos de Perda (Accountability) — barras de progresso horizontais por
 * motivo da perda, ordenadas da mais frequente (barra mais cheia e vermelha)
 * para a menos. Cada linha mostra o valor absoluto e a % que representa do
 * total de perdas do período.
 *
 * @param {{
 *   analysis: {
 *     slices: Array<{ name: string, count: number, value: number }>,
 *     totalCount: number,
 *   },
 * }} props
 */
export default function LossReasons({ analysis }) {
  const slices = analysis?.slices ?? [];
  const totalCount = analysis?.totalCount ?? 0;
  const max = slices.length > 0 ? slices[0].count : 0; // o mais frequente = 100%

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Motivos de Perda
      </h3>

      {totalCount > 0 ? (
        <ul className="space-y-3">
          {slices.map((s, i) => {
            const pct = totalCount > 0 ? (s.count / totalCount) * 100 : 0;
            const width = max > 0 ? (s.count / max) * 100 : 0;
            const isTop = i === 0;
            return (
              <li key={s.name}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                    {s.name}
                  </span>
                  <span className="whitespace-nowrap tabular-nums text-slate-500 dark:text-slate-400">
                    {s.count.toLocaleString("pt-BR")} ·{" "}
                    {pct.toFixed(1).replace(".", ",")}%
                  </span>
                </div>
                <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full ${
                      isTop
                        ? "bg-red-500"
                        : "bg-red-400/70 dark:bg-red-500/50"
                    }`}
                    style={{ width: `${Math.max(width, 4)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex h-24 items-center justify-center text-center text-sm text-slate-400 dark:text-slate-500">
          Nenhuma perda registrada no período.
        </div>
      )}
    </div>
  );
}
