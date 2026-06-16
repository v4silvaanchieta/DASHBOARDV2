"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronsUpDown, ChevronUp, Download } from "lucide-react";
import KpiCard from "@/components/KpiCard";

/** Colunas da matriz: chave, rótulo, tipo (p/ ordenação) e alinhamento. */
const COLUMNS = [
  { key: "loja", label: "Loja / Franquia", type: "string", align: "left" },
  { key: "totalLeads", label: "Total Leads", type: "number", align: "center" },
  { key: "preQualif", label: "Pré-Qualif.", type: "number", align: "center" },
  { key: "novosLeads", label: "Novos / Atend.", type: "number", align: "center" },
  { key: "triagem", label: "Triagem", type: "number", align: "center" },
  { key: "analise", label: "Análise", type: "number", align: "center" },
  { key: "faturamento", label: "Faturam.", type: "number", align: "center" },
  { key: "score", label: "Score", type: "number", align: "center" },
  { key: "estagnadosPreQ", label: "Estag. >48h", type: "number", align: "center" },
  { key: "tiBh", label: "TI BH", type: "number", align: "center" },
  { key: "ganhosZerados", label: "Ganhos Zerados", type: "number", align: "center" },
  { key: "perdasSemMotivo", label: "Perdas s/ Motivo", type: "number", align: "center" },
];

/** Colunas exportadas (rótulo -> chave) — usadas no copiar e no download. */
const EXPORT_COLUMNS = [
  ["Unidade", "loja"],
  ["Total Leads", "totalLeads"],
  ["Pré-Qualificação", "preQualif"],
  ["Novos Leads", "novosLeads"],
  ["Triagem", "triagem"],
  ["Análise", "analise"],
  ["Faturamento", "faturamento"],
  ["Score Geral", "score"],
  ["Estagnados", "estagnadosPreQ"],
  ["Cards TI BH", "tiBh"],
  ["Ganhos Zerados", "ganhosZerados"],
  ["Perdas Sem Motivo", "perdasSemMotivo"],
];

function csvCell(value) {
  const s = String(value ?? "");
  if (/[";\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Monta o conteúdo CSV (separador ;) com as colunas da matriz. */
function buildCsv(rows) {
  const header = EXPORT_COLUMNS.map(([label]) => csvCell(label)).join(";");
  const lines = rows.map((r) =>
    EXPORT_COLUMNS.map(([, key]) => csvCell(r[key])).join(";")
  );
  return [header, ...lines].join("\r\n");
}

/** Cor do badge de score (mesmos limiares da aba Unidades). */
function scoreBadge(score) {
  if (score >= 90)
    return "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/30";
  if (score >= 70)
    return "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/30";
  return "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/30";
}

/** Ícone de ordenação: ativo (Velot, direção) ou neutro (opaco). */
function SortIcon({ active, direction }) {
  if (!active) {
    return (
      <ChevronsUpDown
        size={13}
        className="text-slate-300 dark:text-slate-600"
        aria-hidden="true"
      />
    );
  }
  const Icon = direction === "asc" ? ChevronUp : ChevronDown;
  return <Icon size={13} className="text-velot" aria-hidden="true" />;
}

/**
 * Aba "Relatórios" — Relatório Gerencial Consolidado.
 *
 * @param {{ sdrCount: number, dealsCount: number, rows: Array<Object> }} props
 */
export default function RelatoriosTab({ sdrCount, dealsCount, rows }) {
  const [copied, setCopied] = useState(false);
  // Ordenação nativa via clique no cabeçalho (padrão: pior Score primeiro).
  const [sortField, setSortField] = useState("score");
  const [sortDirection, setSortDirection] = useState("asc");

  const conversion =
    sdrCount > 0 ? ((dealsCount / sdrCount) * 100).toFixed(1).replace(".", ",") : "0";

  // Ordena uma CÓPIA das linhas (string -> localeCompare, número -> diff).
  const sortedRows = useMemo(() => {
    const col = COLUMNS.find((c) => c.key === sortField);
    const dir = sortDirection === "asc" ? 1 : -1;
    const copy = [...rows];
    copy.sort((a, b) => {
      if (col?.type === "string") {
        return (
          dir *
          String(a[sortField] ?? "").localeCompare(
            String(b[sortField] ?? ""),
            "pt-BR",
            { sensitivity: "base" }
          )
        );
      }
      return dir * ((a[sortField] ?? 0) - (b[sortField] ?? 0));
    });
    return copy;
  }, [rows, sortField, sortDirection]);

  const activeCol = COLUMNS.find((c) => c.key === sortField);
  const dirText =
    activeCol?.type === "string"
      ? sortDirection === "asc"
        ? "A → Z"
        : "Z → A"
      : sortDirection === "asc"
      ? "Menor para Maior"
      : "Maior para Menor";

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildCsv(sortedRows));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  // Gera o download automático do CSV (UTF-8 com BOM p/ Excel ler acentos).
  const handleDownload = () => {
    if (sortedRows.length === 0) return;
    const content = String.fromCharCode(0xfeff) + buildCsv(sortedRows);
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-analitico-velot-${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
              Funil de cards abertos + higiene · ordenado por {activeCol?.label} (
              {dirText})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={rows.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {copied ? "✅ Copiado!" : "📋 Copiar matriz"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={rows.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#DC0032] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#b8002a] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={15} />
              Exportar Relatório Analítico
            </button>
          </div>
        </div>

        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className={`py-2 font-semibold cursor-pointer select-none transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${
                        col.align === "left" ? "pr-3 text-left" : "px-3 text-center"
                      }`}
                    >
                      <span
                        className={`inline-flex items-center gap-1 ${
                          col.align === "center" ? "justify-center" : ""
                        }`}
                      >
                        {col.label}
                        <SortIcon
                          active={sortField === col.key}
                          direction={sortDirection}
                        />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((r) => (
                  <tr
                    key={r.loja}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="py-2.5 pr-3 font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">
                      {r.loja}
                    </td>
                    <td className={`${numCell} font-semibold text-slate-900 dark:text-slate-50`}>
                      {r.totalLeads}
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
