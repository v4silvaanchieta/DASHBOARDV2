"use client";

import { LogOut, Moon, Settings, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Header superior do dashboard. Título, indicador real-time, engrenagem de
 * configurações (admin) e toggle de tema.
 *
 * @param {{
 *   title?: string,
 *   lastUpdated?: Date|null,
 *   theme?: "light" | "dark",
 *   onToggleTheme?: () => void,
 *   isAdmin?: boolean,
 *   onOpenSettings?: () => void,
 * }} props
 */
export default function Header({
  title = "Dashboard",
  lastUpdated = null,
  theme = "light",
  onToggleTheme,
  isAdmin = false,
  onOpenSettings,
}) {
  const isDark = theme === "dark";
  const { logout, userData } = useAuth();
  const router = useRouter();

  // Indicador de perfil (também serve de diagnóstico do RBAC).
  const roleLabel =
    userData?.role === "admin"
      ? "Administrador"
      : userData?.role === "unit"
      ? `Unidade · ${userData.pipeline}`
      : "Perfil não configurado";
  const roleConfigured = Boolean(userData?.role);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  };

  const updatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-900/80">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {title}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Painel de negócios · Velot
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 dark:bg-emerald-500/10">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {updatedLabel ? `Atualizado às ${updatedLabel}` : "Tempo real"}
          </span>
        </div>

        <div className="hidden sm:block text-right">
          <p
            className={`text-sm font-medium ${
              roleConfigured
                ? "text-slate-700 dark:text-slate-200"
                : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {roleLabel}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Auto-refresh a cada 60s
          </p>
        </div>

        {/* Configurações (admin) — reúne Configurações, Meu Perfil e Acessos */}
        {isAdmin && (
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Configurações"
            title="Configurações (config, perfil e acessos)"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-velot hover:text-velot dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-velot dark:hover:text-velot"
          >
            <Settings size={18} />
          </button>
        )}

        {/* Toggle de tema (Sol / Lua) */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
          title={isDark ? "Modo claro" : "Modo escuro"}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-velot hover:text-velot dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-velot dark:hover:text-velot"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Sair / Logout */}
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sair"
          title="Sair"
          className="flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:border-velot hover:text-velot dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-velot dark:hover:text-velot"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
