"use client";

/**
 * Sidebar lateral fixa com a identidade da Velot e links de menu.
 * Os links são "fakes" por enquanto (etapa 1) — serão ligados às rotas nas próximas etapas.
 */

const MENU_ITEMS = [
  { label: "Visão Geral", icon: "📊", href: "#", active: true },
  { label: "Negócios", icon: "💼", href: "#" },
  { label: "Pipeline", icon: "🔀", href: "#" },
  { label: "Produtos", icon: "📦", href: "#" },
  { label: "Campanhas", icon: "📣", href: "#" },
  { label: "Relatórios", icon: "📈", href: "#" },
  { label: "Configurações", icon: "⚙️", href: "#" },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-slate-900 text-slate-200">
      {/* Logo / Marca */}
      <div className="flex items-center gap-3 h-16 px-6 border-b border-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-velot text-white font-bold">
          V
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">
          Velot
        </span>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {MENU_ITEMS.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  item.active
                    ? "bg-velot text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white",
                ].join(" ")}
              >
                <span className="text-base" aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Rodapé da sidebar */}
      <div className="border-t border-slate-800 px-6 py-4 text-xs text-slate-500">
        © {new Date().getFullYear()} Velot
      </div>
    </aside>
  );
}
