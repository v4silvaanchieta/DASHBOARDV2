"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CHART_COLORS } from "@/lib/charts";
import { formatBRL } from "@/lib/metrics";

/**
 * Análise de Perdas (PieChart) + Faturamento Perdido — Etapa 4.
 *
 * @param {{ analysis: { slices: Array<{ name: string, count: number, value: number }>, totalLost: number, totalCount: number } }} props
 */
export default function LossPieChart({ analysis }) {
  const { slices, totalLost, totalCount } = analysis;
  const hasData = slices.length > 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Análise de Perdas
      </h2>
      <p className="mb-4 mt-0.5 text-xs text-slate-400">
        Motivos de perda · base para repescagem de consórcio
      </p>

      {hasData ? (
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-5">
          <div className="sm:col-span-3">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {slices.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, item) => [
                    `${value} leads · ${formatBRL(item?.payload?.value || 0)}`,
                    name,
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Faturamento Perdido */}
          <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-white p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Faturamento Perdido
            </p>
            <p className="mt-2 text-2xl font-bold text-red-600">
              {formatBRL(totalLost)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {totalCount} {totalCount === 1 ? "lead perdido" : "leads perdidos"}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
          Nenhum lead perdido para os filtros selecionados.
        </div>
      )}
    </div>
  );
}
