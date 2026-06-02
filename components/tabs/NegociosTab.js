"use client";

import { useMemo, useState } from "react";

const PAGE_SIZE = 15;

/** Extrai apenas dígitos para montar o link wa.me. */
function waLink(row) {
  if (row.linkWpp && String(row.linkWpp).trim() !== "") return String(row.linkWpp).trim();
  const digits = String(row.telefone || row.cfTelefone || "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

/**
 * Aba "Negócios" — tabela estilo Excel (scroll horizontal + paginação).
 * Colunas: Data Criação | Lead/Deal | Telefone (wa.me) | Estágio | Proprietário.
 *
 * @param {{ data: Array<Record<string, any>> }} props
 */
export default function NegociosTab({ data }) {
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);

  const pageRows = useMemo(
    () => data.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [data, safePage]
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Negócios (Deals)
          </h2>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            {data.length.toLocaleString("pt-BR")} deals · filtros globais aplicados
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="py-2 pr-4 font-semibold">Data Criação</th>
              <th className="py-2 pr-4 font-semibold">Lead / Deal</th>
              <th className="py-2 pr-4 font-semibold">Telefone</th>
              <th className="py-2 pr-4 font-semibold">Estágio Atual</th>
              <th className="py-2 font-semibold">Proprietário</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => {
              const link = waLink(row);
              const phone = String(row.telefone || row.cfTelefone || "").trim();
              return (
                <tr
                  key={`${row.dealId || "row"}-${i}`}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="py-2.5 pr-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                    {row.dataCriacao || "—"}
                  </td>
                  <td className="py-2.5 pr-4 font-medium text-slate-800 dark:text-slate-100">
                    {row.nomeDeal || row.nomeContato || "—"}
                  </td>
                  <td className="py-2.5 pr-4 whitespace-nowrap">
                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                      >
                        💬 {phone || "WhatsApp"}
                      </a>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">
                    {row.estagio || "—"}
                  </td>
                  <td className="py-2.5 text-slate-600 dark:text-slate-400">
                    {row.proprietario || "—"}
                  </td>
                </tr>
              );
            })}
            {pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center text-slate-400 dark:text-slate-500"
                >
                  Nenhum deal para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Página {safePage + 1} de {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
