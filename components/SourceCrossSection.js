"use client";

/**
 * Seção de cruzamento entre abas (Etapa 6):
 * - Avanço Unidade vs Matriz (PIPELINE da aba DEALS).
 * - Geração por Loja: leads de SDR que viraram deal, classificados por PIPELINE.
 *
 * @param {{
 *   generation: { sdrTotal: number, matched: number, unmatched: number, byStore: Array<{ store: string, count: number }> },
 *   matrizVsUnidade: { matriz: number, unidade: number, outros: number, total: number },
 * }} props
 */
export default function SourceCrossSection({ generation, matrizVsUnidade }) {
  const { matched, unmatched, byStore } = generation;
  const { matriz, unidade, outros, total } = matrizVsUnidade;

  const pct = (part) =>
    total > 0 ? `${((part / total) * 100).toFixed(1).replace(".", ",")}%` : "—";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Avanço Unidade vs Matriz */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Avanço por Unidade vs Matriz
        </h2>
        <p className="mb-4 mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          Distribuição dos deals pela coluna PIPELINE
        </p>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Unidades
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
              {unidade}
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {pct(unidade)} · franquias
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Matriz
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
              {matriz}
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {pct(matriz)} · retidos
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Outros
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
              {outros}
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {pct(outros)} · padrão
            </p>
          </div>
        </div>
      </div>

      {/* Geração por Loja (cruzamento SDR -> DEALS) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Geração por Loja (SDR → Deals)
        </h2>
        <p className="mb-4 mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          {matched} leads de SDR convertidos em deal · {unmatched} sem
          correspondência
        </p>

        {byStore.length > 0 ? (
          <div className="max-h-56 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2 pr-4 font-semibold">Loja / Pipeline</th>
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
    </div>
  );
}
