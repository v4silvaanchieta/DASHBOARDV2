"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import ConfiguracoesTab from "@/components/tabs/ConfiguracoesTab";
import PerfilTab from "@/components/tabs/PerfilTab";
import GerenciarAcessos from "@/components/tabs/GerenciarAcessos";

/** Sub-abas internas do painel de configurações do admin. */
const SETTINGS_TABS = [
  { id: "configuracoes", label: "Configurações" },
  { id: "perfil", label: "Meu Perfil" },
  { id: "acessos", label: "Gerenciar Acessos" },
];

/**
 * Área de configurações do Admin — reúne, num só lugar, as antigas abas de
 * Configurações, Meu Perfil e Gerenciar Acessos (sub-abas internas). Acessada
 * pela engrenagem do topo; traz botão de voltar ao Painel.
 *
 * @param {{
 *   settings: Object,
 *   onChange: (next: Object) => void,
 *   pipelines: string[],
 *   onBack: () => void,
 * }} props
 */
export default function AdminSettings({ settings, onChange, pipelines, onBack }) {
  const [view, setView] = useState("configuracoes");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-velot hover:text-velot dark:border-slate-700 dark:text-slate-300"
        >
          <ArrowLeft size={16} /> Voltar ao Painel
        </button>

        {/* Sub-abas (segmented control) */}
        <div className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-800/60">
          {SETTINGS_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setView(t.id)}
              aria-pressed={view === t.id}
              className={[
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                view === t.id
                  ? "bg-velot text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {view === "configuracoes" && (
        <ConfiguracoesTab settings={settings} onChange={onChange} />
      )}
      {view === "perfil" && <PerfilTab />}
      {view === "acessos" && <GerenciarAcessos pipelines={pipelines} />}
    </div>
  );
}
