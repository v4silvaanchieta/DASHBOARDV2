"use client";

import { useMemo, useState } from "react";
import { formatBRL } from "@/lib/metrics";

const PAGE_SIZE = 15;

/** Extrai apenas dígitos para montar o link wa.me. */
function waLink(row) {
  if (row.linkWpp && String(row.linkWpp).trim() !== "") return String(row.linkWpp).trim();
  const digits = String(row.telefone || row.cfTelefone || "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

/** Opções do filtro de Estágio (funil ponta a ponta). */
const STAGE_FILTERS = [
  { value: "todos", label: "Todos os Estágios" },
  { value: "sdr_only", label: "Apenas no SDR IA" },
  { value: "pre_qualificacao", label: "PRÉ-QUALIFICAÇÃO (SDR / IA)" },
  { value: "novos_leads", label: "NOVOS LEADS / EM ATENDIMENTO" },
  { value: "triagem", label: "TRIAGEM" },
  { value: "analise", label: "ANÁLISE / CRÉDITO" },
  { value: "faturamento", label: "FATURAMENTO" },
  { value: "ganho", label: "GANHO" },
  { value: "perdido", label: "PERDIDO" },
];

/** Normaliza removendo acentos + lowercase. */
function normTxt(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/** true se a linha corresponde ao estágio selecionado. */
function matchesStage(row, value) {
  if (value === "todos") return true;
  const est = normTxt(row.estagio);
  const status = normTxt(row.status);
  switch (value) {
    case "sdr_only":
      return row.sdrOnly === true;
    case "pre_qualificacao":
      return !row.sdrOnly && (est.includes("pre-qualificacao") || est.includes("prospeccao"));
    case "novos_leads":
      return est.includes("novos leads") || est.includes("em atendimento");
    case "triagem":
      return est.includes("triagem");
    case "analise":
      return est.includes("analise") || est.includes("credito");
    case "faturamento":
      return est.includes("faturamento") || est.includes("integracao fiscal");
    case "ganho":
      return status === "ganho";
    case "perdido":
      return status === "perdido";
    default:
      return true;
  }
}

/**
 * Aba "Negócios" — lista unificada (CRM + leads exclusivos do SDR IA).
 * Colunas: Data | Lead/Deal | Telefone (wa.me) | Estágio | Proprietário | Valor.
 *
 * @param {{ data: Array<Record<string, any>> }} props
 */
export default function NegociosTab({ data }) {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("todos");

  // Filtro combinado: estágio + busca por nome (Lead/Deal ou contato).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((r) => {
      if (!matchesStage(r, stageFilter)) return false;
      if (
        q &&
        !`${r.nomeDeal || ""} ${r.nomeContato || ""}`.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [data, query, stageFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = useMemo(
    () => filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [filtered, safePage]
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Negócios · Contatos Unificados
          </h2>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            {filtered.length.toLocaleString("pt-BR")} contatos (CRM + SDR IA) · período
            filtrado
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value);
              setPage(0);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-velot focus:outline-none focus:ring-1 focus:ring-velot dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:w-60"
          >
            {STAGE_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Buscar por nome..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-velot focus:outline-none focus:ring-1 focus:ring-velot dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="py-2 pr-4 font-semibold">Data</th>
              <th className="py-2 pr-4 font-semibold">Lead / Deal</th>
              <th className="py-2 pr-4 font-semibold">Telefone</th>
              <th className="py-2 pr-4 font-semibold">Estágio Atual</th>
              <th className="py-2 pr-4 font-semibold">Proprietário</th>
              <th className="py-2 text-right font-semibold">Valor</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => {
              const link = waLink(row);
              const phone = String(row.telefone || row.cfTelefone || "").trim();
              return (
                <tr
                  key={`${row.dealId || row.telefone || "row"}-${i}`}
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
                  <td className="py-2.5 pr-4">
                    {row.sdrOnly ? (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {row.estagio}
                      </span>
                    ) : (
                      <span className="text-slate-600 dark:text-slate-400">
                        {row.estagio || "—"}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">
                    {row.proprietario || "—"}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                    {formatBRL(Number(row.quantia) || 0)}
                  </td>
                </tr>
              );
            })}
            {pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-slate-400 dark:text-slate-500"
                >
                  Nenhum contato para os filtros/busca atuais.
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
