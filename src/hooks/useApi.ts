import { useCallback, useState } from 'react';
import { ApiError, apiRequest } from '../services/api';

export function useApi<T>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  const request = useCallback(async (url: string, options?: RequestInit) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest<T>(url, options);
      setData(result);
      return result;
    } catch (err) {
      if (err instanceof ApiError) setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, error, loading, request };
}
