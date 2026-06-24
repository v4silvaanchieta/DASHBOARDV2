"use client";

import { useMemo } from "react";
import KpiCard from "@/components/KpiCard";
import { formatBRL } from "@/lib/metrics";
import { computeCampaignTotals, groupCampaignsByName } from "@/lib/campaigns";

/**
 * Aba "Campanhas" — Tráfego Pago (Meta Ads).
 * Exibe os dados da aba Campanhas já FILTRADOS por data/loja e ISOLADOS por
 * unidade (a barreira de cidade no Adset Name é aplicada antes, em page.js).
 *
 * O filtro global (Período / Loja) fica no topo do app e alimenta `campaigns`.
 *
 * @param {{ campaigns: Array<Record<string, any>>, isUnit?: boolean, unitPipeline?: string }} props
 */
export default function Campanhas({ campaigns, isUnit = false, unitPipeline = "" }) {
  const totals = useMemo(() => computeCampaignTotals(campaigns), [campaigns]);
  const byCampaign = useMemo(() => groupCampaignsByName(campaigns), [campaigns]);

  const fmtInt = (v) => Number(v || 0).toLocaleString("pt-BR");
  const fmtPct = (v) => `${(v || 0).toFixed(2).replace(".", ",")}%`;

  const numCell =
    "py-2.5 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300";

  return (
    <section className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Campanhas — Tráfego Pago
        </h2>
        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          Meta Ads · {fmtInt(campaigns.length)} anúncios no período
          {isUnit ? ` · unidade ${unitPipeline}` : ""} (isolado por cidade)
        </p>
      </div>

      {/* KPIs de mídia paga */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Investimento"
          value={formatBRL(totals.spend)}
          icon="💸"
          accent="emerald"
          hint="Soma de Spend no período"
        />
        <KpiCard
          label="Impressões"
          value={fmtInt(totals.impressions)}
          icon="👁️"
          accent="indigo"
          hint="Alcance bruto dos anúncios"
        />
        <KpiCard
          label="Cliques"
          value={fmtInt(totals.clicks)}
          icon="🖱️"
          hint={`CTR médio: ${fmtPct(totals.ctr)}`}
        />
        <KpiCard
          label="CPC Médio"
          value={formatBRL(totals.cpc)}
          icon="🎯"
          hint="Custo por clique"
        />
        <KpiCard
          label="CPM Médio"
          value={formatBRL(totals.cpm)}
          icon="📊"
          hint="Custo por mil impressões"
        />
        <KpiCard
          label="Conversas Iniciadas"
          value={fmtInt(totals.conversations)}
          icon="💬"
          accent="amber"
          hint={`Custo/conversa: ${formatBRL(totals.costPerConversation)}`}
        />
      </div>

      {/* Tabela: performance por campanha */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Performance por Campanha
        </h3>

        {byCampaign.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2 pr-3 font-semibold">Campanha</th>
                  <th className="py-2 px-3 text-right font-semibold">Investim.</th>
                  <th className="py-2 px-3 text-right font-semibold">Impressões</th>
                  <th className="py-2 px-3 text-right font-semibold">Cliques</th>
                  <th className="py-2 px-3 text-right font-semibold">CTR</th>
                  <th className="py-2 px-3 text-right font-semibold">CPC</th>
                  <th className="py-2 pl-3 text-right font-semibold">Conversas</th>
                </tr>
              </thead>
              <tbody>
                {byCampaign.map((c) => (
                  <tr
                    key={c.name}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="py-2.5 pr-3 font-medium text-slate-800 dark:text-slate-100">
                      {c.name}
                    </td>
                    <td className={`${numCell} font-semibold text-slate-900 dark:text-slate-50`}>
                      {formatBRL(c.spend)}
                    </td>
                    <td className={numCell}>{fmtInt(c.impressions)}</td>
                    <td className={numCell}>{fmtInt(c.clicks)}</td>
                    <td className={numCell}>{fmtPct(c.ctr)}</td>
                    <td className={numCell}>{formatBRL(c.cpc)}</td>
                    <td className="py-2.5 pl-3 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                      {fmtInt(c.conversations)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center text-center text-sm text-slate-400 dark:text-slate-500">
            Nenhuma campanha de tráfego pago para os filtros selecionados.
          </div>
        )}
      </div>
    </section>
  );
}
