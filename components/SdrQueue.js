"use client";

/**
 * Fila de Atendimento (Pré-Qualificação SDR) — radar de gargalo em tempo real.
 * Lista as unidades com leads parados na etapa inicial do SDR IA (aguardando o
 * primeiro movimento), ordenadas do maior acúmulo para o menor. Substitui o
 * antigo card "Geração por Loja" mantendo o mesmo design de lista.
 *
 * @param {{ rows: Array<{ loja: string, count: number }> }} props
 */
export default function SdrQueue({ rows = [] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Fila de Atendimento (Pré-Qualificação SDR)
      </h2>
      <p className="mb-4 mt-0.5 text-xs text-slate-400 dark:text-slate-500">
        Leads aguardando o primeiro movimento da unidade (Real-Time)
      </p>

      {rows.length > 0 ? (
        <div className="max-h-56 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2 pr-4 font-semibold">Loja / Unidade</th>
                <th className="py-2 text-right font-semibold">Parados</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.loja}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="py-2 pr-4 text-slate-800 dark:text-slate-200">
                    {r.loja}
                  </td>
                  <td className="py-2 text-right font-semibold text-amber-600 dark:text-amber-400">
                    {r.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center px-4 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Nenhum lead acumulado nesta etapa. As unidades estão com o atendimento
          em dia!
        </div>
      )}
    </div>
  );
}
