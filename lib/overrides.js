"use client";

import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

/**
 * Overrides do dashboard COMPARTILHADOS entre todos os perfis (Firestore, doc
 * `config/overrides`), em tempo real:
 *   - winDates: { chaveDoNegocio: "YYYY-MM-DD" }  -> data real do ganho (fechamento)
 *   - excluded: { chaveDoNegocio: true }          -> negócios removidos dos cálculos
 *
 * A chave do negócio é a mesma usada no dashboard (DEAL ID, ou NOME+DATA CRIAÇÃO).
 * Mantém um cache local (localStorage) só para render otimista antes do 1º snapshot;
 * a fonte de verdade é o Firestore. Escritas gravam o doc inteiro (poucos itens),
 * o que lida bem com remoções de chave.
 */

const DOC = () => doc(db, "config", "overrides");
const LS_KEY = "velot-overrides-cache";

export function useOverrides() {
  const [winDates, setWinDates] = useState({});
  const [excluded, setExcluded] = useState({});
  // Espelho síncrono do estado, para montar a próxima escrita sem depender do render.
  const ref = useRef({ winDates: {}, excluded: {} });

  const apply = (next) => {
    ref.current = next;
    setWinDates(next.winDates);
    setExcluded(next.excluded);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {}
  };

  // Cache local (render otimista imediato).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const c = JSON.parse(raw) || {};
        apply({ winDates: c.winDates || {}, excluded: c.excluded || {} });
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Assinatura em tempo real do Firestore (fonte de verdade).
  useEffect(() => {
    const unsub = onSnapshot(
      DOC(),
      (snap) => {
        const d = snap.exists() ? snap.data() : {};
        apply({ winDates: d.winDates || {}, excluded: d.excluded || {} });
      },
      (err) =>
        console.warn("[Velot] overrides onSnapshot:", err?.message || err)
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (next) => {
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
    persist({ winDates: winDatesNext, excluded: ref.current.excluded });
  };

  /** Alterna a exclusão de um negócio dos cálculos. */
  const toggleExclude = (key) => {
    if (!key) return;
    const excludedNext = { ...ref.current.excluded };
    if (excludedNext[key]) delete excludedNext[key];
    else excludedNext[key] = true;
    persist({ winDates: ref.current.winDates, excluded: excludedNext });
  };

  return { winDates, excluded, setWinDate, toggleExclude };
}

export default useOverrides;
