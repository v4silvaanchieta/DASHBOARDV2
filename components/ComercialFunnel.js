"use client";

/** Estreitamento (%) por etapa — dá o formato de funil (trapézios encaixados). */
const STEP = 9;

const fmt = (n) => Number(n || 0).toLocaleString("pt-BR");
const pct = (v) => `${(Number(v || 0) * 100).toFixed(1).replace(".", ",")}%`;

/**
 * FUNIL COMERCIAL (responsabilidade da LOJA) — separado do funil de Marketing.
 * Etapas: Consultas → CPF Elegíveis → Propostas → Vendas. Entre elas, a taxa de
 * conversão com a META (melhor loja): verde se ≥ meta, vermelho se abaixo — é
 * onde se enxerga se o gargalo está no comercial.
 *
 * @param {{
 *   funnel: { consultas, elegiveis, propostas, vendas, pElegiveis, pPropostas, pVendas, fechamento },
 *   metas: { pElegiveis, pPropostas, pVendas, fechamento },
 *   scopeName?: string,
 * }} props
 */
export default function ComercialFunnel({ funnel, metas = {}, scopeName }) {
  const f = funnel || { consultas: 0, elegiveis: 0, propostas: 0, vendas: 0 };

  const stages = [
    { label: "Consultas Totais", value: f.consultas, color: "#fde68a" },
    { label: "CPF Elegíveis", value: f.elegiveis, color: "#fcd34d", rate: f.pElegiveis, meta: metas.pElegiveis, cap: "Elegíveis" },
    { label: "Propostas Enviadas", value: f.propostas, color: "#fbbf24", rate: f.pPropostas, meta: metas.pPropostas, cap: "Propostas" },
    { label: "Vendas (CDCI)", value: f.vendas, color: "#f59e0b", rate: f.pVendas, meta: metas.pVendas, cap: "Fechadas" },
  ];

  return (
    <div className="rounded-xl border border-amber-200/70 bg-white p-5 shadow-sm transition-colors dark:border-amber-500/20 dark:bg-slate-900">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          Funil Comercial <span className="text-slate-400 dark:text-slate-500">· Loja</span>
        </h3>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Fechamento {pct(f.fechamento)}
        </span>
      </div>
      <p className="mb-4 text-[11px] text-slate-400 dark:text-slate-500">
        Consultas de CPF de TODAS as origens (banco + à vista + CDCI){scopeName ? ` · ${scopeName}` : ""}
      </p>

      <div>
        {stages.map((s, i) => {
          const topInset = i * STEP;
          const bottomInset = (i + 1) * STEP;
          const clip = `polygon(${topInset}% 0, ${100 - topInset}% 0, ${
            100 - bottomInset
          }% 100%, ${bottomInset}% 100%)`;
          return (
            <div key={s.label}>
              {/* selo de conversão + meta ANTES da etapa (entre a anterior e esta) */}
              {s.rate != null && (
                <div className="relative z-10 -my-2.5 flex justify-center">
                  <MetaChip cap={s.cap} rate={s.rate} meta={s.meta} />
                </div>
              )}
              <div
                className="flex min-h-[68px] items-center justify-center px-8 text-center"
                style={{ clipPath: clip, background: s.color }}
              >
                <div className="leading-tight">
                  <p className="text-xl font-extrabold text-slate-900">{fmt(s.value)}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-700">
                    {s.label}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Selo de taxa de conversão com meta: verde se ≥ meta, vermelho se abaixo. */
function MetaChip({ cap, rate, meta }) {
  const hasMeta = Number(meta) > 0;
  const ok = hasMeta ? rate >= meta - 1e-9 : true;
  const tone = !hasMeta
    ? "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
    : ok
    ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-400"
    : "border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400";
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm ${tone}`}
    >
      {cap}: {pct(rate)}
      {hasMeta && (
        <span className="ml-1 font-semibold opacity-70">· meta {pct(meta)}</span>
      )}
    </span>
  );
}
