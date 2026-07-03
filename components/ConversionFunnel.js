"use client";

/** Estreitamento (%) por etapa — dá o formato de funil (trapézios encaixados). */
const STEP = 9;

/**
 * Funil comercial vertical — trapézios encaixados (clip-path) num gradiente
 * roxo → azul → teal → verde, com números absolutos por etapa e um selo de
 * conversão entre elas (rótulo próprio por transição: Captura/Qualif/Fecham).
 *
 * O taper é decorativo (uniforme); os NÚMEROS carregam o dado real. Para
 * unidade, as etapas do meio podem ficar iguais/parecidas — o esperado.
 *
 * @param {{
 *   stages: Array<{
 *     label: string, value: number, color: string, captureLabel?: string,
 *   }>,
 * }} props
 */
export default function ConversionFunnel({ stages }) {
  const fmt = (n) => Number(n || 0).toLocaleString("pt-BR");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Funil Comercial
      </h3>

      <div>
        {stages.map((s, i) => {
          const topInset = i * STEP;
          const bottomInset = (i + 1) * STEP;
          const clip = `polygon(${topInset}% 0, ${100 - topInset}% 0, ${
            100 - bottomInset
          }% 100%, ${bottomInset}% 100%)`;
          const next = stages[i + 1];
          const capture =
            next && s.value > 0 ? (next.value / s.value) * 100 : null;

          return (
            <div key={s.label}>
              <div
                className="flex min-h-[72px] items-center justify-center px-8 text-center"
                style={{ clipPath: clip, background: s.color }}
              >
                <div className="leading-tight">
                  <p className="text-xl font-extrabold text-slate-800">
                    {fmt(s.value)}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    {s.label}
                  </p>
                </div>
              </div>

              {capture != null && (
                <div className="relative z-10 -my-2.5 flex justify-center">
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {s.captureLabel ?? "Captura"}:{" "}
                    {capture.toFixed(1).replace(".", ",")}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
