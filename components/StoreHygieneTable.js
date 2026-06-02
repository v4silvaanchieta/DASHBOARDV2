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
    if (score >= 90) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (score >= 70) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-rose-700 bg-rose-50 border-rose-200";
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Higiene e Adoção do CRM
      </h2>
      <p className="mb-4 mt-0.5 text-xs text-slate-400">
        Score de qualidade por loja (0–100) · regras do comitê comercial
      </p>

      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
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
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="py-2.5 pr-4 font-medium text-slate-800">
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
                  <td className="py-2.5 pr-4 text-right text-slate-700">
                    {r.estagnados}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-slate-700">
                    {r.tiBh}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-slate-700">
                    {r.ganhosZerados}
                  </td>
                  <td className="py-2.5 text-right text-slate-700">
                    {r.perdasSemMotivo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center text-sm text-slate-400">
          Sem lojas para os filtros selecionados.
        </div>
      )}
    </div>
  );
}
