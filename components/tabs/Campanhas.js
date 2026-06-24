"use client";

import { useMemo, useState } from "react";
import KpiCard from "@/components/KpiCard";
import CampaignTable from "@/components/CampaignTable";
import { formatBRL } from "@/lib/metrics";
import {
  computeCampaignTotals,
  groupCampaignsByName,
  groupCampaignsByAdset,
  groupCampaignsByAd,
} from "@/lib/campaigns";
import { makeDelta, prevHint } from "@/lib/format";

/** Abas internas das tabelas de detalhamento. */
const DETAIL_TABS = [
  { id: "conjuntos", label: "Por Conjunto" },
  { id: "criativos", label: "Por Criativo" },
  { id: "campanhas", label: "Por Campanha" },
];

/**
 * Aba "Campanhas" — Tráfego Pago (Meta Ads).
 * Exibe os dados da aba Campanhas já FILTRADOS por data/loja e ISOLADOS por
 * unidade (a barreira de cidade no Adset Name é aplicada antes, em page.js).
 *
 * Cards macro comparam o Período Atual (`campaigns`) com o Período Anterior
 * equivalente (`previousCampaigns`), no mesmo modelo da Visão Geral.
 *
 * O filtro global (Período / Loja) fica no topo do app e alimenta `campaigns`.
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
  const byCampaign = useMemo(() => groupCampaignsByName(campaigns), [campaigns]);
  const byAdset = useMemo(() => groupCampaignsByAdset(campaigns), [campaigns]);
  const byAd = useMemo(() => groupCampaignsByAd(campaigns), [campaigns]);

  const [detailView, setDetailView] = useState("conjuntos");

  const fmtInt = (v) => Number(v || 0).toLocaleString("pt-BR");
  const fmtCtr = (v) => `${(v || 0).toFixed(2).replace(".", ",")}%`;

  // Configuração de colunas das três visões (formatação R$/% por coluna).
  const adsetColumns = [
    { key: "adset", label: "Conjunto de Anúncio", align: "left", strong: true, render: (r) => r.adset },
    { key: "spend", label: "Investimento", align: "right", render: (r) => formatBRL(r.spend) },
    { key: "conversations", label: "Conversas", align: "right", render: (r) => fmtInt(r.conversations) },
    { key: "cpa", label: "CPA", align: "right", render: (r) => formatBRL(r.cpa) },
    { key: "ctr", label: "CTR", align: "right", render: (r) => fmtCtr(r.ctr) },
  ];
  const adColumns = [
    { key: "ad", label: "Anúncio (Criativo)", align: "left", strong: true, render: (r) => r.ad },
    { key: "campaign", label: "Campanha", align: "left", render: (r) => r.campaign },
    { key: "spend", label: "Investimento", align: "right", render: (r) => formatBRL(r.spend) },
    { key: "conversations", label: "Conversas", align: "right", render: (r) => fmtInt(r.conversations) },
    { key: "cpa", label: "CPA", align: "right", render: (r) => formatBRL(r.cpa) },
    { key: "ctr", label: "CTR", align: "right", render: (r) => fmtCtr(r.ctr) },
  ];
  const campaignColumns = [
    { key: "name", label: "Campanha", align: "left", strong: true, render: (r) => r.name },
    { key: "spend", label: "Investimento", align: "right", render: (r) => formatBRL(r.spend) },
    { key: "impressions", label: "Impressões", align: "right", render: (r) => fmtInt(r.impressions) },
    { key: "clicks", label: "Cliques", align: "right", render: (r) => fmtInt(r.clicks) },
    { key: "ctr", label: "CTR", align: "right", render: (r) => fmtCtr(r.ctr) },
    { key: "cpc", label: "CPC", align: "right", render: (r) => formatBRL(r.cpc) },
    { key: "conversations", label: "Conversas", align: "right", render: (r) => fmtInt(r.conversations) },
  ];

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
          delta={makeDelta(
            totals.conversations,
            prevTotals?.conversations ?? null
          )}
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

      {/* Detalhamento — abas internas: Conjuntos / Criativos / Campanhas */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Detalhamento de Campanhas
            </h3>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              {detailView === "conjuntos" &&
                "Conjuntos de anúncio (cidades / segmentações) por investimento"}
              {detailView === "criativos" &&
                "Criativos mais fortes — ordenados por conversas iniciadas"}
              {detailView === "campanhas" &&
                "Campanhas por investimento no período"}
            </p>
          </div>

          {/* Segmented control (abas internas) */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-800/60">
            {DETAIL_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setDetailView(t.id)}
                aria-pressed={detailView === t.id}
                className={[
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                  detailView === t.id
                    ? "bg-velot text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
                ].join(" ")}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {detailView === "conjuntos" && (
          <CampaignTable
            columns={adsetColumns}
            rows={byAdset}
            emptyLabel="Nenhum conjunto de anúncio para os filtros selecionados."
          />
        )}
        {detailView === "criativos" && (
          <CampaignTable
            columns={adColumns}
            rows={byAd}
            emptyLabel="Nenhum criativo para os filtros selecionados."
          />
        )}
        {detailView === "campanhas" && (
          <CampaignTable
            columns={campaignColumns}
            rows={byCampaign}
            emptyLabel="Nenhuma campanha de tráfego pago para os filtros selecionados."
          />
        )}
      </div>
    </section>
  );
}
