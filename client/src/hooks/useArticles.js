import { useState, useEffect, useCallback, useRef } from 'react';
import articleService from '../services/articleService';

/**
 * Custom hook to fetch and manage articles with filters, pagination, and refetch capability.
 *
 * @param {Object} [params={}] - Query parameters (status, category, department, page, limit, search)
 * @returns {{
 *   articles: Array,
 *   loading: boolean,
 *   error: string|null,
 *   pagination: Object|null,
 *   refetch: Function
 * }}
 */
export function useArticles(params = {}) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  // Keep a stable serialized string of params to prevent unnecessary infinite loops
  const paramsKey = JSON.stringify(params);
  const isMountedRef = useRef(true);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const parsedParams = JSON.parse(paramsKey);
      const res = await articleService.getArticles(parsedParams);
      if (isMountedRef.current) {
        const list = Array.isArray(res.data)
          ? res.data
          : (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
        setArticles(list);
        setPagination(res.pagination || res.data?.pagination || null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message || 'Failed to load articles');
        setArticles([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [paramsKey]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchArticles();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchArticles]);

  return {
    articles,
    loading,
    error,
    pagination,
    refetch: fetchArticles,
  };
}

export default useArticles;
