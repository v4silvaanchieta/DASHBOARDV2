"use client";

/** Rótulos das regras de punição do Score. */
const PENALTY_FIELDS = [
  ["estagnado", "Leads Estagnados (>48h)"],
  ["tiBh", "Retidos em 'TI BH'"],
  ["ganhoZerado", "Ganhos sem Valor"],
  ["perdaSemMotivo", "Perdas sem Motivo"],
  ["semDocumento", "Falta de CPF/E-mail"],
];

/**
 * Aba "Configurações" — meta de SLA e pontos de punição do Score Comercial.
 * Atualiza o estado global do dashboard (recalcula SLA e Higiene em tempo real).
 *
 * @param {{
 *   settings: { slaTargetMinutes: number, penalties: Record<string, number> },
 *   onChange: (next: { slaTargetMinutes: number, penalties: Record<string, number> }) => void,
 * }} props
 */
export default function ConfiguracoesTab({ settings, onChange }) {
  const setSla = (value) =>
    onChange({ ...settings, slaTargetMinutes: Math.max(0, Number(value) || 0) });

  const setPenalty = (key, value) =>
    onChange({
      ...settings,
      penalties: {
        ...settings.penalties,
        [key]: Math.max(0, Number(value) || 0),
      },
    });

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-velot focus:outline-none focus:ring-1 focus:ring-velot dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Meta de SLA */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Gestão de SLA
        </h2>
        <p className="mb-4 mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          Tempo máximo de primeiro atendimento (Speed to Lead)
        </p>
        <label className="block">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Meta de SLA (minutos)
          </span>
          <input
            type="number"
            min={0}
            value={settings.slaTargetMinutes}
            onChange={(e) => setSla(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
          <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500">
            Padrão: 5 minutos
          </span>
        </label>
      </div>

      {/* Pontos de punição do Score */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Score Comercial · Punições
        </h2>
        <p className="mb-4 mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          Pontos deduzidos por ocorrência (loja inicia com 100)
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PENALTY_FIELDS.map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {label}
              </span>
              <input
                type="number"
                min={0}
                value={settings.penalties[key]}
                onChange={(e) => setPenalty(key, e.target.value)}
                className={`mt-1 ${inputClass}`}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
