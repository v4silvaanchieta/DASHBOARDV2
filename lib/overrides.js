"use client";

import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

/**
 * Overrides do dashboard COMPARTILHADOS entre todos os perfis (Firestore, doc
 * `config/overrides`), em tempo real:
 *   - winDates: { chaveDoNegocio: "YYYY-MM-DD" }  -> data real do ganho (fechamento)
 *   - excluded: { chaveDoNegocio: true }          -> negócios removidos dos cálculos
 *   - confirmedSales: { chaveDaVenda: true }      -> venda confirmada (lançada no CRM)
 *
 * A chave do negócio é a mesma usada no dashboard (DEAL ID, ou NOME+DATA CRIAÇÃO).
 * Mantém um cache local (localStorage) só para render otimista antes do 1º snapshot;
 * a fonte de verdade é o Firestore. Escritas gravam o doc inteiro (poucos itens),
 * o que lida bem com remoções de chave.
 */

const DOC = () => doc(db, "config", "overrides");
const LS_KEY = "velot-overrides-cache";
const EMPTY = { winDates: {}, excluded: {}, confirmedSales: {} };

export function useOverrides() {
  const [winDates, setWinDates] = useState({});
  const [excluded, setExcluded] = useState({});
  const [confirmedSales, setConfirmedSales] = useState({});
  // Espelho síncrono do estado, para montar a próxima escrita sem depender do render.
  const ref = useRef({ ...EMPTY });

  const apply = (next) => {
    const full = { ...EMPTY, ...next };
    ref.current = full;
    setWinDates(full.winDates);
    setExcluded(full.excluded);
    setConfirmedSales(full.confirmedSales);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(full));
    } catch {}
  };

  // Cache local (render otimista imediato).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) apply(JSON.parse(raw) || {});
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Assinatura em tempo real do Firestore (fonte de verdade).
  useEffect(() => {
    const unsub = onSnapshot(
      DOC(),
      (snap) => apply(snap.exists() ? snap.data() : {}),
      (err) =>
        console.warn("[Velot] overrides onSnapshot:", err?.message || err)
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (patch) => {
    const next = { ...ref.current, ...patch };
    apply(next);
    setDoc(DOC(), next).catch((e) =>
      console.warn("[Velot] overrides setDoc (regra do Firestore?):", e?.message || e)
    );
  };

  /** Define/remove a data real do ganho de um negócio (ymd vazio = remove). */
  const setWinDate = (key, ymd) => {
    if (!key) return;
    const winDatesNext = { ...ref.current.winDates };
    if (ymd) winDatesNext[key] = ymd;
    else delete winDatesNext[key];
    persist({ winDates: winDatesNext });
  };

  /** Alterna a exclusão de um negócio dos cálculos. */
  const toggleExclude = (key) => {
    if (!key) return;
    const excludedNext = { ...ref.current.excluded };
    if (excludedNext[key]) delete excludedNext[key];
    else excludedNext[key] = true;
    persist({ excluded: excludedNext });
  };

  /**
   * Confirma/desconfirma uma venda (lançada no CRM). Ao confirmar, opcionalmente
   * também grava a DATA DO GANHO (data do relatório) no negócio casado do CRM,
   * para o dashboard contar o ganho na data real da Velot.
   *
   * @param {string} saleKey    chave estável da venda (controle)
   * @param {string} [dealKey]  chave do negócio casado no CRM (para a data)
   * @param {string} [ymd]      data do relatório "YYYY-MM-DD"
   */
  const toggleConfirmSale = (saleKey, dealKey, ymd) => {
    if (!saleKey) return;
    const confirmedNext = { ...ref.current.confirmedSales };
    const winDatesNext = { ...ref.current.winDates };
    if (confirmedNext[saleKey]) {
      delete confirmedNext[saleKey];
      if (dealKey) delete winDatesNext[dealKey]; // desfaz a data do relatório
    } else {
      confirmedNext[saleKey] = true;
      if (dealKey && ymd) winDatesNext[dealKey] = ymd; // ganho conta pela data do relatório
    }
    persist({ confirmedSales: confirmedNext, winDates: winDatesNext });
  };

  return { winDates, excluded, confirmedSales, setWinDate, toggleExclude, toggleConfirmSale };
}

export default useOverrides;
