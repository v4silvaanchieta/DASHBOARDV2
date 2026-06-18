"use client";

const fmtPct = (n) => `${(Number.isFinite(n) ? n : 0).toFixed(1).replace(".", ",")}%`;

/** Bloco de um estágio do funil de conversão. */
function Node({ label, value, valueClass = "text-slate-900 dark:text-slate-50" }) {
  return (
    <div className="flex-1 rounded-lg border border-slate-200 p-4 text-center dark:border-slate-800">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${valueClass}`}>
        {value.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}

/** Conector com a taxa de conversão entre dois estágios. */
function Step({ pct }) {
  return (
    <div className="flex shrink-0 items-center justify-center gap-1 sm:flex-col sm:gap-0.5">
      <span className="hidden text-lg text-slate-300 dark:text-slate-600 sm:inline">
        →
      </span>
      <span className="text-lg text-slate-300 dark:text-slate-600 sm:hidden">↓</span>
      <span className="rounded-full bg-velot/10 px-2 py-0.5 text-xs font-semibold text-velot">
        {pct}
      </span>
    </div>
  );
}

/**
 * Faixa de conversão da Visão Geral: Entrada SDR IA → Deals (CRM) → Vendas,
 * com os percentuais de conversão entre cada etapa.
 *
 * @param {{ sdr: number, deals: number, vendas: number }} props
 */
export default function ConversionStrip({ sdr, deals, vendas }) {
  const pDeals = sdr > 0 ? (deals / sdr) * 100 : 0; // SDR -> Deals
  const pVendas = deals > 0 ? (vendas / deals) * 100 : 0; // Deals -> Vendas
  const pGeral = sdr > 0 ? (vendas / sdr) * 100 : 0; // SDR -> Vendas (geral)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Conversão do Funil
          </h2>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            Entrada SDR IA → Deals no CRM → Vendas
          </p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Conversão geral (SDR → Venda):{" "}
          <span className="font-semibold text-velot">{fmtPct(pGeral)}</span>
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Node
          label="Entrada SDR IA"
          value={sdr}
          valueClass="text-indigo-600 dark:text-indigo-400"
        />
        <Step pct={fmtPct(pDeals)} />
        <Node label="Leads (Deals)" value={deals} />
        <Step pct={fmtPct(pVendas)} />
        <Node
          label="Vendas"
          value={vendas}
          valueClass="text-emerald-600 dark:text-emerald-400"
        />
      </div>
    </div>
  );
}
