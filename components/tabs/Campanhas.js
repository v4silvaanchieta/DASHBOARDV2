"use client";

import { useMemo } from "react";
import KpiCard from "@/components/KpiCard";
import CampaignBreakdown from "@/components/CampaignBreakdown";
import { formatBRL } from "@/lib/metrics";
import { computeCampaignTotals } from "@/lib/campaigns";
import { makeDelta, prevHint } from "@/lib/format";

const fmtInt = (v) => Number(v || 0).toLocaleString("pt-BR");
const fmtCtr = (v) => `${(v || 0).toFixed(2).replace(".", ",")}%`;

/**
 * Aba "Campanhas" — Tráfego Pago (Meta Ads).
 * Exibe os dados da aba Campanhas já FILTRADOS por data/loja e ISOLADOS por
 * unidade (a barreira de cidade no Adset Name é aplicada antes, em page.js).
 *
 * Cards macro comparam o Período Atual (`campaigns`) com o Período Anterior
 * equivalente (`previousCampaigns`); o detalhamento (toggle Conjunto/Criativo/
 * Campanha) é o mesmo componente reutilizado no Painel V4.
 *
 * @param {{
 *   campaigns: Array<Record<string, any>>,
 *   previousCampaigns?: Array<Record<string, any>>|null,
 *   isUnit?: boolean,
 *   unitPipeline?: string,
 * }} props
 */
export default function Campanhas({
  campaigns,
  previousCampaigns = null,
  isUnit = false,
  unitPipeline = "",
}) {
  const totals = useMemo(() => computeCampaignTotals(campaigns), [campaigns]);
  const prevTotals = useMemo(
    () => (previousCampaigns ? computeCampaignTotals(previousCampaigns) : null),
    [previousCampaigns]
  );

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

      {/* KPIs macro — comparativo period-over-period (vs período anterior) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Investimento Total"
          value={formatBRL(totals.spend)}
          icon="💸"
          accent="emerald"
          delta={makeDelta(totals.spend, prevTotals?.spend ?? null)}
          hint={prevHint(prevTotals?.spend ?? null, formatBRL)}
        />
        <KpiCard
          label="Conversas Iniciadas"
          value={fmtInt(totals.conversations)}
          icon="💬"
          accent="indigo"
          delta={makeDelta(totals.conversations, prevTotals?.conversations ?? null)}
          hint={prevHint(prevTotals?.conversations ?? null, fmtInt)}
        />
        <KpiCard
          label="Custo por Conversa"
          value={formatBRL(totals.costPerConversation)}
          icon="🎯"
          accent="amber"
          // Custo: cair é BOM -> goodWhenDown inverte verde/vermelho.
          delta={makeDelta(
            totals.costPerConversation,
            prevTotals?.costPerConversation ?? null,
            true
          )}
          hint={prevHint(prevTotals?.costPerConversation ?? null, formatBRL)}
        />
        <KpiCard
          label="CTR Médio"
          value={fmtCtr(totals.ctr)}
          icon="📊"
          delta={makeDelta(totals.ctr, prevTotals?.ctr ?? null)}
          hint={prevHint(prevTotals?.ctr ?? null, fmtCtr)}
        />
      </div>

      {/* Detalhamento (toggle Conjunto / Criativo / Campanha) */}
      <CampaignBreakdown campaigns={campaigns} />
    </section>
  );
}
