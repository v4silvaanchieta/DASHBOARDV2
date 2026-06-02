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
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Avanço por Unidade vs Matriz
        </h2>
        <p className="mb-4 mt-0.5 text-xs text-slate-400">
          Distribuição dos deals pela coluna PIPELINE
        </p>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Unidades
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{unidade}</p>
            <p className="mt-1 text-xs text-slate-400">{pct(unidade)} · franquias</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Matriz
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{matriz}</p>
            <p className="mt-1 text-xs text-slate-400">{pct(matriz)} · retidos</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Outros
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{outros}</p>
            <p className="mt-1 text-xs text-slate-400">{pct(outros)} · padrão</p>
          </div>
        </div>
      </div>

      {/* Geração por Loja (cruzamento SDR -> DEALS) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Geração por Loja (SDR → Deals)
        </h2>
        <p className="mb-4 mt-0.5 text-xs text-slate-400">
          {matched} leads de SDR convertidos em deal · {unmatched} sem
          correspondência
        </p>

        {byStore.length > 0 ? (
          <div className="max-h-56 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-2 pr-4 font-semibold">Loja / Pipeline</th>
                  <th className="py-2 text-right font-semibold">Leads</th>
                </tr>
              </thead>
              <tbody>
                {byStore.map((s) => (
                  <tr key={s.store} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-4 text-slate-800">{s.store}</td>
                    <td className="py-2 text-right font-semibold text-slate-900">
                      {s.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center text-sm text-slate-400">
            Nenhum cruzamento encontrado para os filtros atuais.
          </div>
        )}
      </div>
    </div>
  );
}
