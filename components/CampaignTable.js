"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Tabela analítica paginada — segue o padrão da Matriz Analítica do projeto:
 * cabeçalho destacado, linhas com hover sutil, alinhamento/formatação por coluna
 * e paginação client-side quando há muitas linhas.
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
 * }} props
 */
export default function CampaignTable({
  columns,
  rows,
  pageSize = 10,
  emptyLabel = "Sem dados para os filtros selecionados.",
}) {
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, totalPages - 1); // clamp se os filtros reduzirem
  const start = current * pageSize;
  const pageRows = useMemo(
    () => rows.slice(start, start + pageSize),
    [rows, start, pageSize]
  );

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
                  className={`py-2 font-semibold ${
                    col.align === "right" ? "px-3 text-right" : "pr-3 text-left"
                  }`}
                >
                  {col.label}
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
            {Math.min(start + pageSize, rows.length).toLocaleString("pt-BR")} de{" "}
            {rows.length.toLocaleString("pt-BR")}
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
