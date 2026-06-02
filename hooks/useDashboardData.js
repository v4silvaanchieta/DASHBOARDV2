"use client";

import { useEffect, useRef, useState } from "react";
import { fetchAllSources } from "@/lib/fetchData";

/** Intervalo de atualização automática (near real-time), em milissegundos. */
export const REFRESH_INTERVAL_MS = 60_000;

/**
 * Custom hook que busca as 3 abas (LEADS SDR, MOVIMENTAÇÃO, DEALS) em paralelo
 * e as atualiza automaticamente a cada 60s (near real-time) com quebra de cache.
 *
 * Retorna `data` = aba DEALS (fonte primária dos filtros/KPIs), além de
 * `leadsSdr` e `movimentacao` para os cruzamentos.
 *
 * @returns {{
 *   data: Array<Record<string, any>>,
 *   leadsSdr: Array<Record<string, any>>,
 *   movimentacao: Array<Record<string, any>>,
 *   loading: boolean,
 *   error: Error|null,
 *   lastUpdated: Date|null,
 * }}
 */
export function useDashboardData() {
  const [data, setData] = useState([]);
  const [leadsSdr, setLeadsSdr] = useState([]);
  const [movimentacao, setMovimentacao] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const isMountedRef = useRef(true);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const load = () => {
      if (isFirstLoadRef.current) setLoading(true);

      fetchAllSources()
        .then(({ deals, movimentacao: mov, leadsSdr: sdr }) => {
          if (!isMountedRef.current) return;
          setData(deals);
          setMovimentacao(mov);
          setLeadsSdr(sdr);
          setError(null);
          setLastUpdated(new Date());
        })
        .catch((err) => {
          if (isMountedRef.current) setError(err);
        })
        .finally(() => {
          if (!isMountedRef.current) return;
          if (isFirstLoadRef.current) {
            setLoading(false);
            isFirstLoadRef.current = false;
          }
        });
    };

    load();
    const intervalId = setInterval(load, REFRESH_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, []);

  return { data, leadsSdr, movimentacao, loading, error, lastUpdated };
}

export default useDashboardData;
