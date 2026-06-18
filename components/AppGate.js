"use client";

import { usePathname } from "next/navigation";
import PrivateRoute from "@/components/PrivateRoute";

/** Rotas públicas (não exigem autenticação). */
const PUBLIC_PATHS = ["/login"];

/**
 * Decide a proteção por rota sem tocar nas páginas:
 *  - rota pública (/login) -> renderiza livremente;
 *  - demais rotas -> protege via <PrivateRoute>.
 *
 * @param {{ children: React.ReactNode }} props
 */
export default function AppGate({ children }) {
  const pathname = usePathname();

  if (PUBLIC_PATHS.includes(pathname)) return children;

  return <PrivateRoute>{children}</PrivateRoute>;
}
