"use client";

/**
 * Header superior do dashboard. Recebe um título opcional e o horário da
 * última atualização (near real-time).
 *
 * @param {{ title?: string, lastUpdated?: Date|null }} props
 */
export default function Header({ title = "Dashboard", lastUpdated = null }) {
  const updatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <p className="text-xs text-slate-500">Painel de negócios · Velot</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-emerald-700">
            {updatedLabel ? `Atualizado às ${updatedLabel}` : "Tempo real"}
          </span>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-slate-700">Equipe Velot</p>
          <p className="text-xs text-slate-400">Auto-refresh a cada 60s</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-velot text-sm font-semibold text-white">
          V
        </div>
      </div>
    </header>
  );
}
