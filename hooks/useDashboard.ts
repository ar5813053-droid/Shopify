import { useState, useEffect, useCallback } from 'react';
import { StorageService, DEFAULT_METRICS } from '../services/storage';
import { DashboardMetrics, Order, SalesDataPoint, CurrencyCode } from '../types';

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(DEFAULT_METRICS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [salesHistory, setSalesHistory] = useState<SalesDataPoint[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>('GBP');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [m, o, h, s] = await Promise.all([
        StorageService.getMetrics(),
        StorageService.getOrders(),
        StorageService.getSalesHistory(),
        StorageService.getSettings(),
      ]);
      setMetrics(m);
      setOrders(o);
      setSalesHistory(h);
      setCurrency(s.currency);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateMetrics = async (partial: Partial<DashboardMetrics>) => {
    const next = { ...metrics, ...partial };
    setMetrics(next);
    await StorageService.saveMetrics(next);
  };

  return {
    metrics,
    orders,
    salesHistory,
    currency,
    loading,
    refresh,
    updateMetrics,
  };
}
