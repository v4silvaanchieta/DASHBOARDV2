"use client";

import { useMemo, useState } from "react";
import { formatBRL } from "@/lib/metrics";

const brDate = (ymd) => {
  const m = String(ymd ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(ymd ?? "");
};
const int = (n) => Number(n || 0).toLocaleString("pt-BR");
const pct1 = (n) => `${(Number(n) || 0).toFixed(1).replace(".", ",")}%`;
/** R$ compacto: 10.936.737 -> "R$ 10,94 mi"; 452000 -> "R$ 452 mil". */
const money = (v) => {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 1e6) return `R$ ${(n / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mi`;
  if (Math.abs(n) >= 1e3) return `R$ ${Math.round(n / 1e3).toLocaleString("pt-BR")} mil`;
  return `R$ ${n.toLocaleString("pt-BR")}`;
};

const FILTERS = [
  { value: "todos", label: "Todas" },
  { value: "v4", label: "V4 (match)" },
  { value: "desconhecida", label: "Origem desconhecida" },
  { value: "ganho", label: "Já Ganho no CRM" },
  { value: "aconfirmar", label: "A confirmar (V4 aberto)" },
];

const EXPORT_COLS = [
  ["Data", (r) => brDate(r.data)],
  ["Loja", (r) => r.loja],
  ["Vendedor", (r) => r.vendedor],
  ["Modelo", (r) => r.modelo],
  ["Valor", (r) => String(r.valor).replace(".", ",")],
  ["Cliente (venda)", (r) => r.cliente],
  ["CRM Cliente", (r) => r.crmCliente],
  ["CPF (venda)", (r) => r.cpf],
  ["CRM CPF", (r) => r.crmCpf],
  ["Telefone (venda)", (r) => r.telefone],
  ["CRM Telefone", (r) => r.crmTelefone],
  ["Origem", (r) => r.origem],
  ["Critério", (r) => r.criterio],
  ["Status CRM", (r) => r.statusCrm],
  ["Confirmado", (r) => (r.confirmado ? "Sim" : "")],
];

/**
 * Aba RELATÓRIO DE VENDAS — comparativo automático Vendas × CRM (V4), filtrado
 * pela data global, com export e confirmação do ganho (data respeita o relatório).
 */
export default function RelatorioVendasTab({
  rows = [],
  stats = {},
  canConfirm = false,
  onToggleConfirm = () => {},
  periodLabel = "",
}) {
  const [f, setF] = useState("todos");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (f === "v4" && r.origem !== "V4") return false;
      if (f === "desconhecida" && r.origem !== "Desconhecida") return false;
      if (f === "ganho" && !r.won) return false;
      if (f === "aconfirmar" && !(r.origem === "V4" && !r.won)) return false;
      if (query && !`${r.cliente} ${r.crmCliente} ${r.loja}`.toLowerCase().includes(query))
        return false;
      return true;
    });
  }, [rows, f, q]);

  const toDelimited = (sep) =>
    [EXPORT_COLS.map((c) => c[0]).join(sep)]
      .concat(
        filtered.map((r) =>
          EXPORT_COLS.map((c) => {
            const v = String(c[1](r) ?? "");
            return sep === "," && /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
          }).join(sep)
        )
      )
      .join("\n");

  const exportCsv = () => {
    const blob = new Blob(["﻿" + toDelimited(",")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-vendas-crm-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const [copied, setCopied] = useState(false);
  const copyForSheets = async () => {
    try {
      await navigator.clipboard.writeText(toDelimited("\t"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const cell = "py-2 px-2 whitespace-nowrap";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      {/* Cabeçalho + resumo */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Relatório de Vendas · Comparativo com o CRM
          </h2>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            Cada venda cruzada com o CRM (CPF › telefone › nome exato){periodLabel ? ` · ${periodLabel}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyForSheets}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {copied ? "✓ Copiado" : "Copiar p/ Sheets"}
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-lg bg-velot px-3 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90"
          >
            ⭳ Exportar CSV
          </button>
        </div>
      </div>

      {/* ===== RESUMO (dashboard) ===== */}
      <ResumoVendas stats={stats} />

      {/* ===== LISTA / COMPARATIVO ===== */}
      <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Comparativo linha a linha
      </h3>

      {/* Filtros */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          value={f}
          onChange={(e) => setF(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-velot focus:outline-none focus:ring-1 focus:ring-velot dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:w-64"
        >
          {FILTERS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por cliente / loja..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-velot focus:outline-none focus:ring-1 focus:ring-velot dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:w-64"
        />
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {filtered.length.toLocaleString("pt-BR")} de {rows.length.toLocaleString("pt-BR")}
        </span>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className={cell}>Data</th>
              <th className={cell}>Loja</th>
              <th className={cell}>Modelo</th>
              <th className={`${cell} text-right`}>Valor</th>
              <th className={cell}>Cliente (venda)</th>
              <th className={`${cell} bg-slate-50 dark:bg-slate-800/40`}>CRM · Cliente</th>
              <th className={cell}>CPF venda</th>
              <th className={`${cell} bg-slate-50 dark:bg-slate-800/40`}>CRM · CPF</th>
              <th className={cell}>Origem</th>
              <th className={cell}>Status CRM</th>
              {canConfirm && <th className={`${cell} text-center`}>Confirmar</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.saleKey}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
              >
                <td className={`${cell} text-slate-600 dark:text-slate-400`}>{brDate(r.data)}</td>
                <td className={`${cell} text-slate-700 dark:text-slate-300`}>{r.loja}</td>
                <td className={`${cell} text-slate-500 dark:text-slate-400`}>{r.modelo || "—"}</td>
                <td className={`${cell} text-right tabular-nums text-slate-700 dark:text-slate-300`}>
                  {formatBRL(r.valor)}
                </td>
                <td className={`${cell} font-medium text-slate-800 dark:text-slate-100`}>{r.cliente || "—"}</td>
                <td className={`${cell} bg-slate-50 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300`}>
                  {r.crmCliente || "—"}
                </td>
                <td className={`${cell} tabular-nums text-slate-500 dark:text-slate-400`}>{r.cpf || "—"}</td>
                <td className={`${cell} bg-slate-50 tabular-nums text-slate-600 dark:bg-slate-800/40 dark:text-slate-300`}>
                  {r.crmCpf || "—"}
                </td>
                <td className={cell}>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      r.origem === "V4"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                    }`}
                  >
                    {r.origem}
                    {r.origem === "V4" && r.criterio ? ` · ${r.criterio}` : ""}
                  </span>
                </td>
                <td className={cell}>
                  <span
                    className={`text-xs font-medium ${
                      r.won
                        ? "text-emerald-600 dark:text-emerald-400"
                        : r.statusCrm === "Sem match"
                        ? "text-slate-400 dark:text-slate-500"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {r.statusCrm}
                  </span>
                </td>
                {canConfirm && (
                  <td className={`${cell} text-center`}>
                    {r.origem === "V4" ? (
                      <button
                        type="button"
                        onClick={() => onToggleConfirm(r.saleKey, r.dealKey, r.data)}
                        title="Confirmar que o ganho foi lançado no CRM. A data do ganho passa a respeitar o relatório."
                        className={`rounded-md border px-2 py-1 text-xs font-semibold transition-colors ${
                          r.confirmado
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        }`}
                      >
                        {r.confirmado ? "✓ Confirmado" : "Confirmar"}
                      </button>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={canConfirm ? 11 : 10} className="py-10 text-center text-slate-400 dark:text-slate-500">
                  Nenhuma venda no período/filtro atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Bloco de dashboard (KPIs, split de origem, quebra do match, ranking por loja). */
function ResumoVendas({ stats = {} }) {
  const total = stats.total || 0;
  const liqN = total - (stats.jaGanho || 0);
  const liqVal = (stats.valorTotal || 0) - (stats.valorJaGanho || 0);
  const pV4 = total ? (100 * (stats.v4 || 0)) / total : 0;
  const pDesc = total ? (100 * (stats.desconhecida || 0)) / total : 0;
  const byLoja = (stats.byLoja || []).filter((l) => l.valor > 0);
  const maxLoja = byLoja.length ? byLoja[0].valor : 1;
  const how = [
    { n: stats.byCriterio?.CPF || 0, l: "por CPF", d: "chave forte" },
    { n: stats.byCriterio?.Telefone || 0, l: "por telefone", d: "8 últimos díg." },
    { n: stats.byCriterio?.["Nome exato"] || 0, l: "nome exato", d: "nome completo" },
  ];

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Vendas no período" big={int(total)} sub={`${money(stats.valorTotal)} faturados`} hero />
        <Kpi label="Vendas líquidas (dedup CRM)" big={int(liqN)} sub={`${money(liqVal)} · −${int(stats.jaGanho)} já no CRM`} dot="#DC0032" />
        <Kpi label="Origem V4 (match no CRM)" big={int(stats.v4)} sub={`${money(stats.valorV4)} · ${pct1(pV4)} das vendas`} dot="#0F8A63" />
        <Kpi label="Origem desconhecida" big={int(stats.desconhecida)} sub={`${money(stats.valorDesconhecida)} · ${pct1(pDesc)} das vendas`} dot="#B26A00" />
      </div>

      {/* Split de origem + quebra do match */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Origem das vendas
        </p>
        <div className="mb-3 flex h-9 overflow-hidden rounded-lg">
          <div className="flex items-center bg-emerald-500 px-2 text-xs font-bold text-white" style={{ width: `${pV4}%` }}>
            {pV4 > 6 ? stats.v4 : ""}
          </div>
          <div className="flex items-center bg-amber-500 px-2 text-xs font-bold text-white" style={{ width: `${pDesc}%` }}>
            {stats.desconhecida} sem origem identificada
          </div>
        </div>
        <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> V4 · <b className="tabular-nums text-slate-700 dark:text-slate-200">{int(stats.v4)}</b> · {money(stats.valorV4)}
          </span>
          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> Desconhecida · <b className="tabular-nums text-slate-700 dark:text-slate-200">{int(stats.desconhecida)}</b> · {money(stats.valorDesconhecida)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-dashed border-slate-200 pt-3 dark:border-slate-700">
          {how.map((h) => (
            <div key={h.l} className="text-center">
              <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{int(h.n)}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{h.l}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">{h.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ranking por loja */}
      {byLoja.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Vendas por unidade
          </p>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {byLoja.map((l) => (
              <div key={l.loja} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-xs font-medium text-slate-700 dark:text-slate-200">{l.loja}</span>
                <div className="h-2 flex-1 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-2 rounded-full bg-velot/80" style={{ width: `${Math.max(3, (100 * l.valor) / maxLoja)}%` }} />
                </div>
                <span className="w-24 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">{money(l.valor)}</span>
                <span className="w-24 shrink-0 text-right text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                  {int(l.n)} · <span className="text-emerald-600 dark:text-emerald-400">{l.v4}</span>/<span className="text-amber-600 dark:text-amber-400">{l.desc}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">valor · nº vendas · V4/desconhecida</p>
        </div>
      )}
    </div>
  );
}

/** Card de KPI (número grande + subtítulo). */
function Kpi({ label, big, sub, hero, dot }) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${hero ? "border-slate-900 bg-slate-900 text-white dark:border-slate-700" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"}`}>
      <p className={`mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${hero ? "text-white/70" : "text-slate-500 dark:text-slate-400"}`}>
        {dot && <span className="h-2 w-2 rounded-full" style={{ background: dot }} />}
        {label}
      </p>
      <p className={`text-2xl font-extrabold tabular-nums ${hero ? "text-white" : "text-slate-800 dark:text-slate-100"}`}>{big}</p>
      <p className={`mt-1 text-xs ${hero ? "text-white/70" : "text-slate-500 dark:text-slate-400"}`}>{sub}</p>
    </div>
  );
}

function Stat({ label, value, tone }) {
  const color =
    tone === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "amber"
      ? "text-amber-600 dark:text-amber-400"
      : "text-slate-800 dark:text-slate-100";
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/40">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className={`text-lg font-bold tabular-nums ${color}`}>
        {Number(value || 0).toLocaleString("pt-BR")}
      </p>
    </div>
  );
}
