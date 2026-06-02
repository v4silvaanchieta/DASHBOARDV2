"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS } from "@/lib/charts";
import { formatBRL } from "@/lib/metrics";

/**
 * Aba "Produtos" — faturamento por modelo de moto + Alerta de Infrações.
 *
 * @param {{ products: { byModel: Array<{ model: string, total: number, count: number }>, infraCount: number, totalGanho: number } }} props
 */
export default function ProdutosTab({ products, isDark = false }) {
  const { byModel, infraCount, totalGanho } = products;
  const top = byModel.slice(0, 12);
  const tickColor = isDark ? "#94a3b8" : "#475569";
  const labelColor = isDark ? "#e2e8f0" : "#334155";
  const tooltipStyle = isDark
    ? { backgroundColor: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" }
    : { backgroundColor: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a" };

  return (
    <div className="space-y-6">
      {/* Alerta de Infrações */}
      <div
        className={`rounded-xl border bg-white p-5 shadow-sm transition-colors dark:bg-slate-900 ${
          infraCount > 0
            ? "border-rose-200 dark:border-rose-500/30"
            : "border-slate-200 dark:border-slate-800"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Alerta de Infrações · Ganhos sem Valor
            </h2>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              Vendas "Ganho" com QUANTIA zerada (catálogo de produtos não utilizado)
            </p>
          </div>
          <span className="text-2xl" aria-hidden="true">
            {infraCount > 0 ? "🚨" : "✅"}
          </span>
        </div>
        <p
          className={`mt-3 text-3xl font-bold ${
            infraCount > 0
              ? "text-rose-600 dark:text-rose-400"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {infraCount.toLocaleString("pt-BR")}
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Faturamento total catalogado: {formatBRL(totalGanho)}
        </p>
      </div>

      {/* Faturamento por Modelo */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Faturamento por Modelo
        </h2>
        <p className="mb-4 mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          Soma de QUANTIA dos deals ganhos, por modelo de moto
        </p>

        {top.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(240, top.length * 34)}>
            <BarChart
              data={top}
              layout="vertical"
              margin={{ top: 4, right: 90, left: 8, bottom: 4 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="model"
                width={180}
                tick={{ fontSize: 11, fill: tickColor }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: isDark ? "rgba(220,0,50,0.10)" : "rgba(220,0,50,0.06)" }}
                contentStyle={tooltipStyle}
                formatter={(value) => [formatBRL(value), "Faturamento"]}
              />
              <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={22}>
                {top.map((entry, index) => (
                  <Cell
                    key={entry.model}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
                <LabelList
                  dataKey="total"
                  position="right"
                  formatter={(v) => formatBRL(v)}
                  style={{ fontSize: 10, fill: labelColor, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
            Nenhuma venda com valor para os filtros selecionados.
          </div>
        )}
      </div>
    </div>
  );
}
