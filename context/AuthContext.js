"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";

const CACHE_KEY = "@velot:userData";

/** Lê o userData do cache local (cache otimista de sessão). */
function readCache() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Persiste (ou limpa) o userData no cache local. */
function writeCache(data) {
  if (typeof window === "undefined") return;
  try {
    if (data) window.localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    else window.localStorage.removeItem(CACHE_KEY);
  } catch {}
}

const AuthContext = createContext({
  user: null,
  userData: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

/**
 * Provider de autenticação com CACHE OTIMISTA:
 * inicia o estado a partir do localStorage (renderiza o dashboard na hora,
 * sem aguardar o Firebase) e valida a sessão em background via onAuthStateChanged.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Inicia com o userData em cache; se houver, já não está "loading".
  const [userData, setUserData] = useState(() => readCache());
  const [loading, setLoading] = useState(() => readCache() === null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Sessão válida -> revalida o perfil em background e atualiza o cache.
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          const data = snap.exists() ? snap.data() : null;
          if (!data) {
            console.warn(
              `[Velot] Sem documento de permissão no Firestore para users/${firebaseUser.uid}. ` +
                `Crie o doc (id = este UID) com { role: "admin", pipeline: "all" } para virar administrador.`
            );
          }
          setUserData(data);
          writeCache(data);
        } catch (e) {
          // Pode ser regra do Firestore bloqueando a leitura do próprio doc.
          console.warn(
            "[Velot] Falha ao ler users/" + firebaseUser.uid + ": " + (e?.message || e)
          );
          // Mantém o cache otimista atual em caso de falha transitória.
        }
      } else {
        // Token expirado/inválido -> limpa estado e cache (PrivateRoute redireciona).
        setUserData(null);
        writeCache(null);
      }

      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = async () => {
    writeCache(null);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook de acesso ao estado/ações de autenticação. */
export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
