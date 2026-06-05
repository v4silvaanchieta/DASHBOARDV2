"use client";

import { useState } from "react";
import KpiCard from "@/components/KpiCard";

/** Colunas exportadas (rótulo -> chave) para o "Copiar matriz". */
const EXPORT_COLUMNS = [
  ["Loja / Franquia", "loja"],
  ["Pré-Qualificação (SDR/IA)", "preQualif"],
  ["Novos Leads / Em Atendimento", "novosLeads"],
  ["Triagem", "triagem"],
  ["Análise / Crédito", "analise"],
  ["Faturamento", "faturamento"],
  ["Score Geral", "score"],
  ["Estagnados >48h", "estagnadosPreQ"],
  ['Cards "TI BH"', "tiBh"],
  ["Ganhos Zerados", "ganhosZerados"],
  ["Perdas sem Motivo", "perdasSemMotivo"],
];

function csvCell(value) {
  const s = String(value ?? "");
  if (/[";\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Cor do badge de score (mesmos limiares da aba Unidades). */
function scoreBadge(score) {
  if (score >= 90)
    return "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/30";
  if (score >= 70)
    return "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/30";
  return "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/30";
}

/**
 * Aba "Relatórios" — Relatório Gerencial Consolidado.
 *
 * @param {{ sdrCount: number, dealsCount: number, rows: Array<Object> }} props
 */
export default function RelatoriosTab({ sdrCount, dealsCount, rows }) {
  const [copied, setCopied] = useState(false);

  const conversion =
    sdrCount > 0 ? ((dealsCount / sdrCount) * 100).toFixed(1).replace(".", ",") : "0";

  const handleCopy = async () => {
    const header = EXPORT_COLUMNS.map(([label]) => csvCell(label)).join(";");
    const lines = rows.map((r) =>
      EXPORT_COLUMNS.map(([, key]) => csvCell(r[key])).join(";")
    );
    try {
      await navigator.clipboard.writeText([header, ...lines].join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const numCell = "py-2.5 px-3 text-center tabular-nums text-slate-700 dark:text-slate-300";

  return (
    <div className="space-y-6">
      {/* 1. Resumo Executivo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard
          label="Leads Recebidos no SDR IA"
          value={sdrCount.toLocaleString("pt-BR")}
          icon="🤖"
          accent="indigo"
          hint="Aba LEADS SDR · período filtrado"
        />
        <KpiCard
          label="Qualificados e Enviados às Lojas"
          value={dealsCount.toLocaleString("pt-BR")}
          icon="🏪"
          accent="emerald"
          hint="Deals distribuídos às pipelines (CRM)"
        />
      </div>

      <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        Dos{" "}
        <span className="font-semibold text-slate-900 dark:text-slate-50">
          {sdrCount.toLocaleString("pt-BR")}
        </span>{" "}
        leads que entraram no SDR IA,{" "}
        <span className="font-semibold text-slate-900 dark:text-slate-50">
          {dealsCount.toLocaleString("pt-BR")}
        </span>{" "}
        avançaram para o CRM comercial (
        <span className="font-semibold text-velot">{conversion}%</span>).
      </p>

      {/* 2. Matriz Analítica Consolidada */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Matriz Analítica por Unidade
            </h2>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              Funil de cards abertos + higiene · ordenado pelo pior Score
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            disabled={rows.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-velot px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-velot-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copied ? "✅ Copiado!" : "📋 Copiar matriz (CSV)"}
          </button>
        </div>

        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2 pr-3 font-semibold">Loja / Franquia</th>
                  <th className="py-2 px-3 text-center font-semibold">Pré-Qualif.</th>
                  <th className="py-2 px-3 text-center font-semibold">Novos / Atend.</th>
                  <th className="py-2 px-3 text-center font-semibold">Triagem</th>
                  <th className="py-2 px-3 text-center font-semibold">Análise</th>
                  <th className="py-2 px-3 text-center font-semibold">Faturam.</th>
                  <th className="py-2 px-3 text-center font-semibold">Score</th>
                  <th className="py-2 px-3 text-center font-semibold">Estag. &gt;48h</th>
                  <th className="py-2 px-3 text-center font-semibold">TI BH</th>
                  <th className="py-2 px-3 text-center font-semibold">Ganhos Zerados</th>
                  <th className="py-2 px-3 text-center font-semibold">Perdas s/ Motivo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.loja}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="py-2.5 pr-3 font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">
                      {r.loja}
                    </td>
                    <td className={numCell}>{r.preQualif}</td>
                    <td className={numCell}>{r.novosLeads}</td>
                    <td className={numCell}>{r.triagem}</td>
                    <td className={numCell}>{r.analise}</td>
                    <td className={numCell}>{r.faturamento}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex min-w-[2.75rem] justify-center rounded-full border px-2 py-0.5 text-xs font-semibold ${scoreBadge(
                          r.score
                        )}`}
                      >
                        {r.score}
                      </span>
                    </td>
                    <td className={numCell}>{r.estagnadosPreQ}</td>
                    <td className={numCell}>{r.tiBh}</td>
                    <td className={numCell}>{r.ganhosZerados}</td>
                    <td className={numCell}>{r.perdasSemMotivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
            Nenhuma unidade com leads no período selecionado.
          </div>
        )}
      </div>
    </div>
  );
}
