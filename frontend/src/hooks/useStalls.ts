// Mengambil daftar warung dari GET /stalls (loading, error, data, reload).
import { useCallback, useEffect, useRef, useState } from 'react';
import { getStalls } from '../services/api';
import type { PaginationMeta } from '../types/api';
import type { Stall, StallQuery } from '../types/stall';

export function useStalls(query: StallQuery) {
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);

  const { search, category, page, limit } = query;

  const reload = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    // Abaikan response dari request lama
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    let cancelled = false;

    async function loadData(): Promise<void> {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getStalls({ search, category, page, limit });

        if (cancelled || requestId !== requestIdRef.current) return;

        setStalls(result.stalls);
        setMeta(result.meta);
      } catch (caughtError) {
        if (cancelled || requestId !== requestIdRef.current) return;

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Gagal memuat data warung dari server.',
        );
      } finally {
        if (!cancelled && requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [search, category, page, limit, reloadKey]);

  return {
    stalls,
    meta,
    isLoading,
    error,
    reload,
  };
}
