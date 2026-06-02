"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header";
import FilterBar from "@/components/FilterBar";
import KpiCard from "@/components/KpiCard";
import SlaCard from "@/components/SlaCard";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  applyFilters,
  getUniqueValues,
  DATE_RANGE_DEFAULT,
  PIPELINE_ALL,
  SOURCE_ALL,
} from "@/lib/filters";
import { computeMetrics, computeSLA, formatBRL } from "@/lib/metrics";
import SalesFunnelChart from "@/components/SalesFunnelChart";
import LossPieChart from "@/components/LossPieChart";
import { computeFunnel, computeLossAnalysis } from "@/lib/charts";
import StoreHygieneTable from "@/components/StoreHygieneTable";
import MarketingSection from "@/components/MarketingSection";
import { computeStoreHygiene } from "@/lib/audit";
import {
  computeCampaignPerformance,
  computeAiEfficiency,
} from "@/lib/marketing";
import SourceCrossSection from "@/components/SourceCrossSection";
import {
  computeStoreGeneration,
  computeMatrizVsUnidade,
} from "@/lib/crossref";

export default function DashboardPage() {
  const { data, leadsSdr, loading, error, lastUpdated } = useDashboardData();

  // Estado dos filtros (Etapa 2).
  const [filters, setFilters] = useState({
    dateRange: DATE_RANGE_DEFAULT,
    pipeline: PIPELINE_ALL,
    source: SOURCE_ALL,
  });

  // Opções únicas extraídas dos dados originais (sem mutar `data`).
  const pipelineOptions = useMemo(
    () => getUniqueValues(data, "pipeline"),
    [data]
  );
  const sourceOptions = useMemo(
    () => getUniqueValues(data, "utmSource"),
    [data]
  );

  // Dados filtrados (novo array, derivado de `data`).
  const filteredData = useMemo(
    () => applyFilters(data, filters),
    [data, filters]
  );

  // Métricas dos cards superiores (Etapa 3), derivadas do filteredData.
  const metrics = useMemo(() => computeMetrics(filteredData), [filteredData]);
  const sla = useMemo(() => computeSLA(filteredData), [filteredData]);

  // Agregações dos gráficos (Etapa 4), derivadas do filteredData.
  const funnelData = useMemo(() => computeFunnel(filteredData), [filteredData]);
  const lossAnalysis = useMemo(
    () => computeLossAnalysis(filteredData),
    [filteredData]
  );

  // Auditoria de lojas e performance de marketing (Etapa 5).
  const hygieneRows = useMemo(
    () => computeStoreHygiene(filteredData),
    [filteredData]
  );
  const campaigns = useMemo(
    () => computeCampaignPerformance(filteredData),
    [filteredData]
  );
  const aiEfficiency = useMemo(
    () => computeAiEfficiency(filteredData),
    [filteredData]
  );

  // Cruzamento entre abas (Etapa 6): SDR -> DEALS e Matriz vs Unidades.
  const generation = useMemo(
    () => computeStoreGeneration(leadsSdr, filteredData),
    [leadsSdr, filteredData]
  );
  const matrizVsUnidade = useMemo(
    () => computeMatrizVsUnidade(filteredData),
    [filteredData]
  );

  return (
    <>
      <Header title="Visão Geral" lastUpdated={lastUpdated} />

      <main className="space-y-6 p-6">
        {/* Barra de filtros */}
        <FilterBar
          filters={filters}
          onChange={setFilters}
          pipelineOptions={pipelineOptions}
          sourceOptions={sourceOptions}
          disabled={loading}
        />

        {loading && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-velot" />
            <span className="text-sm font-medium text-slate-600">
              Carregando dados da planilha...
            </span>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-medium text-red-700">
              Erro ao carregar os dados: {error.message}
            </p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Cards superiores — Visão Geral de Negócios */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Entrada SDR IA"
                value={leadsSdr.length.toLocaleString("pt-BR")}
                icon="🤖"
                accent="indigo"
                hint="Total de linhas da aba LEADS SDR"
              />
              <KpiCard
                label="Leads (Deals)"
                value={metrics.leadsGerados.toLocaleString("pt-BR")}
                icon="👥"
                hint="Total de deals filtrados"
              />
              <KpiCard
                label="Faturamento Realizado"
                value={formatBRL(metrics.faturamento)}
                icon="💰"
                accent="emerald"
                hint="Soma de QUANTIA · STATUS ganho"
              />
              <KpiCard
                label="Faturamento Perdido"
                value={formatBRL(metrics.faturamentoPerdido)}
                icon="💸"
                accent="red"
                hint="Soma de QUANTIA · STATUS perdido"
              />
              <KpiCard
                label="Vendas Realizadas"
                value={metrics.vendasRealizadas.toLocaleString("pt-BR")}
                icon="✅"
                accent="emerald"
                hint="STATUS ganho"
              />
              <KpiCard
                label="Vendas Perdidas"
                value={metrics.vendasPerdidas.toLocaleString("pt-BR")}
                icon="❌"
                accent="red"
                hint="STATUS perdido"
              />
              <KpiCard
                label="Leads Parados"
                value={metrics.leadsParados.toLocaleString("pt-BR")}
                icon="⏳"
                accent="amber"
                hint="Etapa inicial há mais de 24h"
              />
              <KpiCard
                label="Taxa de Conversão"
                value={`${metrics.taxaConversao.toFixed(1).replace(".", ",")}%`}
                icon="📈"
                hint="Vendas / Deals filtrados"
              />
            </div>

            {/* Cruzamento entre abas: Unidade vs Matriz + Geração por Loja */}
            <SourceCrossSection
              generation={generation}
              matrizVsUnidade={matrizVsUnidade}
            />

            {/* Card de Gestão de SLA (Speed to Lead) */}
            <SlaCard sla={sla} />

            {/* Gráficos: Funil de Vendas + Análise de Perdas (lado a lado) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SalesFunnelChart data={funnelData} />
              <LossPieChart analysis={lossAnalysis} />
            </div>

            {/* Auditoria de Lojas — Score de Higiene do CRM */}
            <StoreHygieneTable rows={hygieneRows} />

            {/* Módulo Performance de Marketing */}
            <MarketingSection
              campaigns={campaigns}
              aiEfficiency={aiEfficiency}
              leadsCount={metrics.leadsGerados}
              revenue={metrics.faturamento}
            />

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-base font-semibold text-slate-900">
              Leads Filtrados: {filteredData.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {data.length} leads no total · filtros aplicados sobre a base completa.
            </p>
            </div>
          </>
        )}
      </main>
    </>
  );
}
