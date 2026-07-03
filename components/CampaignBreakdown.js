"use client";

import { useMemo, useState } from "react";
import CampaignTable from "@/components/CampaignTable";
import { formatBRL } from "@/lib/metrics";
import {
  groupCampaignsByName,
  groupCampaignsByAdset,
  groupCampaignsByAd,
} from "@/lib/campaigns";

/** Abas internas das tabelas de detalhamento. */
const DETAIL_TABS = [
  { id: "conjuntos", label: "Por Conjunto" },
  { id: "criativos", label: "Por Criativo" },
  { id: "campanhas", label: "Por Campanha" },
];

const fmtInt = (v) => Number(v || 0).toLocaleString("pt-BR");
const fmtCtr = (v) => `${(v || 0).toFixed(2).replace(".", ",")}%`;

/**
 * Detalhamento de Campanhas (tráfego pago) com toggle interno
 * Conjunto / Criativo / Campanha. Colunas padronizadas:
 * Anúncio/Campanha · Investimento · Conversas · CPA · CTR.
 *
 * Reutilizável na aba Campanhas e na coluna esquerda do Painel V4.
 *
 * @param {{ campaigns: Array<Record<string, any>> }} props
 */
export default function CampaignBreakdown({ campaigns }) {
  const byCampaign = useMemo(() => groupCampaignsByName(campaigns), [campaigns]);
  const byAdset = useMemo(() => groupCampaignsByAdset(campaigns), [campaigns]);
  const byAd = useMemo(() => groupCampaignsByAd(campaigns), [campaigns]);

  // Padrão: visão "Criativo" (anúncios mais fortes por conversas iniciadas).
  const [detailView, setDetailView] = useState("criativos");

  const adsetColumns = [
    { key: "adset", label: "Conjunto", align: "left", strong: true, render: (r) => r.adset },
    { key: "spend", label: "Investimento", align: "right", render: (r) => formatBRL(r.spend) },
    { key: "conversations", label: "Conversas", align: "right", render: (r) => fmtInt(r.conversations) },
    { key: "cpa", label: "CPA", align: "right", render: (r) => formatBRL(r.cpa) },
    { key: "ctr", label: "CTR", align: "right", render: (r) => fmtCtr(r.ctr) },
  ];
  const adColumns = [
    { key: "ad", label: "Anúncio", align: "left", strong: true, render: (r) => r.ad },
    { key: "campaign", label: "Campanha", align: "left", render: (r) => r.campaign },
    { key: "spend", label: "Investimento", align: "right", render: (r) => formatBRL(r.spend) },
    { key: "conversations", label: "Conversas", align: "right", render: (r) => fmtInt(r.conversations) },
    { key: "cpa", label: "CPA", align: "right", render: (r) => formatBRL(r.cpa) },
    { key: "ctr", label: "CTR", align: "right", render: (r) => fmtCtr(r.ctr) },
  ];
  const campaignColumns = [
    { key: "name", label: "Campanha", align: "left", strong: true, render: (r) => r.name },
    { key: "spend", label: "Investimento", align: "right", render: (r) => formatBRL(r.spend) },
    { key: "conversations", label: "Conversas", align: "right", render: (r) => fmtInt(r.conversations) },
    { key: "cpa", label: "CPA", align: "right", render: (r) => formatBRL(r.cpa) },
    { key: "ctr", label: "CTR", align: "right", render: (r) => fmtCtr(r.ctr) },
  ];

  return (
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
            {detailView === "campanhas" && "Campanhas por investimento no período"}
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
  );
}
