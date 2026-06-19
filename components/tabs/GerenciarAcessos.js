"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { deleteApp, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { auth, db, firebaseConfig } from "@/lib/firebaseConfig";

const EMPTY_FORM = { email: "", password: "", role: "unit", pipeline: "" };

/**
 * Aba "Gerenciar Acessos" (somente admin).
 * - Cria contas via INSTÂNCIA SECUNDÁRIA do Firebase (não desloga o admin atual).
 * - Edita cargo/pipeline (atualiza o doc em users via instância principal).
 * - Exclui o acesso (remove o doc -> revoga o acesso ao dashboard).
 * Lista os usuários em tempo real via onSnapshot.
 */
export default function GerenciarAcessos({ pipelines = [] }) {
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingUid, setEditingUid] = useState(null); // null = modo criação
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  // Quando a unidade não está na lista do CRM, permite digitar manualmente.
  const [customPipeline, setCustomPipeline] = useState(false);

  const myUid = auth.currentUser?.uid;
  const isEditing = Boolean(editingUid);
  const isAdminRole = form.role === "admin";

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

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingUid(null);
    setCustomPipeline(false);
  };

  const startEdit = (u) => {
    setError("");
    setOk("");
    setEditingUid(u.uid);
    const isUnit = u.role !== "admin";
    setForm({
      email: u.email || "",
      password: "",
      role: u.role || "unit",
      pipeline: isUnit ? u.pipeline || "" : "all",
    });
    // Se a pipeline salva não está na lista do CRM, abre o campo manual.
    setCustomPipeline(
      isUnit && Boolean(u.pipeline) && !pipelines.includes(u.pipeline)
    );
  };

  const handleDelete = async (u) => {
    setError("");
    setOk("");
    if (u.uid === myUid) {
      setError("Você não pode excluir o próprio acesso.");
      return;
    }
    if (!window.confirm(`Excluir o acesso de ${u.email || u.uid}?`)) return;
    try {
      await deleteDoc(doc(db, "users", u.uid));
      setOk("Acesso revogado.");
      if (editingUid === u.uid) resetForm();
    } catch (err) {
      setError(err?.message || "Falha ao excluir acesso.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");

    const email = form.email.trim();
    const pipeline = isAdminRole ? "all" : form.pipeline.trim();
    if (!isAdminRole && !pipeline) {
      setError("Informe a unidade (pipeline).");
      return;
    }

    setSubmitting(true);

    // ===== EDIÇÃO: atualiza cargo/pipeline do doc existente =====
    if (isEditing) {
      try {
        await setDoc(
          doc(db, "users", editingUid),
          { email, role: form.role, pipeline },
          { merge: true }
        );
        setOk(`Acesso de ${email} atualizado.`);
        resetForm();
      } catch (err) {
        setError(err?.message || "Falha ao atualizar acesso.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // ===== CRIAÇÃO: instância secundária (não desloga o admin) =====
    const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);
    try {
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        form.password
      );
      await setDoc(doc(db, "users", cred.user.uid), {
        email,
        role: form.role,
        pipeline,
      });
      await signOut(secondaryAuth);
      setOk(`Acesso criado para ${email}.`);
      resetForm();
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/email-already-in-use") setError("E-mail já cadastrado.");
      else if (code === "auth/weak-password")
        setError("Senha fraca (mínimo de 6 caracteres).");
      else if (code === "auth/invalid-email") setError("E-mail inválido.");
      else setError(err?.message || "Falha ao criar acesso.");
    } finally {
      await deleteApp(secondaryApp).catch(() => {});
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-velot focus:outline-none focus:ring-1 focus:ring-velot dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

  return (
    <div className="space-y-6">
      {/* Formulário de criação / edição */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEditing ? "Editar acesso" : "Gerenciar Acessos"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              {isEditing
                ? "Altere o cargo e/ou a unidade deste usuário"
                : "Cadastre administradores e unidades franqueadas"}
            </p>
          </div>
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <X size={14} /> Cancelar edição
            </button>
          )}
        </div>

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
              disabled={isEditing}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`mt-1 ${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/50`}
              placeholder="unidade@velot.com"
            />
          </label>

          {/* Senha só na criação (não é possível alterar a senha de terceiros no client) */}
          {!isEditing && (
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
          )}

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
              {submitting
                ? "Salvando..."
                : isEditing
                ? "Salvar alterações"
                : "Criar acesso"}
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
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2 pr-4 font-semibold">E-mail</th>
                  <th className="py-2 pr-4 font-semibold">Cargo</th>
                  <th className="py-2 pr-4 font-semibold">Pipeline</th>
                  <th className="py-2 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => {
                  const isSelf = u.uid === myUid;
                  return (
                    <tr
                      key={u.uid}
                      className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                    >
                      <td className="py-2.5 pr-4 font-medium text-slate-800 dark:text-slate-100">
                        {u.email || "—"}
                        {isSelf && (
                          <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            você
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300">
                        {u.role === "admin" ? "Administrador" : "Unidade"}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300">
                        {u.pipeline || "—"}
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => startEdit(u)}
                          className="mr-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Pencil size={14} /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          disabled={isSelf}
                          title={isSelf ? "Você não pode excluir o próprio acesso" : "Excluir acesso"}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-rose-400 dark:hover:bg-rose-500/10"
                        >
                          <Trash2 size={14} /> Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
