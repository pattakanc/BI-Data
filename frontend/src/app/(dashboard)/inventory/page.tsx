'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Package, AlertTriangle, TrendingDown, DollarSign } from 'lucide-react';
import KpiCard from '@/components/KpiCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import DateRangeFilter, { toDateKey } from '@/components/DateRangeFilter';
import Loading from '@/components/Loading';
import { api } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';

const COLORS: Record<string, string> = {
  STOCK_OUT: '#ef4444',
  LOW_STOCK: '#f59e0b',
  OVERSTOCK: '#8b5cf6',
  NORMAL: '#10b981',
};

const RISK_LABELS: Record<string, string> = {
  STOCK_OUT: 'สินค้าหมด',
  LOW_STOCK: 'สต็อกต่ำ',
  OVERSTOCK: 'สต็อกเกิน',
  NORMAL: 'ปกติ',
};

export default function InventoryPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-04-06');

  const fetchData = useCallback((from: string, to: string) => {
    setLoading(true);
    api.inventorySummary(toDateKey(from), toDateKey(to))
      .then((res: any) => { if (res.success) setData(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(dateFrom, dateTo); }, []);

  const handleDateChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    fetchData(from, to);
  };

  if (loading && !data) return <Loading />;
  if (!data) return <div className="text-center text-gray-400 py-20">ไม่สามารถโหลดข้อมูลได้</div>;

  const riskDistribution: any[] = data.riskSummary || [];
  const topBranches: any[] = data.topStockValue || [];
  const lowStockItems: any[] = data.lowStockItems || [];

  const ov = data.overview || {};
  const totalProducts = Number(ov.total_products) || 0;
  const totalBranches = Number(ov.total_branches) || 0;
  const totalStockValue = Number(ov.total_stock_value) || 0;
  const totalQty = Number(ov.total_qty) || 0;

  const riskChartData = riskDistribution.map((r: any) => ({
    ...r,
    count: Number(r.count) || 0,
    value: Number(r.value) || 0,
    name: RISK_LABELS[r.risk_level] || r.risk_level,
    fill: COLORS[r.risk_level] || '#6b7280',
  }));

  const lowStockColumns = [
    { key: 'branch_name', label: 'สาขา' },
    { key: 'product_name', label: 'สินค้า' },
    { key: 'category_name', label: 'หมวดหมู่' },
    { key: 'available_qty', label: 'จำนวนคงเหลือ', align: 'right' as const, render: (v: any) => formatNumber(v) },
    { key: 'stock_value', label: 'มูลค่าสต็อก', align: 'right' as const, render: (v: any) => formatCurrency(v) },
    {
      key: 'risk_level',
      label: 'ระดับความเสี่ยง',
      align: 'center' as const,
      render: (v: string) => {
        const color = v === 'STOCK_OUT' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700';
        const label = RISK_LABELS[v] || v;
        return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">สต็อกสินค้า</h1>
          <p className="text-sm text-gray-500 mt-1">Inventory Analytics</p>
        </div>
        <DateRangeFilter from={dateFrom} to={dateTo} onChange={handleDateChange} loading={loading} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="จำนวนสินค้า" value={formatNumber(totalProducts)} subtitle="Total Products" icon={<Package className="w-6 h-6" />} color="blue" />
        <KpiCard title="จำนวนสาขา" value={formatNumber(totalBranches)} subtitle="Total Branches" icon={<AlertTriangle className="w-6 h-6" />} color="orange" />
        <KpiCard title="มูลค่าสต็อกรวม" value={formatCurrency(totalStockValue)} subtitle="Total Stock Value" icon={<DollarSign className="w-6 h-6" />} color="green" />
        <KpiCard title="จำนวนสต็อกรวม" value={formatNumber(totalQty)} subtitle="Total Qty" icon={<TrendingDown className="w-6 h-6" />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="สัดส่วนระดับความเสี่ยงสต็อก" subtitle="Risk Level Distribution">
          <div style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskChartData} dataKey="count" nameKey="name" cx="50%" cy="45%" outerRadius={85}
                  label={({ x, y, name, percent }: any) => (
                    <text x={x} y={y} textAnchor={x > 0 ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fill="#374151">
                      {`${name} ${((percent || 0) * 100).toFixed(1)}%`}
                    </text>
                  )}>
                  {riskChartData.map((entry: any, i: number) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="สาขาที่มีมูลค่าสต็อกสูงสุด" subtitle="Top Branches by Stock Value">
          <div style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topBranches} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v: any) => formatCurrency(v)} />
                <YAxis type="category" dataKey="branch_name" tick={{ fontSize: 12 }} width={120} />
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                <Bar dataKey="value" name="มูลค่าสต็อก" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="รายการสินค้าสต็อกต่ำ / หมด" subtitle="Low Stock & Stock Out Items">
        <DataTable columns={lowStockColumns} data={lowStockItems} maxRows={20} />
      </ChartCard>
    </div>
  );
}
