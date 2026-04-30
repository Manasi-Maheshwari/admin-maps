import { useCallback, useEffect, useState } from 'react';
import { fetchUsers } from '../services/supabase.js';

export function useUsers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchUsers();
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
