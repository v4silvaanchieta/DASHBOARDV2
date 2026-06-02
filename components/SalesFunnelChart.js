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
export default function SalesFunnelChart({ data }) {
  const hasData = data.some((d) => d.count > 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">
        Funil de Vendas Consolidado
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        Contagem de leads por estágio
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
              tick={{ fontSize: 11, fill: "#475569" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(79,70,229,0.06)" }}
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
                style={{ fontSize: 11, fill: "#334155", fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[340px] items-center justify-center text-sm text-slate-400">
          Sem dados para os filtros selecionados.
        </div>
      )}
    </div>
  );
}
