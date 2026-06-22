"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar, { MENU_ITEMS } from "@/components/Sidebar";
import Header from "@/components/Header";
import FilterBar from "@/components/FilterBar";
import KpiCard from "@/components/KpiCard";
import SlaCard from "@/components/SlaCard";
import SalesFunnelChart from "@/components/SalesFunnelChart";
import ConversionStrip from "@/components/ConversionStrip";
import LossPieChart from "@/components/LossPieChart";
import StoreHygieneTable from "@/components/StoreHygieneTable";
import ScoreGauge from "@/components/ScoreGauge";
import MarketingSection from "@/components/MarketingSection";
import SourceCrossSection from "@/components/SourceCrossSection";
import StagnantAlert from "@/components/StagnantAlert";
import NegociosTab from "@/components/tabs/NegociosTab";
import ProdutosTab from "@/components/tabs/ProdutosTab";
import RelatoriosTab from "@/components/tabs/RelatoriosTab";
import ConfiguracoesTab from "@/components/tabs/ConfiguracoesTab";
import GerenciarAcessos from "@/components/tabs/GerenciarAcessos";
import PerfilTab from "@/components/tabs/PerfilTab";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  applyFilters,
  getUniqueValues,
  passesDateFilter,
  previousPeriodFilters,
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
import {
  computeStoreHygiene,
  computeStoreReport,
  SCORE_PENALTY,
} from "@/lib/audit";
import {
  computeCampaignPerformance,
  computeAiEfficiency,
} from "@/lib/marketing";
import {
  computeStoreGeneration,
  buildUnifiedContacts,
  phoneKey,
} from "@/lib/crossref";
import { computeProductRevenue } from "@/lib/products";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

/**
 * Calcula o badge de variação (Δ%) entre o valor atual e o de comparação.
 * `goodWhenDown` inverte a cor para métricas em que cair é bom (perdas, parados).
 * Retorna null quando não há período de comparação.
 */
function makeDelta(current, compare, goodWhenDown = false) {
  if (compare == null) return null;
  if (compare === 0) {
    if (!current) return { label: "0%", tone: "neutral" };
    return { label: "novo", tone: goodWhenDown ? "bad" : "good" };
  }
  const pct = ((current - compare) / compare) * 100;
  const up = pct > 0.05;
  const down = pct < -0.05;
  const arrow = up ? "▲" : down ? "▼" : "•";
  let tone = "neutral";
  if (up) tone = goodWhenDown ? "bad" : "good";
  else if (down) tone = goodWhenDown ? "good" : "bad";
  return {
    label: `${arrow} ${Math.abs(pct).toFixed(1).replace(".", ",")}%`,
    tone,
  };
}

const fmtCount = (n) => Number(n || 0).toLocaleString("pt-BR");
const fmtPct = (n) => `${Number(n || 0).toFixed(1).replace(".", ",")}%`;

/** Texto comparativo "vs [valor anterior] no período anterior" (ou undefined). */
function prevHint(previous, fmt) {
  if (previous == null) return undefined;
  return `vs ${fmt(previous)} no período anterior`;
}

export default function DashboardPage() {
  const { data, leadsSdr, loading, error, lastUpdated } = useDashboardData();

  // RBAC / Data Siloing: perfil do usuário (admin vê tudo; unit vê só sua pipeline).
  const { userData, logout } = useAuth();
  const router = useRouter();
  const isUnit = userData?.role === "unit" && Boolean(userData?.pipeline);
  const isAdmin = userData?.role === "admin";
  const unitPipeline = userData?.pipeline ?? "";

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
    customStart: "",
    customEnd: "",
  });

  // ISOLAMENTO NA RAIZ: para perfil "unit", retém APENAS registros da pipeline da
  // unidade logada antes de qualquer agregação (preserva toda a lógica downstream).
  const scopedData = useMemo(() => {
    if (!isUnit) return data;
    return data.filter((r) => String(r.pipeline ?? "").trim() === unitPipeline);
  }, [data, isUnit, unitPipeline]);

  const pipelineOptions = useMemo(
    () => getUniqueValues(data, "pipeline"),
    [data]
  );
  const sourceOptions = useMemo(
    () => getUniqueValues(scopedData, "utmSource"),
    [scopedData]
  );

  // Dados filtrados (novo array). Unit força o match exato da própria pipeline.
  const filteredData = useMemo(() => {
    const eff = isUnit ? { ...filters, pipeline: unitPipeline } : filters;
    return applyFilters(scopedData, eff);
  }, [scopedData, filters, isUnit, unitPipeline]);

  // Leads SDR respeitam o filtro de data; para unit, restringe aos leads cujo
  // telefone cruza com um deal da própria pipeline (não vê SDR da rede inteira).
  const filteredLeadsSdr = useMemo(() => {
    const byDate = leadsSdr.filter((l) => passesDateFilter(l.data, filters));
    if (!isUnit) return byDate;
    const phones = new Set();
    for (const d of filteredData) {
      for (const p of [d.telefone, d.cfTelefone]) {
        const k = phoneKey(p);
        if (k) phones.add(k);
      }
    }
    return byDate.filter((l) => {
      const k = phoneKey(l.telefone);
      return k && phones.has(k);
    });
  }, [leadsSdr, filters, isUnit, filteredData]);

  // Agregações (derivadas do filteredData) — calculadas uma vez por filtro.
  const metrics = useMemo(() => computeMetrics(filteredData), [filteredData]);
  const sla = useMemo(
    () => computeSLA(filteredData, settings.slaTargetMinutes),
    [filteredData, settings.slaTargetMinutes]
  );

  // PERÍODO ANTERIOR (Period-over-Period): mesma duração imediatamente antes do
  // período atual, respeitando o isolamento de loja/unidade. null = sem comparação.
  const compareMetrics = useMemo(() => {
    const pf = previousPeriodFilters(filters);
    if (!pf) return null;
    const eff = isUnit ? { ...pf, pipeline: unitPipeline } : pf;
    return computeMetrics(applyFilters(scopedData, eff));
  }, [scopedData, filters, isUnit, unitPipeline]);

  const compareSdrCount = useMemo(() => {
    const pf = previousPeriodFilters(filters);
    if (!pf) return null;
    const byDate = leadsSdr.filter((l) => passesDateFilter(l.data, pf));
    if (!isUnit) return byDate.length;
    // Para unidade, cruza com os deals da própria pipeline no período anterior.
    const eff = { ...pf, pipeline: unitPipeline };
    const prevDeals = applyFilters(scopedData, eff);
    const phones = new Set();
    for (const d of prevDeals) {
      for (const p of [d.telefone, d.cfTelefone]) {
        const k = phoneKey(p);
        if (k) phones.add(k);
      }
    }
    return byDate.filter((l) => {
      const k = phoneKey(l.telefone);
      return k && phones.has(k);
    }).length;
  }, [scopedData, leadsSdr, filters, isUnit, unitPipeline]);
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
    () => computeStoreGeneration(filteredLeadsSdr, filteredData),
    [filteredLeadsSdr, filteredData]
  );
  const products = useMemo(
    () => computeProductRevenue(filteredData),
    [filteredData]
  );

  // Lista unificada da aba Negócios: DEALS + leads exclusivos do SDR (sem duplicar).
  // Ao isolar uma loja específica, NÃO inclui leads "Apenas no SDR IA" (que não têm
  // pipeline) — eles só aparecem quando o filtro está em "Todas as Lojas".
  const negociosList = useMemo(() => {
    const sdrSource =
      filters.pipeline === PIPELINE_ALL ? filteredLeadsSdr : [];
    return buildUnifiedContacts(filteredData, sdrSource);
  }, [filteredData, filteredLeadsSdr, filters.pipeline]);

  // Matriz analítica da aba Relatórios (funil + higiene por unidade).
  const storeReport = useMemo(
    () => computeStoreReport(filteredData, settings.penalties),
    [filteredData, settings.penalties]
  );

  // Nota geral: MÉDIA PONDERADA pelo volume de leads das unidades ativas.
  // Score Geral = Σ(score_loja * leads_loja) / Σ(leads_loja das lojas ativas).
  const activeStores = useMemo(
    () => hygieneRows.filter((r) => r.totalLeads > 0),
    [hygieneRows]
  );
  const activeLeads = useMemo(
    () => activeStores.reduce((acc, r) => acc + r.totalLeads, 0),
    [activeStores]
  );
  const overallScore = useMemo(() => {
    if (!activeLeads) return null;
    const weighted = activeStores.reduce(
      (acc, r) => acc + r.score * r.totalLeads,
      0
    );
    // Arredonda para 1 casa decimal (ex.: 44.5).
    return Math.round((weighted / activeLeads) * 10) / 10;
  }, [activeStores, activeLeads]);
  const scoreScopeName = isUnit
    ? unitPipeline
    : filters.pipeline === PIPELINE_ALL
    ? "Todas as Unidades"
    : filters.pipeline;

  // Carrossel de Alertas Operacionais (4 slides) — derivado de hygieneRows.
  // "Pior loja" (top offender) ignora lojas sem leads (totalLeads <= 0).
  const operationalSlides = useMemo(() => {
    const active = hygieneRows.filter((r) => r.totalLeads > 0);
    const sumBy = (field) => active.reduce((acc, r) => acc + r[field], 0);
    const topBy = (field) => {
      let top = null;
      for (const r of active) {
        if (r[field] > 0 && (!top || r[field] > top[field])) top = r;
      }
      return top;
    };

    const tStag = topBy("estagnados");
    const tGanho = topBy("ganhosZerados");
    const tPerda = topBy("perdasSemMotivo");

    const critical = active.filter((r) => r.score < 70);
    let worst = null;
    for (const r of active) {
      if (!worst || r.score < worst.score) worst = r;
    }

    // Slide 5: leads ativos (open) represados no pipeline "Matriz".
    const matrizRetidos = filteredData.filter((r) => {
      const pipe = String(r.pipeline ?? "").toLowerCase();
      const status = String(r.status ?? "").trim().toLowerCase();
      const isOpen = status === "aberto" || status === "open" || status === "aberta";
      return pipe.includes("matriz") && isOpen;
    }).length;

    return [
      {
        kind: "stagnant",
        value: sumBy("estagnados"),
        topStore: tStag?.loja ?? null,
        topCount: tStag?.estagnados ?? 0,
      },
      {
        kind: "ganhoZerado",
        value: sumBy("ganhosZerados"),
        topStore: tGanho?.loja ?? null,
        topCount: tGanho?.ganhosZerados ?? 0,
      },
      {
        kind: "perdaSemMotivo",
        value: sumBy("perdasSemMotivo"),
        topStore: tPerda?.loja ?? null,
        topCount: tPerda?.perdasSemMotivo ?? 0,
      },
      {
        kind: "scoreCritico",
        value: critical.length,
        topStore: critical.length > 0 ? worst?.loja ?? null : null,
        topCount: worst?.score ?? 0,
      },
      {
        kind: "matrizRetidos",
        value: matrizRetidos,
        topStore: null,
        topCount: 0,
      },
    ];
  }, [hygieneRows, filteredData]);

  // Só entram na rotação os alertas com pendência (count > 0).
  // Se todos zerarem, o componente exibe o card de "Operação em Dia".
  const activeSlides = useMemo(
    () => operationalSlides.filter((s) => s.value > 0),
    [operationalSlides]
  );

  const activeLabel =
    MENU_ITEMS.find((m) => m.id === activeTab)?.label ?? "Dashboard";

  // Sem documento de permissão = SEM ACESSO (mesmo autenticado).
  // Fecha o vazamento de dados para usuários revogados/não configurados.
  if (!userData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center dark:bg-slate-950">
        <p className="text-base font-semibold text-slate-900 dark:text-slate-50">
          Acesso não liberado
        </p>
        <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Sua conta ainda não tem um perfil de acesso configurado (ou foi
          revogada). Solicite a um administrador da Velot que libere seu acesso.
        </p>
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.replace("/login");
          }}
          className="rounded-lg bg-[#DC0032] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#b8002a]"
        >
          Sair
        </button>
      </div>
    );
  }

  return (
    <>
      <Sidebar
        activeTab={activeTab}
        onSelect={setActiveTab}
        theme={theme}
        isAdmin={isAdmin}
      />

      <div className="min-h-screen md:pl-64">
        <Header
          title={activeLabel}
          lastUpdated={lastUpdated}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="space-y-6 p-6">
          {activeTab === "gerenciar-acessos" ? (
            isAdmin ? (
              <GerenciarAcessos pipelines={pipelineOptions} />
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                Acesso restrito a administradores.
              </div>
            )
          ) : activeTab === "perfil" ? (
            <PerfilTab />
          ) : (
            <>
          {/* Filtros globais — sempre no topo, afetam todas as abas */}
          <FilterBar
            filters={filters}
            onChange={setFilters}
            pipelineOptions={pipelineOptions}
            sourceOptions={sourceOptions}
            disabled={loading}
            hidePipeline={isUnit}
          />
          {!loading && !error && (
            <p className="-mt-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {filteredData.length.toLocaleString("pt-BR")}
              </span>{" "}
              deals após filtros · {scopedData.length.toLocaleString("pt-BR")} no
              total
              {isUnit && (
                <span className="ml-1 text-slate-400 dark:text-slate-500">
                  · unidade {unitPipeline}
                </span>
              )}
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
                  {/* Faixa de conversão: SDR IA -> Deals -> Vendas */}
                  <ConversionStrip
                    sdr={filteredLeadsSdr.length}
                    deals={metrics.leadsGerados}
                    vendas={metrics.vendasRealizadas}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <KpiCard
                      label="Entrada SDR IA"
                      value={filteredLeadsSdr.length.toLocaleString("pt-BR")}
                      icon="🤖"
                      accent="indigo"
                      delta={makeDelta(filteredLeadsSdr.length, compareSdrCount)}
                      hint={prevHint(compareSdrCount, fmtCount)}
                    />
                    <KpiCard
                      label="Leads Recebidos"
                      value={metrics.leadsGerados.toLocaleString("pt-BR")}
                      icon="👥"
                      delta={makeDelta(metrics.leadsGerados, compareMetrics?.leadsGerados)}
                      hint={prevHint(compareMetrics?.leadsGerados, fmtCount)}
                    />
                    <KpiCard
                      label="Faturamento Realizado"
                      value={formatBRL(metrics.faturamento)}
                      icon="💰"
                      accent="emerald"
                      delta={makeDelta(metrics.faturamento, compareMetrics?.faturamento)}
                      hint={prevHint(compareMetrics?.faturamento, formatBRL)}
                    />
                    <KpiCard
                      label="Faturamento Perdido"
                      value={formatBRL(metrics.faturamentoPerdido)}
                      icon="💸"
                      accent="red"
                      delta={makeDelta(
                        metrics.faturamentoPerdido,
                        compareMetrics?.faturamentoPerdido,
                        true
                      )}
                      hint={prevHint(compareMetrics?.faturamentoPerdido, formatBRL)}
                    />
                    <KpiCard
                      label="Leads Estagnados"
                      value={metrics.leadsParados.toLocaleString("pt-BR")}
                      icon="⏳"
                      accent="amber"
                      delta={makeDelta(
                        metrics.leadsParados,
                        compareMetrics?.leadsParados,
                        true
                      )}
                      hint={prevHint(compareMetrics?.leadsParados, fmtCount)}
                    />
                    <KpiCard
                      label="Taxa de Conversão"
                      value={`${metrics.taxaConversao
                        .toFixed(1)
                        .replace(".", ",")}%`}
                      icon="📈"
                      delta={makeDelta(
                        metrics.taxaConversao,
                        compareMetrics?.taxaConversao
                      )}
                      hint={prevHint(compareMetrics?.taxaConversao, fmtPct)}
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
              {activeTab === "negocios" && <NegociosTab data={negociosList} />}

              {/* === UNIDADES (Auditoria das Franquias) === */}
              {activeTab === "pipeline" && (
                <>
                  <ScoreGauge
                    score={overallScore}
                    scopeName={scoreScopeName}
                    leadsTotal={activeLeads}
                  />
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <StagnantAlert slides={activeSlides} />
                    <SourceCrossSection generation={generation} />
                  </div>
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
              {activeTab === "relatorios" && (
                <RelatoriosTab
                  sdrCount={filteredLeadsSdr.length}
                  dealsCount={filteredData.length}
                  rows={storeReport}
                />
              )}

              {/* === CONFIGURAÇÕES === */}
              {activeTab === "configuracoes" && (
                <ConfiguracoesTab settings={settings} onChange={setSettings} />
              )}
            </>
          )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
