"use client";

import { useMemo, useState } from "react";
import {
  DATE_RANGE_OPTIONS,
  DATE_RANGE_DEFAULT,
  isWithinRange,
  parseDate,
} from "@/lib/filters";

/** Colunas exportadas (rótulo -> chave do objeto). */
const EXPORT_COLUMNS = [
  ["Data Criação", "dataCriacao"],
  ["Data Atualização", "dataAtualizacao"],
  ["Pipeline", "pipeline"],
  ["Estágio", "estagio"],
  ["Deal ID", "dealId"],
  ["Nome Deal", "nomeDeal"],
  ["Status", "status"],
  ["Motivo Perda", "motivoPerda"],
  ["Quantia", "quantia"],
  ["Proprietário", "proprietario"],
  ["Telefone", "telefone"],
  ["Cidade", "cidade"],
  ["UTM Source", "utmSource"],
  ["UTM Campaign", "utmCampaign"],
];

/** Escapa um valor para CSV (separador ;), conciliável com Excel/Apolo. */
function csvCell(value) {
  const s = String(value ?? "");
  if (/[";\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Aba "Relatórios" — seleção por período + cópia dos dados para o clipboard
 * (formato CSV pronto para colar no Excel / Intranet Apolo).
 *
 * @param {{ data: Array<Record<string, any>> }} props
 */
export default function RelatoriosTab({ data }) {
  const [range, setRange] = useState(DATE_RANGE_DEFAULT);
  const [copied, setCopied] = useState(false);

  const rows = useMemo(
    () =>
      data.filter((r) =>
        range === "all" ? true : isWithinRange(parseDate(r.dataCriacao), range)
      ),
    [data, range]
  );

  const buildCsv = () => {
    const header = EXPORT_COLUMNS.map(([label]) => csvCell(label)).join(";");
    const lines = rows.map((r) =>
      EXPORT_COLUMNS.map(([, key]) => csvCell(r[key])).join(";")
    );
    return [header, ...lines].join("\n");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildCsv());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Relatórios · Exportação
      </h2>
      <p className="mb-4 mt-0.5 text-xs text-slate-400">
        Selecione o período e copie os dados (CSV) para conciliar com a Intranet Apolo
      </p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1.5 sm:w-64">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Período (Data de Criação)
          </span>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-velot focus:outline-none focus:ring-1 focus:ring-velot"
          >
            {DATE_RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={handleCopy}
          disabled={rows.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copied ? "✅ Copiado!" : "📋 Copiar Dados (Clipboard)"}
        </button>
      </div>

      <p className="mt-4 text-sm text-slate-600">
        <span className="font-semibold text-slate-900">
          {rows.length.toLocaleString("pt-BR")}
        </span>{" "}
        registros prontos para exportação ·{" "}
        {EXPORT_COLUMNS.length} colunas (separador <code>;</code>).
      </p>
    </div>
  );
}
