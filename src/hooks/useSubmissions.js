import { useCallback, useEffect, useState } from 'react';
import { fetchSubmissions } from '../services/supabase.js';

/**
 * Loads submissions from Supabase and exposes loading / error / data / refetch.
 */
export function useSubmissions() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchSubmissions();
      setData(rows);
    } catch (err) {
      setError(err?.message || 'Unknown error');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
