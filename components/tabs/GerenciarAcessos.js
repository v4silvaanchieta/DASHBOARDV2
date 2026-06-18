"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { auth } from "@/lib/firebaseConfig";

const EMPTY_FORM = { email: "", password: "", role: "unit", pipeline: "" };

/**
 * Aba "Gerenciar Acessos" (somente admin).
 * Cria/exclui contas via API Route protegida (/api/users) usando o Firebase Admin.
 */
export default function GerenciarAcessos() {
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const authedFetch = useCallback(async (options = {}) => {
    const token = await auth.currentUser?.getIdToken();
    return fetch("/api/users", {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token || ""}`,
        ...(options.headers || {}),
      },
    });
  }, []);

  const load = useCallback(async () => {
    setLoadingList(true);
    setError("");
    try {
      const res = await authedFetch({ method: "GET" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao listar acessos.");
      setList(json.users || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingList(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");
    setSubmitting(true);
    try {
      const payload = {
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        pipeline: form.role === "unit" ? form.pipeline.trim() : "",
      };
      const res = await authedFetch({
        method: "POST",
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao criar acesso.");
      setOk(`Acesso criado para ${payload.email}.`);
      setForm(EMPTY_FORM);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (uid, email) => {
    if (!window.confirm(`Excluir o acesso de ${email}?`)) return;
    setError("");
    setOk("");
    try {
      const res = await authedFetch({
        method: "DELETE",
        body: JSON.stringify({ uid }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao excluir acesso.");
      setOk("Acesso excluído.");
      load();
    } catch (e) {
      setError(e.message);
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

        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className={`mt-1 ${inputClass}`}
            >
              <option value="unit">Unidade (Franquia)</option>
              <option value="admin">Administrador</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Pipeline no CRM
            </span>
            <input
              type="text"
              required={form.role === "unit"}
              disabled={form.role !== "unit"}
              value={form.pipeline}
              onChange={(e) => setForm({ ...form, pipeline: e.target.value })}
              className={`mt-1 ${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/50`}
              placeholder="Ex.: Velot Campinas"
            />
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

      {/* Listagem */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Acessos cadastrados ({list.length})
        </h3>

        {loadingList ? (
          <div className="flex h-24 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
            Carregando...
          </div>
        ) : list.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2 pr-4 font-semibold">E-mail</th>
                  <th className="py-2 pr-4 font-semibold">Cargo</th>
                  <th className="py-2 pr-4 font-semibold">Pipeline</th>
                  <th className="py-2 text-right font-semibold">Ações</th>
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
                    <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300">
                      {u.pipeline || "—"}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(u.uid, u.email)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                      >
                        <Trash2 size={14} />
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-24 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
            Nenhum acesso cadastrado.
          </div>
        )}
      </div>
    </div>
  );
}
