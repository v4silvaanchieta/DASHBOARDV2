"use client";

import { useState } from "react";

const int = (n) => Number(n || 0).toLocaleString("pt-BR");
const pct = (v) => `${(Number(v || 0) * 100).toFixed(1).replace(".", ",")}%`;

const COLS = [
  { key: "consultas", label: "Consultas" },
  { key: "elegiveis", label: "Elegíveis" },
  { key: "propostas", label: "Propostas" },
  { key: "vendas", label: "Vendas" },
  { key: "pElegiveis", label: "% Eleg.", rate: true },
  { key: "pPropostas", label: "% Prop.", rate: true },
  { key: "fechamento", label: "Fechamento", rate: true },
];

/**
 * RANKING COMERCIAL — lojas comparadas nas etapas do funil comercial. Permite
 * ver, ao lado de todas as lojas, quem está quebrando (ex.: muitos elegíveis e
 * poucas propostas). Fechamento colorido vs META (melhor loja).
 *
 * @param {{ stores: Array, metas: object }} props
 */
export default function RankingComercial({ stores = [], metas = {} }) {
  const [sortKey, setSortKey] = useState("fechamento");

  const rows = [...stores].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));
  const total = stores.reduce(
    (a, s) => ({
      consultas: a.consultas + s.consultas,
      elegiveis: a.elegiveis + s.elegiveis,
      propostas: a.propostas + s.propostas,
      vendas: a.vendas + s.vendas,
    }),
    { consultas: 0, elegiveis: 0, propostas: 0, vendas: 0 }
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          Ranking Comercial <span className="text-slate-400 dark:text-slate-500">· por loja</span>
        </h2>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          meta = melhor loja
        </span>
      </div>
      <p className="mb-3 text-[11px] text-slate-400 dark:text-slate-500">
        Onde o comercial quebra: muitos elegíveis e poucas propostas = gargalo na loja.
      </p>

      {rows.length === 0 ? (
        <div className="flex h-24 items-center justify-center text-center text-sm text-slate-400 dark:text-slate-500">
          Sem dados do funil diário no período/loja selecionados.
        </div>
      ) : (
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="sticky top-0 bg-white dark:bg-slate-900">
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2 pr-3 font-semibold">Loja</th>
                {COLS.map((c) => (
                  <th
                    key={c.key}
                    onClick={() => setSortKey(c.key)}
                    className={`cursor-pointer select-none py-2 px-2 text-right font-semibold hover:text-velot ${
                      sortKey === c.key ? "text-velot" : ""
                    }`}
                  >
                    {c.label}
                    {sortKey === c.key ? " ↓" : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr
                  key={s.loja}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="py-2 pr-3 font-medium text-slate-800 dark:text-slate-100">
                    {s.loja}
                  </td>
                  {COLS.map((c) => {
                    const v = s[c.key] || 0;
                    let cls = "text-slate-600 dark:text-slate-300";
                    if (c.key === "fechamento" && metas.fechamento > 0) {
                      cls =
                        v >= metas.fechamento - 1e-9
                          ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                          : "text-red-500 dark:text-red-400 font-semibold";
                    }
                    return (
                      <td key={c.key} className={`py-2 px-2 text-right tabular-nums ${cls}`}>
                        {c.rate ? pct(v) : int(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 text-[13px] font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                <td className="py-2 pr-3">Rede</td>
                <td className="py-2 px-2 text-right tabular-nums">{int(total.consultas)}</td>
                <td className="py-2 px-2 text-right tabular-nums">{int(total.elegiveis)}</td>
                <td className="py-2 px-2 text-right tabular-nums">{int(total.propostas)}</td>
                <td className="py-2 px-2 text-right tabular-nums">{int(total.vendas)}</td>
                <td className="py-2 px-2 text-right tabular-nums">
                  {pct(total.consultas ? total.elegiveis / total.consultas : 0)}
                </td>
                <td className="py-2 px-2 text-right tabular-nums">
                  {pct(total.elegiveis ? total.propostas / total.elegiveis : 0)}
                </td>
                <td className="py-2 px-2 text-right tabular-nums">
                  {pct(total.consultas ? total.vendas / total.consultas : 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
