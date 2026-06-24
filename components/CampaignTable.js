"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";

/**
 * Converte um valor de célula para algo comparável, detectando o tipo:
 *  - número puro -> usa direto;
 *  - moeda/porcentagem/número em texto (ex.: "R$ 1.234,56", "12,34%") -> limpa
 *    R$, %, espaços, separador de milhar (ponto) e decimal (vírgula) e converte;
 *  - demais strings -> minúsculas (ordem alfabética via localeCompare).
 *
 * @param {any} value
 * @returns {number|string}
 */
function getComparable(value) {
  if (typeof value === "number") return value;
  const str = String(value ?? "").trim();
  const numeric = str
    .replace(/[R$\s%]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  if (numeric !== "" && /^-?\d+(\.\d+)?$/.test(numeric)) return Number(numeric);
  return str.toLowerCase();
}

/** Cabeçalho: ícone de ordenação ativo (Velot, direção) ou neutro (opaco). */
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
 * Tabela analítica paginada e ORDENÁVEL — segue o padrão da Matriz Analítica:
 * cabeçalho destacado e clicável (asc/desc), linhas com hover sutil, formatação
 * por coluna e paginação client-side. Ordenação 100% local (sem refetch).
 *
 * @param {{
 *   columns: Array<{
 *     key: string,
 *     label: string,
 *     align?: "left" | "right",
 *     strong?: boolean,
 *     render: (row: Record<string, any>) => React.ReactNode,
 *   }>,
 *   rows: Array<Record<string, any>>,
 *   pageSize?: number,
 *   emptyLabel?: string,
 *   defaultSort?: { key: string, direction: "asc" | "desc" },
 * }} props
 */
export default function CampaignTable({
  columns,
  rows,
  pageSize = 10,
  emptyLabel = "Sem dados para os filtros selecionados.",
  defaultSort = { key: "conversations", direction: "desc" },
}) {
  const [sortConfig, setSortConfig] = useState(defaultSort);
  const [page, setPage] = useState(0);

  // Ordenação local: ordena uma CÓPIA (string -> localeCompare, número -> diff).
  const sortedRows = useMemo(() => {
    const { key, direction } = sortConfig;
    if (!key) return rows;
    const dir = direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = getComparable(a[key]);
      const bv = getComparable(b[key]);
      if (typeof av === "number" && typeof bv === "number") {
        return dir * (av - bv);
      }
      return (
        dir *
        String(av).localeCompare(String(bv), "pt-BR", { sensitivity: "base" })
      );
    });
  }, [rows, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const current = Math.min(page, totalPages - 1); // clamp se os filtros reduzirem
  const start = current * pageSize;
  const pageRows = useMemo(
    () => sortedRows.slice(start, start + pageSize),
    [sortedRows, start, pageSize]
  );

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "desc" }
    );
    setPage(0); // volta ao topo ao reordenar
  };

  if (rows.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-center text-sm text-slate-400 dark:text-slate-500">
        {emptyLabel}
      </div>
    );
  }

  const minWidth = columns.length > 5 ? "min-w-[820px]" : "min-w-[640px]";

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className={`w-full ${minWidth} text-left text-sm`}>
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  aria-sort={
                    sortConfig.key === col.key
                      ? sortConfig.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className={`cursor-pointer select-none py-2 font-semibold transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    col.align === "right" ? "px-3 text-right" : "pr-3 text-left"
                  }`}
                >
                  <span
                    className={`inline-flex items-center gap-1 ${
                      col.align === "right" ? "justify-end" : ""
                    }`}
                  >
                    {col.label}
                    <SortIcon
                      active={sortConfig.key === col.key}
                      direction={sortConfig.direction}
                    />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr
                key={start + i}
                className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={[
                      "py-2.5",
                      col.align === "right"
                        ? "px-3 text-right tabular-nums"
                        : "pr-3 text-left",
                      col.strong
                        ? "font-semibold text-slate-900 dark:text-slate-50"
                        : "text-slate-700 dark:text-slate-300",
                    ].join(" ")}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            {(start + 1).toLocaleString("pt-BR")}–
            {Math.min(start + pageSize, sortedRows.length).toLocaleString("pt-BR")}{" "}
            de {sortedRows.length.toLocaleString("pt-BR")}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(current - 1)}
              disabled={current === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={14} /> Anterior
            </button>
            <span className="tabular-nums">
              {current + 1}/{totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(current + 1)}
              disabled={current >= totalPages - 1}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Próxima <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
