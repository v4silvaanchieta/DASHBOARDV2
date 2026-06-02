"use client";

/**
 * Gauge circular com a nota geral de Higiene do CRM.
 * - Sem filtro de unidade: média geral dos scores das unidades.
 * - Com filtro de unidade: o score daquela unidade.
 *
 * @param {{ score: number|null, scopeName: string, count: number }} props
 */
export default function ScoreGauge({ score, scopeName, count }) {
  const value = typeof score === "number" ? Math.max(0, Math.min(100, score)) : null;

  // Cor por faixa (mesmos limiares da tabela de higiene).
  const color =
    value === null
      ? "#94a3b8"
      : value >= 90
      ? "#10b981"
      : value >= 70
      ? "#f59e0b"
      : "#f43f5e";

  const size = 132;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = value === null ? circumference : circumference * (1 - value / 100);

  return (
    <div className="flex flex-col items-center gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* trilha */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-slate-200 dark:stroke-slate-800"
          />
          {/* progresso */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            stroke={color}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            {value === null ? "—" : value}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            / 100
          </span>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Score Geral · Higiene do CRM
        </p>
        <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
          {scopeName}
        </p>
        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          {count === 1
            ? "Nota da unidade selecionada"
            : `Média de ${count} ${count === 1 ? "unidade" : "unidades"}`}
        </p>
      </div>
    </div>
  );
}
