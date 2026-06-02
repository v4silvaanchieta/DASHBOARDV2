"use client";

/**
 * Tabela de Auditoria de Lojas — Score de Higiene do CRM (Etapa 5).
 *
 * @param {{ rows: Array<{ loja: string, score: number, stagnant: number, tiBh: number, emptyFields: number, totalLeads: number }> }} props
 */
export default function StoreHygieneTable({ rows }) {
  /** Classe de cor do badge de score: verde > 80, amarelo > 50, vermelho < 50. */
  const scoreTone = (score) => {
    if (score > 80) return "bg-emerald-100 text-emerald-700";
    if (score > 50) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">
        Higiene do CRM e Adoção
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        Score de qualidade do cadastro por loja (0–100)
      </p>

      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-4 font-medium">Loja</th>
                <th className="py-2 pr-4 font-medium">Score</th>
                <th className="py-2 pr-4 text-right font-medium">
                  Leads Estagnados
                </th>
                <th className="py-2 pr-4 text-right font-medium">"TI BH"</th>
                <th className="py-2 text-right font-medium">Campos Vazios</th>
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
                      className={`inline-flex min-w-[3rem] justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${scoreTone(
                        r.score
                      )}`}
                    >
                      {r.score}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-right text-slate-700">
                    {r.stagnant}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-slate-700">
                    {r.tiBh}
                  </td>
                  <td className="py-2.5 text-right text-slate-700">
                    {r.emptyFields}
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
