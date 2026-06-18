"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";

const AuthContext = createContext({
  user: null,
  userData: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

/**
 * Provider de autenticação (Fase 1 — infraestrutura).
 * Apenas observa o estado de auth e o expõe via contexto.
 * NÃO bloqueia nem renderiza condicionalmente a aplicação (o gate virá em fase futura).
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Perfil do usuário no Firestore: { role: "admin" | "unit", pipeline: string }.
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          setUserData(snap.exists() ? snap.data() : null);
        } catch {
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

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
