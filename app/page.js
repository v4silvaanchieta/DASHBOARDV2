"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar, { MENU_ITEMS } from "@/components/Sidebar";
import Header from "@/components/Header";
import FilterBar from "@/components/FilterBar";
import KpiCard from "@/components/KpiCard";
import ConversionFunnel from "@/components/ConversionFunnel";
import LossReasons from "@/components/LossReasons";
import CampaignBreakdown from "@/components/CampaignBreakdown";
import CrmMatrix from "@/components/CrmMatrix";
import StoreHygieneTable from "@/components/StoreHygieneTable";
import ScoreGauge from "@/components/ScoreGauge";
import MarketingSection from "@/components/MarketingSection";
import SourceCrossSection from "@/components/SourceCrossSection";
import StagnantAlert from "@/components/StagnantAlert";
import NegociosTab from "@/components/tabs/NegociosTab";
import Campanhas from "@/components/tabs/Campanhas";
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
  countUniqueLeads,
  isQualifiedLead,
  formatBRL,
  SLA_TARGET_MINUTES,
} from "@/lib/metrics";
import { computeLossAnalysis } from "@/lib/charts";
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
import { campaignMatchesPipeline, computeCampaignTotals } from "@/lib/campaigns";
import { makeDelta, fmtCount, prevHint } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data, leadsSdr, campaignsData, loading, error, lastUpdated } =
    useDashboardData();

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

  // ISOLAMENTO NA RAIZ — CAMPANHAS (tráfego pago): BARREIRA DE SEGURANÇA.
  // Para perfil "unit", retém SOMENTE campanhas cujo Adset Name casa com a
  // cidade da pipeline da unidade (ex.: "Velot Ponta Grossa" -> "ponta grossa").
  // Nenhuma campanha de outra unidade pode vazar. (Regra Absoluta de Segurança.)
  const scopedCampaigns = useMemo(() => {
    if (!isUnit) return campaignsData;
    return campaignsData.filter((c) =>
      campaignMatchesPipeline(c.adsetName, unitPipeline)
    );
  }, [campaignsData, isUnit, unitPipeline]);

  // Campanhas filtradas por DATA (sempre) e por LOJA. Para "unit" o escopo já
  // está travado na raiz; para "admin", respeita o filtro global Loja/Franquia
  // (uma loja específica casa pela cidade no Adset; "Todas as Lojas" libera tudo).
  const filteredCampaignsData = useMemo(() => {
    return scopedCampaigns.filter((c) => {
      if (!passesDateFilter(c.date, filters)) return false;
      if (!isUnit && filters.pipeline && filters.pipeline !== PIPELINE_ALL) {
        if (!campaignMatchesPipeline(c.adsetName, filters.pipeline)) return false;
      }
      return true;
    });
  }, [scopedCampaigns, filters, isUnit]);

  // Investimento real em tráfego pago (soma de Spend) do escopo atual.
  const campaignSpend = useMemo(
    () => filteredCampaignsData.reduce((s, c) => s + (Number(c.spend) || 0), 0),
    [filteredCampaignsData]
  );

  // PERÍODO ANTERIOR (Campanhas): mesma duração imediatamente antes, com a MESMA
  // barreira de isolamento (unit travado na raiz; admin respeita Loja/Franquia).
  // null = sem período de comparação (ex.: "Todo o período").
  const previousCampaignsData = useMemo(() => {
    const pf = previousPeriodFilters(filters);
    if (!pf) return null;
    return scopedCampaigns.filter((c) => {
      if (!passesDateFilter(c.date, pf)) return false;
      if (!isUnit && pf.pipeline && pf.pipeline !== PIPELINE_ALL) {
        if (!campaignMatchesPipeline(c.adsetName, pf.pipeline)) return false;
      }
      return true;
    });
  }, [scopedCampaigns, filters, isUnit]);

  // Agregações (derivadas do filteredData) — calculadas uma vez por filtro.
  const metrics = useMemo(() => computeMetrics(filteredData), [filteredData]);
  const lossAnalysis = useMemo(
    () => computeLossAnalysis(filteredData),
    [filteredData]
  );

  // PERÍODO ANTERIOR (Period-over-Period): mesma duração imediatamente antes do
  // período atual, respeitando o isolamento de loja/unidade. null = sem comparação.
  const compareMetrics = useMemo(() => {
    const pf = previousPeriodFilters(filters);
    if (!pf) return null;
    const eff = isUnit ? { ...pf, pipeline: unitPipeline } : pf;
    return computeMetrics(applyFilters(scopedData, eff));
  }, [scopedData, filters, isUnit, unitPipeline]);

  // KPIs de tráfego pago (Marketing) — totais do período atual e anterior para
  // os cards macro do topo (conversas, CPA, CTR, investimento).
  const campaignTotals = useMemo(
    () => computeCampaignTotals(filteredCampaignsData),
    [filteredCampaignsData]
  );
  const prevCampaignTotals = useMemo(
    () =>
      previousCampaignsData ? computeCampaignTotals(previousCampaignsData) : null,
    [previousCampaignsData]
  );

  // ROAS = Ganhos (Faturamento Realizado do CRM) / Investimento (Spend). Período
  // anterior idem, quando há comparação e investimento > 0.
  const roas =
    campaignTotals.spend > 0 ? metrics.faturamento / campaignTotals.spend : 0;
  const prevRoas =
    compareMetrics && prevCampaignTotals && prevCampaignTotals.spend > 0
      ? compareMetrics.faturamento / prevCampaignTotals.spend
      : null;

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

  // Resumo executivo da aba Relatórios. Usa a MESMA base do menu principal:
  // leads ÚNICOS do CRM (deduplicados por contato) sobre o filteredData já
  // enjaulado na pipeline da unidade e filtrado por data. Assim o número bate
  // com a Visão Geral (sem contar re-entradas do mesmo lead):
  //  - Recebidos no SDR IA   = leads únicos recebidos no período (= CRM);
  //  - Qualificados/enviados = leads únicos que avançaram da pré-qualificação
  //    para o comercial (ver isQualifiedLead) ≤ Recebidos.
  const relatoriosResumo = useMemo(
    () => ({
      recebidos: countUniqueLeads(filteredData),
      qualificados: countUniqueLeads(filteredData.filter(isQualifiedLead)),
    }),
    [filteredData]
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
                  {/* LINHA 1 — 6 KPIs macro: 3 de Marketing (esquerda) + 3 de
                      Finanças (direita). Só título + número + badge de variação,
                      com o comparativo "vs X no período anterior". */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                    {/* — Bloco Esquerdo: Tráfego / Marketing — */}
                    <KpiCard
                      label="Conversas Iniciadas"
                      value={fmtCount(campaignTotals.conversations)}
                      icon="💬"
                      accent="indigo"
                      delta={makeDelta(
                        campaignTotals.conversations,
                        prevCampaignTotals?.conversations ?? null
                      )}
                      hint={prevHint(prevCampaignTotals?.conversations ?? null, fmtCount)}
                    />
                    <KpiCard
                      label="Custo por Conversa"
                      value={formatBRL(campaignTotals.costPerConversation)}
                      icon="🎯"
                      accent="amber"
                      delta={makeDelta(
                        campaignTotals.costPerConversation,
                        prevCampaignTotals?.costPerConversation ?? null,
                        true
                      )}
                      hint={prevHint(
                        prevCampaignTotals?.costPerConversation ?? null,
                        formatBRL
                      )}
                    />
                    <KpiCard
                      label="CTR Médio"
                      value={`${campaignTotals.ctr.toFixed(2).replace(".", ",")}%`}
                      icon="📊"
                      delta={makeDelta(campaignTotals.ctr, prevCampaignTotals?.ctr ?? null)}
                      hint={prevHint(
                        prevCampaignTotals?.ctr ?? null,
                        (v) => `${v.toFixed(2).replace(".", ",")}%`
                      )}
                    />

                    {/* — Bloco Direito: Finanças — */}
                    <KpiCard
                      label="Investimento"
                      value={formatBRL(campaignTotals.spend)}
                      icon="💸"
                      accent="amber"
                      delta={makeDelta(campaignTotals.spend, prevCampaignTotals?.spend ?? null)}
                      hint={prevHint(prevCampaignTotals?.spend ?? null, formatBRL)}
                    />
                    <KpiCard
                      label="Ganhos"
                      value={formatBRL(metrics.faturamento)}
                      icon="💰"
                      accent="emerald"
                      delta={makeDelta(metrics.faturamento, compareMetrics?.faturamento)}
                      hint={prevHint(compareMetrics?.faturamento ?? null, formatBRL)}
                    />
                    <KpiCard
                      label="ROAS"
                      value={`${roas.toFixed(2).replace(".", ",")}x`}
                      icon="📈"
                      accent="emerald"
                      delta={makeDelta(roas, prevRoas)}
                      hint={prevHint(prevRoas, (v) => `${v.toFixed(2).replace(".", ",")}x`)}
                    />
                  </div>

                  {/* BLOCO PRINCIPAL — 60% (Racional) / 40% (Emocional).
                      Casca com áreas demarcadas (populadas na próxima fase). */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    {/* Coluna Esquerda — Racional (60% = 3/5) */}
                    <div className="space-y-6 lg:col-span-3">
                      <CampaignBreakdown campaigns={filteredCampaignsData} />
                      <CrmMatrix rows={storeReport} title="Visualização do CRM" />
                    </div>

                    {/* Coluna Direita — Emocional (40% = 2/5) */}
                    <div className="space-y-6 lg:col-span-2">
                      <ConversionFunnel
                        stages={[
                          {
                            label: "Conversas Iniciadas",
                            value: campaignTotals.conversations,
                            color: "#c4b5fd",
                            captureLabel: "Captura",
                          },
                          {
                            label: "Chegou na Inteligência Artificial",
                            value: filteredLeadsSdr.length,
                            color: "#93c5fd",
                            captureLabel: "Qualif",
                          },
                          {
                            label: "Qualificados p/ CRM",
                            value: metrics.leadsUnicos,
                            color: "#5eead4",
                            captureLabel: "Fecham",
                          },
                          {
                            label: "Ganhos",
                            value: metrics.vendasRealizadas,
                            color: "#6ee7b7",
                          },
                        ]}
                      />
                      <LossReasons analysis={lossAnalysis} />
                    </div>
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

              {/* === CAMPANHAS (Tráfego Pago + Marketing) === */}
              {activeTab === "campanhas" && (
                <>
                  <Campanhas
                    campaigns={filteredCampaignsData}
                    previousCampaigns={previousCampaignsData}
                    isUnit={isUnit}
                    unitPipeline={unitPipeline}
                  />
                  <MarketingSection
                    campaigns={campaigns}
                    aiEfficiency={aiEfficiency}
                    leadsCount={metrics.leadsGerados}
                    revenue={metrics.faturamento}
                    spend={campaignSpend}
                    paidCampaignsCount={filteredCampaignsData.length}
                  />
                </>
              )}

              {/* === RELATÓRIOS === */}
              {activeTab === "relatorios" && (
                <RelatoriosTab
                  recebidosCount={relatoriosResumo.recebidos}
                  qualificadosCount={relatoriosResumo.qualificados}
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
