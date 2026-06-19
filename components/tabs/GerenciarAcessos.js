"use client";

import { useEffect, useState } from "react";
import { deleteApp, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from "firebase/auth";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db, firebaseConfig } from "@/lib/firebaseConfig";

const EMPTY_FORM = { email: "", password: "", role: "unit", pipeline: "" };

/**
 * Aba "Gerenciar Acessos" (somente admin).
 * Cria contas via INSTÂNCIA SECUNDÁRIA do Firebase (não desloga o admin atual)
 * e grava as permissões no Firestore usando a instância principal (db).
 * Lista os usuários em tempo real via onSnapshot.
 */
export default function GerenciarAcessos({ pipelines = [] }) {
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  // Quando a unidade não está na lista do CRM, permite digitar manualmente.
  const [customPipeline, setCustomPipeline] = useState(false);

  // Listagem em tempo real da coleção "users".
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "users"),
      (snap) => {
        setList(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
        setLoadingList(false);
      },
      (err) => {
        setError(`Falha ao listar acessos: ${err.message}`);
        setLoadingList(false);
      }
    );
    return () => unsub();
  }, []);

  const isAdminRole = form.role === "admin";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");
    setSubmitting(true);

    const email = form.email.trim();
    const pipeline = isAdminRole ? "all" : form.pipeline.trim();

    if (!isAdminRole && !pipeline) {
      setError("Informe a pipeline da unidade.");
      setSubmitting(false);
      return;
    }

    // Instância secundária dedicada (nome único) — isola a sessão do novo usuário.
    const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        form.password
      );
      const uid = cred.user.uid;

      // Permissões no Firestore (instância principal), id do doc = UID.
      await setDoc(doc(db, "users", uid), {
        email,
        role: form.role,
        pipeline,
      });

      await signOut(secondaryAuth);
      setOk(`Acesso criado para ${email}.`);
      setForm(EMPTY_FORM);
      setCustomPipeline(false);
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/email-already-in-use") {
        setError("E-mail já cadastrado.");
      } else if (code === "auth/weak-password") {
        setError("Senha fraca (mínimo de 6 caracteres).");
      } else if (code === "auth/invalid-email") {
        setError("E-mail inválido.");
      } else {
        setError(err?.message || "Falha ao criar acesso.");
      }
    } finally {
      // Remove a instância secundária para não acumular apps.
      await deleteApp(secondaryApp).catch(() => {});
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-velot focus:outline-none focus:ring-1 focus:ring-velot dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

  return (
    <div className="space-y-6">
      {/* Formulário de criação */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Gerenciar Acessos
        </h2>
        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          Cadastre administradores e unidades franqueadas
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              E-mail
            </span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`mt-1 ${inputClass}`}
              placeholder="unidade@velot.com"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Senha provisória
            </span>
            <input
              type="text"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={`mt-1 ${inputClass}`}
              placeholder="mín. 6 caracteres"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Cargo
            </span>
            <select
              value={form.role}
              onChange={(e) => {
                setCustomPipeline(false);
                setForm({ ...form, role: e.target.value, pipeline: "" });
              }}
              className={`mt-1 ${inputClass}`}
            >
              <option value="unit">Unidade (Franquia)</option>
              <option value="admin">Administrador</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Loja / Unidade (CRM)
            </span>

            {isAdminRole ? (
              <input
                type="text"
                disabled
                value="all"
                className={`mt-1 ${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/50`}
              />
            ) : (
              <>
                <select
                  required
                  value={customPipeline ? "__custom__" : form.pipeline}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__custom__") {
                      setCustomPipeline(true);
                      setForm({ ...form, pipeline: "" });
                    } else {
                      setCustomPipeline(false);
                      setForm({ ...form, pipeline: v });
                    }
                  }}
                  className={`mt-1 ${inputClass}`}
                >
                  <option value="" disabled>
                    {pipelines.length
                      ? "Selecione a unidade…"
                      : "Carregando unidades…"}
                  </option>
                  {pipelines.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                  <option value="__custom__">Outra (digitar manualmente)…</option>
                </select>

                {customPipeline && (
                  <input
                    type="text"
                    required
                    value={form.pipeline}
                    onChange={(e) => setForm({ ...form, pipeline: e.target.value })}
                    className={`mt-2 ${inputClass}`}
                    placeholder="Nome EXATO da pipeline no CRM"
                  />
                )}
              </>
            )}
          </label>

          <div className="sm:col-span-2">
            {error && (
              <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
                {error}
              </p>
            )}
            {ok && (
              <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                {ok}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#DC0032] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#b8002a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Criando..." : "Criar acesso"}
            </button>
          </div>
        </form>
      </div>

      {/* Listagem de usuários ativos */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Usuários ativos ({list.length})
        </h3>

        {loadingList ? (
          <div className="flex h-24 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
            Carregando...
          </div>
        ) : list.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2 pr-4 font-semibold">E-mail</th>
                  <th className="py-2 pr-4 font-semibold">Cargo</th>
                  <th className="py-2 font-semibold">Pipeline</th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr
                    key={u.uid}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="py-2.5 pr-4 font-medium text-slate-800 dark:text-slate-100">
                      {u.email || "—"}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300">
                      {u.role === "admin" ? "Administrador" : "Unidade"}
                    </td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-300">
                      {u.pipeline || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-24 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
            Nenhum usuário cadastrado.
          </div>
        )}
      </div>
    </div>
  );
}
