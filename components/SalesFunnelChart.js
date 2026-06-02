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

/**
 * Funil de Vendas (BarChart horizontal) — Etapa 4.
 *
 * @param {{ data: Array<{ stage: string, count: number }> }} props
 */
export default function SalesFunnelChart({ data, isDark = false }) {
  const hasData = data.some((d) => d.count > 0);
  const tickColor = isDark ? "#94a3b8" : "#475569";
  const labelColor = isDark ? "#e2e8f0" : "#334155";
  const tooltipStyle = isDark
    ? { backgroundColor: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" }
    : { backgroundColor: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a" };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Funil de Vendas Consolidado
      </h2>
      <p className="mb-4 mt-0.5 text-xs text-slate-400 dark:text-slate-500">
        Contagem de deals por estágio
      </p>

      {hasData ? (
        <ResponsiveContainer width="100%" height={340}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 32, left: 8, bottom: 4 }}
          >
            <XAxis type="number" allowDecimals={false} hide />
            <YAxis
              type="category"
              dataKey="stage"
              width={130}
              tick={{ fontSize: 11, fill: tickColor }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: isDark ? "rgba(220,0,50,0.10)" : "rgba(220,0,50,0.06)" }}
              contentStyle={tooltipStyle}
              formatter={(value) => [value, "Leads"]}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={26}>
              {data.map((entry, index) => (
                <Cell
                  key={entry.stage}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                style={{ fontSize: 11, fill: labelColor, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[340px] items-center justify-center text-sm text-slate-400 dark:text-slate-500">
          Sem dados para os filtros selecionados.
        </div>
      )}
    </div>
  );
}
