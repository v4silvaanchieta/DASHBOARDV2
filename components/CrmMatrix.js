"use client";

/** Cor do badge de score (mesmos limiares da antiga Matriz Analítica). */
function scoreBadge(score) {
  if (score >= 90)
    return "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/30";
  if (score >= 70)
    return "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/30";
  return "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/30";
}

/**
 * Visualização do CRM (antiga "Matriz Analítica por Unidade"), adaptada ao novo
 * layout one-page: colunas enxutas + scroll interno (H/V) para não quebrar a
 * tela. As linhas vêm do `storeReport`, que já está isolado pela pipeline da
 * unidade (unit → 1 linha) ou completo para o admin.
 *
 * @param {{ rows?: Array<Record<string, any>>, title?: string }} props
 */
export default function CrmMatrix({ rows = [], title = "Visualização do CRM" }) {
  const num = "py-2.5 px-2 text-center tabular-nums text-slate-700 dark:text-slate-300";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {title}
      </h3>

      {rows.length > 0 ? (
        <div className="max-h-[440px] overflow-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-white dark:bg-slate-900">
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2 pr-3 text-left font-semibold">Loja</th>
                <th className="py-2 px-2 text-center font-semibold">Leads</th>
                <th className="py-2 px-2 text-center font-semibold">Pré</th>
                <th className="py-2 px-2 text-center font-semibold">Novos</th>
                <th className="py-2 px-2 text-center font-semibold">Tri</th>
                <th className="py-2 px-2 text-center font-semibold">Anál</th>
                <th className="py-2 px-2 text-center font-semibold">Fat</th>
                <th className="py-2 px-2 text-center font-semibold">Ganhos</th>
                <th className="py-2 px-2 text-center font-semibold">Perd.</th>
                <th className="py-2 px-2 text-center font-semibold">Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.loja}
                  className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="whitespace-nowrap py-2.5 pr-3 font-medium text-slate-800 dark:text-slate-100">
                    {r.loja}
                  </td>
                  <td className={`${num} font-semibold text-slate-900 dark:text-slate-50`}>
                    {r.totalLeads}
                  </td>
                  <td className={num}>{r.preQualif}</td>
                  <td className={num}>{r.novosLeads}</td>
                  <td className={num}>{r.triagem}</td>
                  <td className={num}>{r.analise}</td>
                  <td className={num}>{r.faturamento}</td>
                  <td className="py-2.5 px-2 text-center tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                    {r.ganhos}
                  </td>
                  <td className="py-2.5 px-2 text-center tabular-nums font-semibold text-rose-600 dark:text-rose-400">
                    {r.perdidos}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span
                      className={`inline-flex min-w-[2.5rem] justify-center rounded-full border px-2 py-0.5 text-xs font-semibold ${scoreBadge(
                        r.score
                      )}`}
                    >
                      {r.score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center text-center text-sm text-slate-400 dark:text-slate-500">
          Nenhuma unidade com dados no período.
        </div>
      )}
    </div>
  );
}
