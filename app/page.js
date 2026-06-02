"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar, { MENU_ITEMS } from "@/components/Sidebar";
import Header from "@/components/Header";
import FilterBar from "@/components/FilterBar";
import KpiCard from "@/components/KpiCard";
import SlaCard from "@/components/SlaCard";
import SalesFunnelChart from "@/components/SalesFunnelChart";
import LossPieChart from "@/components/LossPieChart";
import StoreHygieneTable from "@/components/StoreHygieneTable";
import MarketingSection from "@/components/MarketingSection";
import SourceCrossSection from "@/components/SourceCrossSection";
import NegociosTab from "@/components/tabs/NegociosTab";
import ProdutosTab from "@/components/tabs/ProdutosTab";
import RelatoriosTab from "@/components/tabs/RelatoriosTab";
import ConfiguracoesTab from "@/components/tabs/ConfiguracoesTab";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  applyFilters,
  getUniqueValues,
  DATE_RANGE_DEFAULT,
  PIPELINE_ALL,
  SOURCE_ALL,
} from "@/lib/filters";
import {
  computeMetrics,
  computeSLA,
  formatBRL,
  SLA_TARGET_MINUTES,
} from "@/lib/metrics";
import { computeFunnel, computeLossAnalysis } from "@/lib/charts";
import { computeStoreHygiene, SCORE_PENALTY } from "@/lib/audit";
import {
  computeCampaignPerformance,
  computeAiEfficiency,
} from "@/lib/marketing";
import {
  computeStoreGeneration,
  computeMatrizVsUnidade,
} from "@/lib/crossref";
import { computeProductRevenue } from "@/lib/products";

export default function DashboardPage() {
  const { data, leadsSdr, loading, error, lastUpdated } = useDashboardData();

  // Navegação por abas (React Tabs) — mantém dados em memória + polling ativo.
  const [activeTab, setActiveTab] = useState("visao-geral");

  // Tema claro/escuro (apenas layout — não afeta dados/cálculos).
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    try {
      const stored = localStorage.getItem("velot-theme");
      if (stored === "dark" || stored === "light") {
        setTheme(stored);
        return;
      }
    } catch {}
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem("velot-theme", theme);
    } catch {}
  }, [theme]);
  const isDark = theme === "dark";
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // Configurações ajustáveis (aba Configurações).
  const [settings, setSettings] = useState({
    slaTargetMinutes: SLA_TARGET_MINUTES,
    penalties: { ...SCORE_PENALTY },
  });

  // Filtros globais (Etapa 2) — afetam o filteredData de TODAS as abas.
  const [filters, setFilters] = useState({
    dateRange: DATE_RANGE_DEFAULT,
    pipeline: PIPELINE_ALL,
    source: SOURCE_ALL,
  });

  const pipelineOptions = useMemo(() => getUniqueValues(data, "pipeline"), [data]);
  const sourceOptions = useMemo(() => getUniqueValues(data, "utmSource"), [data]);

  // Dados filtrados (novo array, derivado de `data`).
  const filteredData = useMemo(() => applyFilters(data, filters), [data, filters]);

  // Agregações (derivadas do filteredData) — calculadas uma vez por filtro.
  const metrics = useMemo(() => computeMetrics(filteredData), [filteredData]);
  const sla = useMemo(
    () => computeSLA(filteredData, settings.slaTargetMinutes),
    [filteredData, settings.slaTargetMinutes]
  );
  const funnelData = useMemo(() => computeFunnel(filteredData), [filteredData]);
  const lossAnalysis = useMemo(
    () => computeLossAnalysis(filteredData),
    [filteredData]
  );
  const hygieneRows = useMemo(
    () => computeStoreHygiene(filteredData, settings.penalties),
    [filteredData, settings.penalties]
  );
  const campaigns = useMemo(
    () => computeCampaignPerformance(filteredData),
    [filteredData]
  );
  const aiEfficiency = useMemo(
    () => computeAiEfficiency(filteredData),
    [filteredData]
  );
  const generation = useMemo(
    () => computeStoreGeneration(leadsSdr, filteredData),
    [leadsSdr, filteredData]
  );
  const matrizVsUnidade = useMemo(
    () => computeMatrizVsUnidade(filteredData),
    [filteredData]
  );
  const products = useMemo(
    () => computeProductRevenue(filteredData),
    [filteredData]
  );

  const activeLabel =
    MENU_ITEMS.find((m) => m.id === activeTab)?.label ?? "Dashboard";

  return (
    <>
      <Sidebar activeTab={activeTab} onSelect={setActiveTab} theme={theme} />

      <div className="min-h-screen md:pl-64">
        <Header
          title={activeLabel}
          lastUpdated={lastUpdated}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="space-y-6 p-6">
          {/* Filtros globais — sempre no topo, afetam todas as abas */}
          <FilterBar
            filters={filters}
            onChange={setFilters}
            pipelineOptions={pipelineOptions}
            sourceOptions={sourceOptions}
            disabled={loading}
          />
          {!loading && !error && (
            <p className="-mt-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {filteredData.length.toLocaleString("pt-BR")}
              </span>{" "}
              deals após filtros · {data.length.toLocaleString("pt-BR")} no total
            </p>
          )}

          {loading && (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-velot dark:border-slate-700 dark:border-t-velot" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Carregando dados da planilha...
              </span>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-500/30 dark:bg-red-500/10">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Erro ao carregar os dados: {error.message}
              </p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* === VISÃO GERAL === */}
              {activeTab === "visao-geral" && (
                <>
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
                      value={`${metrics.taxaConversao
                        .toFixed(1)
                        .replace(".", ",")}%`}
                      icon="📈"
                      hint="Vendas / Deals filtrados"
                    />
                  </div>

                  <SlaCard sla={sla} />

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <SalesFunnelChart data={funnelData} isDark={isDark} />
                    <LossPieChart analysis={lossAnalysis} isDark={isDark} />
                  </div>
                </>
              )}

              {/* === NEGÓCIOS === */}
              {activeTab === "negocios" && <NegociosTab data={filteredData} />}

              {/* === PIPELINE (Auditoria das Franquias) === */}
              {activeTab === "pipeline" && (
                <>
                  <SourceCrossSection
                    generation={generation}
                    matrizVsUnidade={matrizVsUnidade}
                  />
                  <StoreHygieneTable rows={hygieneRows} />
                </>
              )}

              {/* === PRODUTOS === */}
              {activeTab === "produtos" && (
                <ProdutosTab products={products} isDark={isDark} />
              )}

              {/* === CAMPANHAS (Marketing) === */}
              {activeTab === "campanhas" && (
                <MarketingSection
                  campaigns={campaigns}
                  aiEfficiency={aiEfficiency}
                  leadsCount={metrics.leadsGerados}
                  revenue={metrics.faturamento}
                />
              )}

              {/* === RELATÓRIOS === */}
              {activeTab === "relatorios" && <RelatoriosTab data={filteredData} />}

              {/* === CONFIGURAÇÕES === */}
              {activeTab === "configuracoes" && (
                <ConfiguracoesTab settings={settings} onChange={setSettings} />
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
