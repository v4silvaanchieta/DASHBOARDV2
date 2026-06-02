"use client";

/**
 * Geração por Loja: leads de SDR que viraram deal, classificados por PIPELINE.
 *
 * @param {{
 *   generation: { sdrTotal: number, matched: number, unmatched: number, byStore: Array<{ store: string, count: number }> },
 * }} props
 */
export default function SourceCrossSection({ generation }) {
  const { matched, unmatched, byStore } = generation;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Geração por Loja (SDR → Deals)
      </h2>
      <p className="mb-4 mt-0.5 text-xs text-slate-400 dark:text-slate-500">
        {matched} leads de SDR convertidos em deal · {unmatched} sem correspondência
      </p>

      {byStore.length > 0 ? (
        <div className="max-h-56 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2 pr-4 font-semibold">Loja / Unidade</th>
                <th className="py-2 text-right font-semibold">Leads</th>
              </tr>
            </thead>
            <tbody>
              {byStore.map((s) => (
                <tr
                  key={s.store}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="py-2 pr-4 text-slate-800 dark:text-slate-200">
                    {s.store}
                  </td>
                  <td className="py-2 text-right font-semibold text-slate-900 dark:text-slate-50">
                    {s.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
          Nenhum cruzamento encontrado para os filtros atuais.
        </div>
      )}
    </div>
  );
}
