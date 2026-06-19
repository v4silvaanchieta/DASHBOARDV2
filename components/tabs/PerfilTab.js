"use client";

import { useState } from "react";
import { updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { useAuth } from "@/context/AuthContext";

/** Spinner pequeno para os botões. */
function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  );
}

/** Alerta de feedback (sucesso/erro). */
function Alert({ msg }) {
  if (!msg?.text) return null;
  const ok = msg.type === "ok";
  return (
    <p
      className={`mb-3 rounded-lg px-3 py-2 text-xs font-medium ${
        ok
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
          : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
      }`}
    >
      {msg.text}
    </p>
  );
}

/**
 * Aba "Meu Perfil" (todos os usuários logados).
 * - Edita o nome de exibição (campo `name` em users/{uid}).
 * - Troca a senha via updatePassword (com tratamento de re-autenticação).
 */
export default function PerfilTab() {
  const { user, userData } = useAuth();

  const [name, setName] = useState(userData?.name || "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState({ type: "", text: "" });

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-velot focus:outline-none focus:ring-1 focus:ring-velot dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

  const btnClass =
    "inline-flex items-center justify-center gap-2 rounded-lg bg-[#DC0032] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#b8002a] disabled:cursor-not-allowed disabled:opacity-60";

  const handleSaveName = async (e) => {
    e.preventDefault();
    setNameMsg({ type: "", text: "" });
    if (!user) return;
    setNameSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { name: name.trim() });
      setNameMsg({ type: "ok", text: "Nome atualizado com sucesso." });
    } catch (err) {
      setNameMsg({
        type: "err",
        text:
          err?.code === "permission-denied"
            ? "Sem permissão para editar o perfil. Publique as regras atualizadas do Firestore (banco velot)."
            : err?.message || "Falha ao salvar o nome.",
      });
    } finally {
      setNameSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg({ type: "", text: "" });

    if (pw.length < 6) {
      setPwMsg({ type: "err", text: "A senha deve ter no mínimo 6 caracteres." });
      return;
    }
    if (pw !== pw2) {
      setPwMsg({ type: "err", text: "As senhas não coincidem." });
      return;
    }

    setPwSaving(true);
    try {
      await updatePassword(auth.currentUser, pw);
      setPwMsg({ type: "ok", text: "Senha alterada com sucesso." });
      setPw("");
      setPw2("");
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/requires-recent-login") {
        setPwMsg({
          type: "err",
          text: "Por segurança, faça logout e login novamente antes de trocar a senha.",
        });
      } else if (code === "auth/weak-password") {
        setPwMsg({ type: "err", text: "Senha fraca (mínimo de 6 caracteres)." });
      } else {
        setPwMsg({ type: "err", text: err?.message || "Falha ao alterar a senha." });
      }
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Dados do perfil */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Meu Perfil
        </h2>
        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          {user?.email}
          {userData?.role ? ` · ${userData.role === "admin" ? "Administrador" : `Unidade (${userData.pipeline})`}` : ""}
        </p>

        <form onSubmit={handleSaveName} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Nome de exibição
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`mt-1 ${inputClass}`}
              placeholder="Seu nome"
            />
          </label>

          <div>
            <Alert msg={nameMsg} />
            <button type="submit" disabled={nameSaving} className={btnClass}>
              {nameSaving && <Spinner />}
              {nameSaving ? "Salvando..." : "Salvar nome"}
            </button>
          </div>
        </form>
      </div>

      {/* Alterar senha */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Alterar senha
        </h2>
        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          Mínimo de 6 caracteres
        </p>

        <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Nova senha
            </span>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="new-password"
              className={`mt-1 ${inputClass}`}
              placeholder="••••••••"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Confirmar nova senha
            </span>
            <input
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              autoComplete="new-password"
              className={`mt-1 ${inputClass}`}
              placeholder="••••••••"
            />
          </label>

          <div>
            <Alert msg={pwMsg} />
            <button type="submit" disabled={pwSaving} className={btnClass}>
              {pwSaving && <Spinner />}
              {pwSaving ? "Alterando..." : "Alterar senha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
