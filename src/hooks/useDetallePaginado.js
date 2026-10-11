import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook para gestión de datos tabulares paginados en el servidor (TA.4).
 * Soporta ordenamiento, filtros dinámicos con AbortController, y estados
 * de carga, error y total de registros.
 *
 * @param {Object} config
 * @param {Function} config.fetcher Función asíncrona ({ page, size, sortBy, sortDir, ...filtros, signal }) => Promise
 * @param {number} [config.initialPage=0] Página inicial (0-indexed para MUI)
 * @param {number} [config.initialPageSize=20] Tamaño de página inicial
 * @param {string} [config.initialSortBy='createdAt'] Campo de orden inicial
 * @param {string} [config.initialSortDir='desc'] Dirección de orden ('asc' | 'desc')
 * @param {Object} [config.initialFiltros={}] Filtros adicionales iniciales
 * @param {Array} [config.staticData=null] Datos estáticos opcionales para modo local
 */
export function useDetallePaginado({
  fetcher,
  initialPage = 0,
  initialPageSize = 20,
  initialSortBy = 'createdAt',
  initialSortDir = 'desc',
  initialFiltros = {},
  staticData = null
} = {}) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortDir, setSortDir] = useState(initialSortDir);
  const [filtros, setFiltrosState] = useState(initialFiltros);

  const abortControllerRef = useRef(null);

  const setFiltros = useCallback((nuevosFiltros) => {
    setFiltrosState((prev) => {
      const next = typeof nuevosFiltros === 'function' ? nuevosFiltros(prev) : nuevosFiltros;
      return next;
    });
    setPage(0); // Reiniciar a página 0 cuando cambian los filtros
  }, []);

  const fetchData = useCallback(async () => {
    // Si se proveen datos estáticos locales (modo cliente)
    if (staticData && Array.isArray(staticData)) {
      setLoading(false);
      setError(null);
      setData(staticData);
      setTotal(staticData.length);
      return;
    }

    if (!fetcher || typeof fetcher !== 'function') {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        size: pageSize,
        sortBy,
        sortDir,
        ...filtros,
        signal: controller.signal
      };

      const result = await fetcher(params);

      // Compatibilidad con Spring Page<T> o estructuras de respuesta { content, totalElements }
      if (result && typeof result === 'object') {
        if (Array.isArray(result.content)) {
          setData(result.content);
          setTotal(result.totalElements ?? result.content.length);
        } else if (Array.isArray(result.data)) {
          setData(result.data);
          setTotal(result.total ?? result.data.length);
        } else if (Array.isArray(result)) {
          setData(result);
          setTotal(result.length);
        } else {
          setData([]);
          setTotal(0);
        }
      } else {
        setData([]);
        setTotal(0);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error en useDetallePaginado fetcher:', err);
        setError(err.message || 'Error al cargar los datos');
        setData([]);
        setTotal(0);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [fetcher, page, pageSize, sortBy, sortDir, filtros, staticData]);

  useEffect(() => {
    fetchData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    total,
    loading,
    error,
    page,
    pageSize,
    sortBy,
    sortDir,
    filtros,
    setPage,
    setPageSize,
    setSortBy,
    setSortDir,
    setFiltros,
    refetch
  };
}
