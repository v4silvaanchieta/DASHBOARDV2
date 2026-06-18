"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/** Spinner global de tela cheia (estado de carregamento da autenticação). */
function GlobalSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-velot dark:border-slate-700 dark:border-t-velot" />
    </div>
  );
}

/**
 * Protege rotas privadas:
 *  - loading -> spinner global;
 *  - sem usuário -> redireciona para /login;
 *  - autenticado -> renderiza os children (Dashboard).
 *
 * @param {{ children: React.ReactNode }} props
 */
export default function PrivateRoute({ children }) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  // Sessão otimista: considera o cache (userData) enquanto o Firebase valida em
  // background. Se a validação falhar (!user), o AuthContext limpa o userData e
  // este efeito redireciona para /login.
  const authed = Boolean(user) || Boolean(userData);

  useEffect(() => {
    if (!loading && !authed) router.replace("/login");
  }, [loading, authed, router]);

  if (loading) return <GlobalSpinner />;
  if (!authed) return <GlobalSpinner />; // aguardando o redirecionamento

  return children;
}
