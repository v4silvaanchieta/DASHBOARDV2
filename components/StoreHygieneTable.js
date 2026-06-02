"use client";

/**
 * Tabela de Auditoria de Lojas — Score de Higiene e Adoção do CRM.
 *
 * @param {{ rows: Array<{
 *   loja: string,
 *   score: number,
 *   estagnados: number,
 *   tiBh: number,
 *   ganhosZerados: number,
 *   perdasSemMotivo: number,
 *   totalLeads: number,
 * }> }} props
 */
export default function StoreHygieneTable({ rows }) {
  /** Estilização condicional do badge de score. */
  const scoreBadge = (score) => {
    if (score >= 90)
      return "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/30";
    if (score >= 70)
      return "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/30";
    return "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/30";
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Higiene e Adoção do CRM
      </h2>
      <p className="mb-4 mt-0.5 text-xs text-slate-400 dark:text-slate-500">
        Score de qualidade por loja (0–100) · regras do comitê comercial
      </p>

      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2 pr-4 font-semibold">Loja</th>
                <th className="py-2 pr-4 font-semibold">Score Geral</th>
                <th className="py-2 pr-4 text-right font-semibold">
                  Estagnados (&gt;48h)
                </th>
                <th className="py-2 pr-4 text-right font-semibold">Cards "TI BH"</th>
                <th className="py-2 pr-4 text-right font-semibold">
                  Ganhos Zerados
                </th>
                <th className="py-2 text-right font-semibold">Perdas s/ Motivo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.loja}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="py-2.5 pr-4 font-medium text-slate-800 dark:text-slate-100">
                    {r.loja}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`inline-flex min-w-[3rem] justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${scoreBadge(
                        r.score
                      )}`}
                    >
                      {r.score}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-right text-slate-700 dark:text-slate-300">
                    {r.estagnados}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-slate-700 dark:text-slate-300">
                    {r.tiBh}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-slate-700 dark:text-slate-300">
                    {r.ganhosZerados}
                  </td>
                  <td className="py-2.5 text-right text-slate-700 dark:text-slate-300">
                    {r.perdasSemMotivo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
          Sem lojas para os filtros selecionados.
        </div>
      )}
    </div>
  );
}
