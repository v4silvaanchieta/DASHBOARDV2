"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/** Rótulo + subtítulo por tipo de alerta. */
const META = {
  stagnant: {
    label: "Alerta de Leads Estagnados",
    subtitle: "Status aberto sem atualização há mais de 48h",
  },
  ganhoZerado: {
    label: "Ganhos sem Valor",
    subtitle: "STATUS ganho com QUANTIA zerada",
  },
  perdaSemMotivo: {
    label: "Perdas sem Motivo",
    subtitle: "STATUS perdido sem MOTIVO DE PERDA",
  },
  scoreCritico: {
    label: "Unidades com Score Crítico",
    subtitle: "Score geral abaixo de 70 pontos",
  },
};

const ROTATE_MS = 6000;

/** Texto de apoio (com a loja destacada em Velot) por tipo de slide. */
function SupportText({ slide }) {
  const { kind, value, topStore, topCount } = slide;
  const store = topStore ? (
    <span className="font-semibold text-velot">{topStore}</span>
  ) : null;
  const bold = (
    <span className="font-semibold text-slate-900 dark:text-slate-50">{value}</span>
  );

  if (value <= 0) {
    const ok = {
      stagnant: "Nenhum lead estagnado há mais de 48h na rede. Operação em dia. 👏",
      ganhoZerado: "Nenhuma venda Ganho sem valor. Catálogo em ordem. 👏",
      perdaSemMotivo: "Nenhuma perda sem motivo registrada. Justificativas em dia. 👏",
      scoreCritico: "Nenhuma unidade abaixo da meta de qualidade. Rede saudável. 👏",
    };
    return <>{ok[kind]}</>;
  }

  switch (kind) {
    case "ganhoZerado":
      return (
        <>
          Atenção: {bold} vendas foram finalizadas como Ganho sem o valor do produto no
          sistema.{" "}
          {store && (
            <>
              A unidade {store} é a que mais cometeu esse erro de catálogo atualmente (
              {topCount} negócios).
            </>
          )}
        </>
      );
    case "perdaSemMotivo":
      return (
        <>
          Atenção: {bold} leads foram descartados como Perdido sem a justificativa de
          perda.{" "}
          {store && (
            <>
              A unidade {store} é a que possui o maior volume de omissões atualmente (
              {topCount} perdas).
            </>
          )}
        </>
      );
    case "scoreCritico":
      return (
        <>
          Atenção: {bold} unidades estão operando abaixo da meta de qualidade estabelecida
          pelo comitê.{" "}
          {store && (
            <>
              A unidade {store} é a que apresenta o menor score de qualidade da rede
              atualmente ({topCount} pontos).
            </>
          )}
        </>
      );
    case "stagnant":
    default:
      return (
        <>
          Atenção: {bold} {value === 1 ? "lead está estagnado" : "leads estão estagnados"}{" "}
          há mais de 48h na rede.{" "}
          {store && (
            <>
              A unidade {store} é a que possui o maior volume de pendências atualmente (
              {topCount} leads).
            </>
          )}
        </>
      );
  }
}

/**
 * Carrossel de Alertas Operacionais (Packs de Atenção) — 4 slides.
 * Mantém o shell visual do alerta original; apenas o conteúdo interno rotaciona.
 *
 * @param {{ slides: Array<{ kind: string, value: number, topStore: string|null, topCount: number }> }} props
 */
export default function StagnantAlert({ slides = [] }) {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(id);
  }, [count]);

  // Rede 100% eficiente: nenhum alerta com pendência -> card de sucesso.
  if (count === 0) {
    return (
      <div
        className="rounded-xl border border-l-4 border-emerald-200 bg-emerald-50 p-6 shadow-sm transition-colors dark:border-emerald-800 dark:bg-emerald-950/20"
        style={{ borderLeftColor: "#10b981" }}
      >
        <div className="flex items-start gap-4">
          <span className="text-emerald-500 dark:text-emerald-400" aria-hidden="true">
            <CheckCircle2 size={26} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Operação em Dia
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              Todas as unidades franqueadas estão cumprindo rigorosamente as diretrizes de
              higiene e prazos do CRM Velot.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const safe = ((index % count) + count) % count;
  const slide = slides[safe];
  const meta = META[slide.kind] ?? META.stagnant;
  const critical = slide.value > 0;
  const go = (n) => setIndex((i) => (((i + n) % count) + count) % count);

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 ${
        critical ? "border-l-4" : ""
      }`}
      style={critical ? { borderLeftColor: "#DC0032" } : undefined}
    >
      {/* Conteúdo do slide (com fade na troca) */}
      <div key={safe} className="alert-fade">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {meta.label}
            </p>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              {meta.subtitle}
            </p>
          </div>
          <span
            className={critical ? "text-velot" : "text-emerald-500 dark:text-emerald-400"}
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
          {slide.value.toLocaleString("pt-BR")}
        </p>

        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <SupportText slide={slide} />
        </p>
      </div>

      {/* Controles do carrossel: dots + setas minimalistas */}
      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para o alerta ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === safe
                  ? "w-5 bg-velot"
                  : "w-1.5 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Alerta anterior"
            onClick={() => go(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Próximo alerta"
            onClick={() => go(1)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
