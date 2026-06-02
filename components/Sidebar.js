"use client";

/**
 * Sidebar lateral fixa com navegação por estado (React Tabs).
 * Controlada pelo componente principal via `activeTab` / `onSelect`.
 *
 * @param {{ activeTab: string, onSelect: (id: string) => void }} props
 */

export const MENU_ITEMS = [
  { id: "visao-geral", label: "Visão Geral", icon: "📊" },
  { id: "negocios", label: "Negócios", icon: "💼" },
  { id: "pipeline", label: "Pipeline", icon: "🔀" },
  { id: "produtos", label: "Produtos", icon: "📦" },
  { id: "campanhas", label: "Campanhas", icon: "📣" },
  { id: "relatorios", label: "Relatórios", icon: "📈" },
  { id: "configuracoes", label: "Configurações", icon: "⚙️" },
];

export default function Sidebar({ activeTab, onSelect }) {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-slate-950 text-slate-300">
      {/* Logo / Marca */}
      <div className="flex items-center gap-3 h-16 px-6 border-b border-slate-800/80">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-950 font-bold">
          V
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">
          Velot
        </span>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {MENU_ITEMS.map((item) => {
            const active = item.id === activeTab;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    active
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white",
                  ].join(" ")}
                >
                  <span className="text-base" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Rodapé da sidebar */}
      <div className="border-t border-slate-800/80 px-6 py-4 text-xs text-slate-500">
        © {new Date().getFullYear()} Velot
      </div>
    </aside>
  );
}
