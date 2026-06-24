"use client";

import { formatBRL } from "@/lib/metrics";

/**
 * Módulo "Performance de Marketing" (Etapa 5).
 * - Tabela de performance por campanha (CF_UTM_CAMPAIGN).
 * - Card de Eficiência da IA (SDR IA -> etapas avançadas).
 * - CPL e ROI calculados sobre o INVESTIMENTO REAL em tráfego pago (aba
 *   Campanhas), já isolado por unidade/cidade no nível dos dados.
 *
 * @param {{
 *   campaigns: Array<{ campaign: string, leads: number, vendas: number, taxa: number }>,
 *   aiEfficiency: { sdrTotal: number, advanced: number, efficiency: number },
 *   leadsCount: number,
 *   revenue: number,
 *   spend?: number,
 *   paidCampaignsCount?: number,
 * }} props
 */
export default function MarketingSection({
  campaigns,
  aiEfficiency,
  leadsCount,
  revenue,
  spend = 0,
  paidCampaignsCount = 0,
}) {
  // Investimento real (Spend somado da aba Campanhas, já isolado por unidade).
  const cpl = leadsCount > 0 ? spend / leadsCount : 0;
  const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;

  const fmtPct = (v) => `${v.toFixed(1).replace(".", ",")}%`;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Performance de Marketing
        </h2>
        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          Visão por fonte, campanha e eficiência da IA
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Tabela de Performance por Campanha */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Performance por Campanha
            </h3>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              Somente leads rastreáveis (UTM de tráfego pago) · orgânicos
              excluídos
            </p>
          </div>
          {campaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <th className="py-2 pr-4 font-medium">Campanha</th>
                    <th className="py-2 pr-4 text-right font-medium">
                      Leads Gerados
                    </th>
                    <th className="py-2 pr-4 text-right font-medium">
                      Vendas (Ganhos)
                    </th>
                    <th className="py-2 text-right font-medium">
                      Taxa de Conversão
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr
                      key={c.campaign}
                      className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                    >
                      <td className="py-2.5 pr-4 font-medium text-slate-800 dark:text-slate-100">
                        {c.campaign}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-slate-700 dark:text-slate-300">
                        {c.leads}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-slate-700 dark:text-slate-300">
                        {c.vendas}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-slate-800 dark:text-slate-100">
                        {fmtPct(c.taxa)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
              Sem campanhas para os filtros selecionados.
            </div>
          )}
        </div>

        {/* Coluna lateral: Eficiência da IA + CPL/ROI */}
        <div className="space-y-6">
          {/* Card Eficiência da IA */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Eficiência da IA (SDR IA)
            </h3>
            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-50">
              {fmtPct(aiEfficiency.efficiency)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {aiEfficiency.advanced} de {aiEfficiency.sdrTotal} leads de SDR IA
              chegaram às etapas avançadas (Triagem+)
            </p>
          </div>

          {/* Investimento REAL em tráfego pago (aba Campanhas) + CPL/ROI */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Investimento (Tráfego Pago)
            </h3>
            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-50">
              {formatBRL(spend)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {paidCampaignsCount.toLocaleString("pt-BR")} anúncios no período ·
              soma de Spend (isolado por unidade)
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Custo por Lead (CPL)
                </p>
                <p className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-100">
                  {formatBRL(cpl)}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Investimento / {leadsCount} leads
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="text-xs text-slate-500 dark:text-slate-400">ROI</p>
                <p
                  className={`mt-1 text-lg font-bold ${
                    roi >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {fmtPct(roi)}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  (Receita − Investimento) / Investimento
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
