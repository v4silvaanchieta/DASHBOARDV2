"use client";

import { useEffect, useRef, useState } from "react";
import { fetchData, CSV_URL } from "@/lib/fetchData";

/** Intervalo de atualização automática (near real-time), em milissegundos. */
export const REFRESH_INTERVAL_MS = 60_000;

/**
 * Custom hook que faz o fetch do CSV no client-side e o atualiza automaticamente
 * a cada 60s (near real-time) com quebra de cache.
 *
 * @param {string} [url=CSV_URL]
 * @returns {{
 *   data: Array<Record<string, any>>,
 *   loading: boolean,
 *   error: Error|null,
 *   lastUpdated: Date|null,
 * }}
 */
export function useDashboardData(url = CSV_URL) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Evita atualizar estado após desmontar e controla o loading só na 1ª carga.
  const isMountedRef = useRef(true);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const load = () => {
      // Só exibe o spinner na primeira carga; as atualizações são silenciosas.
      if (isFirstLoadRef.current) setLoading(true);

      fetchData(url)
        .then((rows) => {
          if (!isMountedRef.current) return;
          setData(rows);
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

    // Carga inicial + polling a cada 60s.
    load();
    const intervalId = setInterval(load, REFRESH_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [url]);

  return { data, loading, error, lastUpdated };
}

export default useDashboardData;
