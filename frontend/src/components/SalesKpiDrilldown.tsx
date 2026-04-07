'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import { X, Search, Building2, FileText, Package, TrendingUp, DollarSign, ShoppingCart, CreditCard, Activity, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';

const KPI_CONFIG = {
  revenue: {
    title: 'รายได้รวม',
    subtitle: 'Total Revenue — Drill-down รายละเอียดรายได้',
    icon: DollarSign,
    color: '#3b82f6',
    bgClass: 'bg-blue-600',
    lightBg: 'bg-blue-50',
    textClass: 'text-blue-800',
    labelClass: 'text-blue-600',
    field: 'revenue' as const,
    label: 'รายได้',
    formatVal: formatCurrency,
    invoiceSortLabel: 'ยอดขายสูงสุด',
    branchCols: [
      { key: 'revenue', label: 'รายได้', format: formatCurrency, cls: 'font-bold' },
      { key: 'invoices', label: 'จำนวนบิล', format: formatNumber, cls: '' },
      { key: 'margin', label: 'อัตรากำไร', format: (v: number) => `${(v * 100).toFixed(1)}%`, cls: '' },
    ],
    productCols: [
      { key: 'revenue', label: 'รายได้', format: formatCurrency, cls: 'font-bold' },
      { key: 'qty', label: 'จำนวน', format: formatNumber, cls: '' },
      { key: 'gp', label: 'กำไร', format: formatCurrency, cls: 'text-green-600' },
    ],
    invoiceCols: [
      { key: 'revenue', label: 'ยอดขาย', format: formatCurrency, cls: 'font-bold text-blue-700' },
      { key: 'gp', label: 'กำไร', format: formatCurrency, cls: 'text-green-600' },
      { key: 'discount', label: 'ส่วนลด', format: formatCurrency, cls: 'text-orange-500 text-xs' },
    ],
  },
  gp: {
    title: 'กำไรขั้นต้น',
    subtitle: 'Gross Profit — Drill-down รายละเอียดกำไร',
    icon: TrendingUp,
    color: '#10b981',
    bgClass: 'bg-emerald-600',
    lightBg: 'bg-green-50',
    textClass: 'text-green-800',
    labelClass: 'text-green-600',
    field: 'gp' as const,
    label: 'กำไรขั้นต้น',
    formatVal: formatCurrency,
    invoiceSortLabel: 'กำไรสูงสุด',
    branchCols: [
      { key: 'gp', label: 'กำไรขั้นต้น', format: formatCurrency, cls: 'font-bold text-green-700' },
      { key: 'revenue', label: 'รายได้', format: formatCurrency, cls: '' },
      { key: 'margin', label: 'อัตรากำไร', format: (v: number) => `${(v * 100).toFixed(1)}%`, cls: '' },
    ],
    productCols: [
      { key: 'gp', label: 'กำไร', format: formatCurrency, cls: 'font-bold text-green-700' },
      { key: 'revenue', label: 'รายได้', format: formatCurrency, cls: '' },
      { key: 'qty', label: 'จำนวน', format: formatNumber, cls: '' },
    ],
    invoiceCols: [
      { key: 'gp', label: 'กำไร', format: formatCurrency, cls: 'font-bold text-green-700' },
      { key: 'revenue', label: 'ยอดขาย', format: formatCurrency, cls: '' },
      { key: 'discount', label: 'ส่วนลด', format: formatCurrency, cls: 'text-orange-500 text-xs' },
    ],
  },
  invoices: {
    title: 'จำนวนใบแจ้งหนี้',
    subtitle: 'Total Invoices — Drill-down รายละเอียดใบแจ้งหนี้',
    icon: ShoppingCart,
    color: '#8b5cf6',
    bgClass: 'bg-purple-600',
    lightBg: 'bg-purple-50',
    textClass: 'text-purple-800',
    labelClass: 'text-purple-600',
    field: 'invoices' as const,
    label: 'จำนวนบิล',
    formatVal: formatNumber,
    invoiceSortLabel: 'ล่าสุด',
    branchCols: [
      { key: 'invoices', label: 'จำนวนบิล', format: formatNumber, cls: 'font-bold text-purple-700' },
      { key: 'revenue', label: 'รายได้', format: formatCurrency, cls: '' },
      { key: 'gp', label: 'กำไร', format: formatCurrency, cls: 'text-green-600' },
    ],
    productCols: [
      { key: 'qty', label: 'จำนวนขาย', format: formatNumber, cls: 'font-bold text-purple-700' },
      { key: 'revenue', label: 'รายได้', format: formatCurrency, cls: '' },
      { key: 'gp', label: 'กำไร', format: formatCurrency, cls: 'text-green-600' },
    ],
    invoiceCols: [
      { key: 'revenue', label: 'ยอดขาย', format: formatCurrency, cls: '' },
      { key: 'gp', label: 'กำไร', format: formatCurrency, cls: 'text-green-600' },
      { key: 'discount', label: 'ส่วนลด', format: formatCurrency, cls: 'text-orange-500 text-xs' },
    ],
  },
  discount: {
    title: 'ส่วนลดรวม',
    subtitle: 'Total Discount — Drill-down รายละเอียดส่วนลด',
    icon: CreditCard,
    color: '#f59e0b',
    bgClass: 'bg-amber-500',
    lightBg: 'bg-orange-50',
    textClass: 'text-orange-800',
    labelClass: 'text-orange-600',
    field: 'discount' as const,
    label: 'ส่วนลด',
    formatVal: formatCurrency,
    invoiceSortLabel: 'ส่วนลดสูงสุด',
    branchCols: [
      { key: 'discount', label: 'ส่วนลด', format: formatCurrency, cls: 'font-bold text-orange-600' },
      { key: 'revenue', label: 'รายได้', format: formatCurrency, cls: '' },
      { key: 'invoices', label: 'จำนวนบิล', format: formatNumber, cls: '' },
    ],
    productCols: [
      { key: 'discount', label: 'ส่วนลด', format: formatCurrency, cls: 'font-bold text-orange-600' },
      { key: 'revenue', label: 'รายได้', format: formatCurrency, cls: '' },
      { key: 'qty', label: 'จำนวน', format: formatNumber, cls: '' },
    ],
    invoiceCols: [
      { key: 'discount', label: 'ส่วนลด', format: formatCurrency, cls: 'font-bold text-orange-600' },
      { key: 'revenue', label: 'ยอดขาย', format: formatCurrency, cls: '' },
      { key: 'gp', label: 'กำไร', format: formatCurrency, cls: 'text-green-600' },
    ],
  },
  margin: {
    title: 'อัตรากำไร (Margin)',
    subtitle: 'Gross Margin — Drill-down รายละเอียดอัตรากำไร',
    icon: Activity,
    color: '#8b5cf6',
    bgClass: 'bg-purple-600',
    lightBg: 'bg-purple-50',
    textClass: 'text-purple-800',
    labelClass: 'text-purple-600',
    field: 'margin' as const,
    label: 'Margin',
    formatVal: (v: number) => `${(v * 100).toFixed(1)}%`,
    invoiceSortLabel: 'ยอดขายสูงสุด',
    branchCols: [
      { key: 'margin', label: 'Margin', format: (v: number) => `${(v * 100).toFixed(1)}%`, cls: 'font-bold text-purple-700' },
      { key: 'revenue', label: 'รายได้', format: formatCurrency, cls: '' },
      { key: 'gp', label: 'กำไร', format: formatCurrency, cls: 'text-green-600' },
    ],
    productCols: [
      { key: 'gp', label: 'กำไร', format: formatCurrency, cls: 'font-bold text-green-700' },
      { key: 'revenue', label: 'รายได้', format: formatCurrency, cls: '' },
      { key: 'qty', label: 'จำนวน', format: formatNumber, cls: '' },
    ],
    invoiceCols: [
      { key: 'gp', label: 'กำไร', format: formatCurrency, cls: 'font-bold text-green-700' },
      { key: 'revenue', label: 'ยอดขาย', format: formatCurrency, cls: '' },
      { key: 'discount', label: 'ส่วนลด', format: formatCurrency, cls: 'text-orange-500 text-xs' },
    ],
  },
  customers: {
    title: 'จำนวนลูกค้า',
    subtitle: 'Total Customers — Drill-down รายละเอียดลูกค้า',
    icon: Users,
    color: '#6366f1',
    bgClass: 'bg-indigo-600',
    lightBg: 'bg-indigo-50',
    textClass: 'text-indigo-800',
    labelClass: 'text-indigo-600',
    field: 'customers' as const,
    label: 'ลูกค้า',
    formatVal: formatNumber,
    invoiceSortLabel: 'ยอดขายสูงสุด',
    branchCols: [
      { key: 'customers', label: 'ลูกค้า', format: formatNumber, cls: 'font-bold text-indigo-700' },
      { key: 'revenue', label: 'รายได้', format: formatCurrency, cls: '' },
      { key: 'invoices', label: 'จำนวนบิล', format: formatNumber, cls: '' },
    ],
    productCols: [
      { key: 'qty', label: 'จำนวนขาย', format: formatNumber, cls: 'font-bold text-indigo-700' },
      { key: 'revenue', label: 'รายได้', format: formatCurrency, cls: '' },
      { key: 'gp', label: 'กำไร', format: formatCurrency, cls: 'text-green-600' },
    ],
    invoiceCols: [
      { key: 'revenue', label: 'ยอดขาย', format: formatCurrency, cls: 'font-bold text-blue-700' },
      { key: 'gp', label: 'กำไร', format: formatCurrency, cls: 'text-green-600' },
      { key: 'discount', label: 'ส่วนลด', format: formatCurrency, cls: 'text-orange-500 text-xs' },
    ],
  },
};

type KpiType = keyof typeof KPI_CONFIG;

interface SalesKpiDrilldownProps {
  type: KpiType;
  dateFrom: string;
  dateTo: string;
  onClose: () => void;
}

export default function SalesKpiDrilldown({ type, dateFrom, dateTo, onClose }: SalesKpiDrilldownProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'invoices'>('overview');
  const [branches, setBranches] = useState<any[]>([]);
  const [selBranch, setSelBranch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const cfg = KPI_CONFIG[type];
  const Icon = cfg.icon;

  const fetchData = useCallback((branchKey?: string, prodSearch?: string) => {
    setLoading(true);
    api.salesKpiDrilldown(type, dateFrom, dateTo, branchKey ? parseInt(branchKey) : undefined, prodSearch || undefined)
      .then((res: any) => { if (res.success) setData(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [type, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
    api.branches().then((res: any) => { if (res.success) setBranches(res.data); });
  }, [fetchData]);

  const handleBranchChange = (val: string) => { setSelBranch(val); fetchData(val, productSearch); };
  const handleSearch = () => { setProductSearch(searchInput); fetchData(selBranch, searchInput); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };

  const branchSummary = (data?.branchSummary || []).map((r: any) => ({
    ...r, revenue: Number(r.revenue) || 0, gp: Number(r.gp) || 0,
    discount: Number(r.discount) || 0, invoices: Number(r.invoices) || 0,
    customers: Number(r.customers) || 0, margin: Number(r.margin) || 0,
  }));
  const dailyTrend = (data?.dailyTrend || []).map((r: any) => ({
    ...r, revenue: Number(r.revenue) || 0, gp: Number(r.gp) || 0,
    discount: Number(r.discount) || 0, invoices: Number(r.invoices) || 0,
    customers: Number(r.customers) || 0, margin_pct: Number(r.margin_pct) || 0,
  }));
  const invoiceList = (data?.invoices || []).map((r: any) => ({
    ...r, revenue: Number(r.revenue) || 0, gp: Number(r.gp) || 0, discount: Number(r.discount) || 0,
  }));
  const topProducts = (data?.topProducts || []).map((r: any) => ({
    ...r, revenue: Number(r.revenue) || 0, gp: Number(r.gp) || 0,
    discount: Number(r.discount) || 0, qty: Number(r.qty) || 0,
  }));
  const totals = data?.totals || { revenue: 0, gp: 0, discount: 0, invoices: 0, customers: 0, margin: 0 };
  const mainValue = totals[cfg.field] || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-auto" onClick={e => e.stopPropagation()}>
        {/* Header — focused on this KPI only */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${cfg.bgClass} flex items-center justify-center text-white shadow-lg`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{cfg.title}</h2>
                <p className="text-sm text-gray-500">{cfg.subtitle}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main KPI Value — single focused number */}
          <div className={`${cfg.lightBg} rounded-xl px-5 py-3 mt-4 flex items-center justify-between`}>
            <div>
              <div className={`text-xs ${cfg.labelClass} font-medium`}>{cfg.label}ทั้งหมด</div>
              <div className={`text-2xl font-bold ${cfg.textClass}`}>{cfg.formatVal(mainValue)}</div>
            </div>
            <div className="text-right text-xs text-gray-400 space-y-0.5">
              <div>{branchSummary.length} สาขา</div>
              {type !== 'invoices' && <div>{formatNumber(totals.invoices)} บิล</div>}
              {type !== 'revenue' && <div>รายได้ {formatCurrency(totals.revenue)}</div>}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              <select
                value={selBranch}
                onChange={e => handleBranchChange(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[160px]"
              >
                <option value="">ทุกสาขา</option>
                {branches.map((b: any) => (
                  <option key={b.branch_key} value={b.branch_key}>{b.branch_name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <Search className="w-4 h-4 text-gray-400" />
              <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown} placeholder="ค้นหาสินค้า..."
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 w-[180px]"
              />
              <button onClick={handleSearch}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">
                ค้นหา
              </button>
            </div>
            {(selBranch || productSearch) && (
              <button onClick={() => { setSelBranch(''); setSearchInput(''); setProductSearch(''); fetchData('', ''); }}
                className="px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                ล้างฟิลเตอร์
              </button>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mt-4">
            <button onClick={() => setTab('overview')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'overview' ? `${cfg.bgClass} text-white` : 'text-gray-600 hover:bg-gray-100'}`}>
              <TrendingUp className="w-4 h-4 inline mr-1.5" />ภาพรวม & กราฟ
            </button>
            <button onClick={() => setTab('invoices')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'invoices' ? `${cfg.bgClass} text-white` : 'text-gray-600 hover:bg-gray-100'}`}>
              <FileText className="w-4 h-4 inline mr-1.5" />รายการ Invoice ({invoiceList.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-gray-500">กำลังโหลดข้อมูล...</span>
            </div>
          ) : tab === 'overview' ? (
            <div className="space-y-6">
              {/* Daily Trend — show only this KPI's line */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">แนวโน้ม{cfg.label}รายวัน</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="full_date" fontSize={10}
                      tickFormatter={(v: any) => new Date(v).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} />
                    <YAxis fontSize={10} tickFormatter={(v: any) => type === 'invoices' || type === 'customers' ? String(v) : type === 'margin' ? `${v}%` : `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip
                      formatter={(v: any) => type === 'invoices' || type === 'customers' ? formatNumber(v) : type === 'margin' ? `${v}%` : formatCurrency(v)}
                      labelFormatter={(l: any) => new Date(l).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                    />
                    <Line type="monotone" dataKey={type === 'margin' ? 'margin_pct' : cfg.field} stroke={cfg.color} strokeWidth={2.5} name={cfg.label} dot={false} />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Branch Breakdown Chart — sorted by this KPI */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    <Building2 className="w-4 h-4 inline mr-1" />{cfg.label}แยกตามสาขา
                  </h3>
                  <ResponsiveContainer width="100%" height={Math.max(250, Math.min(branchSummary.length * 24, 500))}>
                    <BarChart data={branchSummary.slice(0, 20)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" fontSize={10} tickFormatter={(v: any) => type === 'invoices' || type === 'customers' ? String(v) : type === 'margin' ? `${(v * 100).toFixed(0)}%` : `${(v / 1000).toFixed(0)}K`} />
                      <YAxis type="category" dataKey="branch_name" fontSize={10} width={100} />
                      <Tooltip formatter={(v: any) => type === 'invoices' || type === 'customers' ? formatNumber(v) : type === 'margin' ? `${(v * 100).toFixed(1)}%` : formatCurrency(v)} />
                      <Bar dataKey={cfg.field} fill={cfg.color} radius={[0, 4, 4, 0]} name={cfg.label} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Products — columns specific to this KPI */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    <Package className="w-4 h-4 inline mr-1" />Top 15 สินค้า (เรียงตาม{cfg.label})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-2 px-2 font-semibold text-gray-600">#</th>
                          <th className="text-left py-2 px-2 font-semibold text-gray-600">สินค้า</th>
                          <th className="text-left py-2 px-2 font-semibold text-gray-600">หมวดหมู่</th>
                          {cfg.productCols.map(c => (
                            <th key={c.key} className="text-right py-2 px-2 font-semibold text-gray-600">{c.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.map((p: any, i: number) => (
                          <tr key={i} className="border-b border-gray-100 hover:bg-white">
                            <td className="py-1.5 px-2 text-gray-400">{i + 1}</td>
                            <td className="py-1.5 px-2 font-medium text-gray-700">{p.product_name}</td>
                            <td className="py-1.5 px-2">
                              <span className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px] text-gray-600">{p.category_name}</span>
                            </td>
                            {cfg.productCols.map(c => (
                              <td key={c.key} className={`py-1.5 px-2 text-right ${c.cls}`}>{c.format(p[c.key])}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Branch Summary Table — columns specific to this KPI */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">ตาราง{cfg.label}รายสาขา</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200 bg-gray-100">
                        <th className="text-left py-2.5 px-3 font-semibold text-gray-600">#</th>
                        <th className="text-left py-2.5 px-3 font-semibold text-gray-600">สาขา</th>
                        <th className="text-left py-2.5 px-3 font-semibold text-gray-600">ภูมิภาค</th>
                        {cfg.branchCols.map(c => (
                          <th key={c.key} className="text-right py-2.5 px-3 font-semibold text-gray-600">{c.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {branchSummary.map((b: any, i: number) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-white">
                          <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                          <td className="py-2 px-3 font-medium text-gray-800">{b.branch_name}</td>
                          <td className="py-2 px-3 text-gray-500 text-xs">{b.region_name}</td>
                          {cfg.branchCols.map(c => (
                            <td key={c.key} className={`py-2 px-3 text-right ${c.cls}`}>{c.format(b[c.key])}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-300 bg-gray-100 font-semibold">
                        <td className="py-2.5 px-3" colSpan={3}>รวมทั้งหมด ({branchSummary.length} สาขา)</td>
                        {cfg.branchCols.map(c => (
                          <td key={c.key} className={`py-2.5 px-3 text-right ${c.cls}`}>
                            {c.key === 'margin'
                              ? totals.revenue > 0 ? `${((totals.gp / totals.revenue) * 100).toFixed(1)}%` : '0%'
                              : c.format(totals[c.key as keyof typeof totals] as number)}
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Invoice Tab — columns specific to this KPI */
            <div>
              <p className="text-xs text-gray-400 mb-3">
                แสดงรายการ Invoice (สูงสุด 200 รายการ) เรียงตาม{cfg.invoiceSortLabel}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-3 font-semibold text-gray-600">#</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-600">Invoice</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-600">วันที่</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-600">สาขา</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-600">ลูกค้า</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-600">ระดับ</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-600">ชำระเงิน</th>
                      {cfg.invoiceCols.map(c => (
                        <th key={c.key} className="text-right py-3 px-3 font-semibold text-gray-600">{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceList.map((inv: any, i: number) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-blue-50 transition-colors">
                        <td className="py-2.5 px-3 text-gray-400">{i + 1}</td>
                        <td className="py-2.5 px-3 font-mono text-xs text-blue-600 font-medium">{inv.invoice_no}</td>
                        <td className="py-2.5 px-3 text-xs text-gray-500">
                          {inv.full_date ? new Date(inv.full_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '-'}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="text-xs font-medium text-gray-700">{inv.branch_name}</div>
                          <div className="text-[10px] text-gray-400">{inv.region_name}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="text-xs text-gray-700">{inv.customer_name || '-'}</div>
                          <div className="text-[10px] text-gray-400">{inv.member_code || ''}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            inv.loyalty_tier === 'GOLD' ? 'bg-yellow-100 text-yellow-700' :
                            inv.loyalty_tier === 'SILVER' ? 'bg-gray-100 text-gray-600' :
                            inv.loyalty_tier === 'PLATINUM' ? 'bg-purple-100 text-purple-700' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            {inv.loyalty_tier || 'STANDARD'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-gray-500">{inv.payment_method_name || '-'}</td>
                        {cfg.invoiceCols.map(c => (
                          <td key={c.key} className={`py-2.5 px-3 text-right ${c.cls}`}>{c.format(inv[c.key])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
