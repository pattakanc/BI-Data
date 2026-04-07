const API_BASE = 'http://localhost:4700/api';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...options.headers as Record<string, string> };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (res.status === 401 || res.status === 403) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }
  return res.json();
}

function dateQs(from?: string, to?: string): string {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return params.toString();
}

export const api = {
  login: (username: string, password: string) =>
    fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => fetchAPI('/auth/me'),
  dashboards: () => fetchAPI('/dashboards'),
  executiveSummary: (from?: string, to?: string) =>
    fetchAPI(`/dashboards/executive/summary?${dateQs(from, to)}`),
  salesSummary: (from?: string, to?: string, branchKey?: string) =>
    fetchAPI(`/dashboards/sales/summary?${dateQs(from, to)}${branchKey ? `&branchKey=${branchKey}` : ''}`),
  salesKpiDrilldown: (type: string, from?: string, to?: string, branchKey?: number, productSearch?: string) => {
    const params = new URLSearchParams();
    params.set('type', type);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (branchKey) params.set('branchKey', String(branchKey));
    if (productSearch) params.set('productSearch', productSearch);
    return fetchAPI(`/dashboards/sales/kpi-drilldown?${params.toString()}`);
  },
  salesProductFilters: () =>
    fetchAPI('/dashboards/sales/product-filters'),
  salesTopProducts: (from?: string, to?: string, category?: string, brand?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (category) params.set('category', category);
    if (brand) params.set('brand', brand);
    return fetchAPI(`/dashboards/sales/top-products?${params.toString()}`);
  },
  salesProductDetail: (productKey: number, from?: string, to?: string) =>
    fetchAPI(`/dashboards/sales/product-detail/${productKey}?${dateQs(from, to)}`),
  branchKpiDrilldown: (type: string, from?: string, to?: string, regionName?: string, productSearch?: string) => {
    const params = new URLSearchParams();
    params.set('type', type);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (regionName) params.set('regionName', regionName);
    if (productSearch) params.set('productSearch', productSearch);
    return fetchAPI(`/dashboards/branch/kpi-drilldown?${params.toString()}`);
  },
  branchPerformance: (from?: string, to?: string) =>
    fetchAPI(`/dashboards/branch/performance?${dateQs(from, to)}`),
  branchDetail: (branchKey: number, from?: string, to?: string) =>
    fetchAPI(`/dashboards/branch/detail/${branchKey}?${dateQs(from, to)}`),
  branchProductInvoices: (branchKey: number, productName: string, from?: string, to?: string) =>
    fetchAPI(`/dashboards/branch/product-invoices/${branchKey}?${dateQs(from, to)}&productName=${encodeURIComponent(productName)}`),
  regionDetail: (regionName: string, from?: string, to?: string) =>
    fetchAPI(`/dashboards/branch/region/${encodeURIComponent(regionName)}?${dateQs(from, to)}`),
  inventorySummary: (from?: string, to?: string) =>
    fetchAPI(`/dashboards/inventory/summary?${dateQs(from, to)}`),
  customerSummary: (from?: string, to?: string) =>
    fetchAPI(`/dashboards/customer/summary?${dateQs(from, to)}`),
  serviceSummary: (from?: string, to?: string) =>
    fetchAPI(`/dashboards/service/summary?${dateQs(from, to)}`),
  auditSummary: (from?: string, to?: string) =>
    fetchAPI(`/dashboards/audit/summary?${dateQs(from, to)}`),
  learningSummary: (from?: string, to?: string) =>
    fetchAPI(`/dashboards/learning/summary?${dateQs(from, to)}`),
  claimSummary: (from?: string, to?: string) =>
    fetchAPI(`/dashboards/claim/summary?${dateQs(from, to)}`),
  branches: () => fetchAPI('/meta/branches'),
  regions: () => fetchAPI('/meta/regions'),
  adminUsers: () => fetchAPI('/admin/users'),
  adminDbStats: () => fetchAPI('/admin/db-stats'),
  adminJobs: () => fetchAPI('/admin/jobs'),
  adminDqIssues: () => fetchAPI('/admin/data-quality/issues'),
};
