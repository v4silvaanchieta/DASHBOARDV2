"use client";

import { useState } from "react";
import { formatBRL } from "@/lib/metrics";

/**
 * Módulo "Performance de Marketing" (Etapa 5).
 * - Tabela de performance por campanha (CF_UTM_CAMPAIGN).
 * - Card de Eficiência da IA (SDR IA -> etapas avançadas).
 * - Placeholders de CPL e ROI com input de verba (mockado) para cálculo futuro.
 *
 * @param {{
 *   campaigns: Array<{ campaign: string, leads: number, vendas: number, taxa: number }>,
 *   aiEfficiency: { sdrTotal: number, advanced: number, efficiency: number },
 *   leadsCount: number,
 *   revenue: number,
 * }} props
 */
export default function MarketingSection({
  campaigns,
  aiEfficiency,
  leadsCount,
  revenue,
}) {
  // Verba mockada para cálculo de CPL/ROI (será integrada futuramente).
  const [verba, setVerba] = useState(5000);

  const cpl = leadsCount > 0 ? verba / leadsCount : 0;
  const roi = verba > 0 ? ((revenue - verba) / verba) * 100 : 0;

  const fmtPct = (v) => `${v.toFixed(1).replace(".", ",")}%`;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Performance de Marketing
        </h2>
        <p className="mt-0.5 text-xs text-slate-400">
          Visão por fonte, campanha e eficiência da IA
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Tabela de Performance por Campanha */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Performance por Campanha
          </h3>
          {campaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
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
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-2.5 pr-4 font-medium text-slate-800">
                        {c.campaign}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-slate-700">
                        {c.leads}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-slate-700">
                        {c.vendas}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-slate-800">
                        {fmtPct(c.taxa)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-slate-400">
              Sem campanhas para os filtros selecionados.
            </div>
          )}
        </div>

        {/* Coluna lateral: Eficiência da IA + CPL/ROI */}
        <div className="space-y-6">
          {/* Card Eficiência da IA */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Eficiência da IA (SDR IA)
            </h3>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {fmtPct(aiEfficiency.efficiency)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {aiEfficiency.advanced} de {aiEfficiency.sdrTotal} leads de SDR IA
              chegaram às etapas avançadas (Triagem+)
            </p>
          </div>

          {/* Placeholders CPL e ROI */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Investimento (mock)
            </h3>
            <label className="mt-3 block">
              <span className="text-xs font-medium text-slate-500">
                Verba investida (R$)
              </span>
              <input
                type="number"
                min={0}
                value={verba}
                onChange={(e) => setVerba(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-velot focus:outline-none focus:ring-1 focus:ring-velot"
              />
            </label>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Custo por Lead (CPL)</p>
                <p className="mt-1 text-lg font-bold text-slate-800">
                  {formatBRL(cpl)}
                </p>
                <p className="text-[10px] text-slate-400">
                  Verba / {leadsCount} leads
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">ROI</p>
                <p
                  className={`mt-1 text-lg font-bold ${
                    roi >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {fmtPct(roi)}
                </p>
                <p className="text-[10px] text-slate-400">
                  (Receita − Verba) / Verba
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
