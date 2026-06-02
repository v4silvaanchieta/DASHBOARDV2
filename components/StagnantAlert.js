"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";

/**
 * Alerta de alta visibilidade para leads estagnados na rede.
 * Dados derivados do filteredData (via tabela de Higiene), então acompanham os filtros.
 *
 * @param {{ total: number, topStore: string|null, topCount: number }} props
 */
export default function StagnantAlert({ total, topStore, topCount }) {
  const critical = total > 0;

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 ${
        critical ? "border-l-4" : ""
      }`}
      style={critical ? { borderLeftColor: "#DC0032" } : undefined}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Alerta de Leads Estagnados
          </p>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            Status aberto sem atualização há mais de 48h
          </p>
        </div>
        <span
          className={
            critical
              ? "text-velot"
              : "text-emerald-500 dark:text-emerald-400"
          }
          aria-hidden="true"
        >
          {critical ? <AlertTriangle size={26} /> : <CheckCircle2 size={26} />}
        </span>
      </div>

      <p
        className={`mt-4 text-4xl font-bold tracking-tight ${
          critical ? "text-velot" : "text-emerald-600 dark:text-emerald-400"
        }`}
      >
        {total.toLocaleString("pt-BR")}
      </p>

      {critical ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Atenção: <span className="font-semibold text-slate-900 dark:text-slate-50">{total}</span>{" "}
          {total === 1 ? "lead está estagnado" : "leads estão estagnados"} há mais de
          48h na rede.
          {topStore && (
            <>
              {" "}A unidade{" "}
              <span className="font-semibold text-velot">{topStore}</span> é a que
              possui o maior volume de pendências atualmente
              {topCount > 0 && (
                <span className="text-slate-500 dark:text-slate-400">
                  {" "}({topCount} {topCount === 1 ? "lead" : "leads"})
                </span>
              )}
              .
            </>
          )}
        </p>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Nenhum lead estagnado há mais de 48h na rede para o recorte atual. Operação em
          dia. 👏
        </p>
      )}
    </div>
  );
}
