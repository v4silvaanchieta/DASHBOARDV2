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

const LOGO_LIGHT =
  "https://github.com/v4silvaanchieta/DASHBOARDV2/blob/main/velot-cor-2.png?raw=true";
const LOGO_DARK =
  "https://github.com/v4silvaanchieta/DASHBOARDV2/blob/main/velot-cor-1.png?raw=true";

export default function Sidebar({ activeTab, onSelect, theme = "light" }) {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-slate-950 text-slate-300 md:border-r md:border-slate-800/80">
      {/* Logo / Marca (alterna conforme o tema) */}
      <div className="flex items-center h-16 px-6 border-b border-slate-800/80">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={theme === "dark" ? LOGO_DARK : LOGO_LIGHT}
          alt="Velot"
          className="h-8 w-auto object-contain"
        />
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
                      ? "bg-velot text-white shadow-sm shadow-velot/30"
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
