'use client';
import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { DollarSign, TrendingUp, Users, ShoppingCart, Activity, Building2 } from 'lucide-react';
import KpiCard from '@/components/KpiCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import DateRangeFilter, { toDateKey } from '@/components/DateRangeFilter';
import Loading from '@/components/Loading';
import { api } from '@/lib/api';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export default function ExecutivePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-04-06');

  const fetchData = useCallback((from: string, to: string) => {
    setLoading(true);
    api.executiveSummary(toDateKey(from), toDateKey(to))
      .then(res => { if (res.success) setData(res.data); })
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
  if (!data) return <div className="text-center py-20 text-gray-400">ไม่สามารถโหลดข้อมูลได้</div>;

  const { today, mtd, ytd, branchRanking: rawBranch, trend: rawTrend } = data;
  const trend = (rawTrend || []).map((r: any) => ({ ...r, revenue_amount: Number(r.revenue_amount) || 0, gross_profit_amount: Number(r.gross_profit_amount) || 0 }));
  const branchRanking = (rawBranch || []).map((r: any) => ({ ...r, total_sales: Number(r.total_sales) || 0, total_gp: Number(r.total_gp) || 0, avg_margin: Number(r.avg_margin) || 0, total_invoices: Number(r.total_invoices) || 0, total_customers: Number(r.total_customers) || 0 }));
  const top10 = branchRanking.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Summary</h1>
          <p className="text-sm text-gray-500 mt-1">ภาพรวมธุรกิจ AutoFast</p>
        </div>
        <DateRangeFilter from={dateFrom} to={dateTo} onChange={handleDateChange} loading={loading} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="รายได้วันนี้" value={formatCurrency(today.revenue)} icon={<DollarSign className="w-6 h-6" />} color="blue" />
        <KpiCard title="GP วันนี้" value={formatCurrency(today.grossProfit)} icon={<TrendingUp className="w-6 h-6" />} color="green" />
        <KpiCard title="Margin" value={formatPercent(today.margin)} icon={<Activity className="w-6 h-6" />} color="purple" />
        <KpiCard title="รายได้ช่วงเลือก" value={formatCurrency(mtd.revenue)} icon={<DollarSign className="w-6 h-6" />} color="orange" change={mtd.growth} />
        <KpiCard title="บิลช่วงเลือก" value={formatNumber(mtd.invoices)} icon={<ShoppingCart className="w-6 h-6" />} color="red" />
        <KpiCard title="ลูกค้าช่วงเลือก" value={formatNumber(mtd.customers)} icon={<Users className="w-6 h-6" />} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="แนวโน้มรายได้รายวัน" subtitle="Daily Revenue & GP Trend">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="full_date" tickFormatter={(v: any) => new Date(v).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} fontSize={11} />
              <YAxis fontSize={11} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => formatCurrency(v)} labelFormatter={(l: any) => new Date(l).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })} />
              <Line type="monotone" dataKey="revenue_amount" stroke="#3b82f6" strokeWidth={2} dot={false} name="รายได้" />
              <Line type="monotone" dataKey="gross_profit_amount" stroke="#10b981" strokeWidth={2} dot={false} name="กำไรขั้นต้น" />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 10 สาขา ยอดขายสูงสุด" subtitle="Branch Ranking by Sales">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={top10} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" fontSize={11} tickFormatter={(v: any) => `${(v / 1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="branch_name" fontSize={10} width={100} />
              <Tooltip formatter={(v: any) => formatCurrency(v)} />
              <Bar dataKey="total_sales" radius={[0, 6, 6, 0]} name="ยอดขาย">
                {top10.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <KpiCard title="รายได้ YTD" value={formatCurrency(ytd.revenue)} icon={<DollarSign className="w-6 h-6" />} color="blue" subtitle="Year to Date" />
        <KpiCard title="GP YTD" value={formatCurrency(ytd.grossProfit)} icon={<TrendingUp className="w-6 h-6" />} color="green" subtitle="Year to Date" />
        <KpiCard title="สาขา Active" value={formatNumber(today.activeBranches)} icon={<Building2 className="w-6 h-6" />} color="purple" subtitle="สาขาที่มียอดขายวันนี้" />
      </div>

      <ChartCard title="รายละเอียดสาขา" subtitle="Branch Details">
        <DataTable
          columns={[
            { key: 'branch_name', label: 'สาขา' },
            { key: 'region_name', label: 'ภูมิภาค' },
            { key: 'total_sales', label: 'ยอดขาย', align: 'right' as const, render: (v: any) => formatCurrency(v) },
            { key: 'total_gp', label: 'กำไรขั้นต้น', align: 'right' as const, render: (v: any) => formatCurrency(v) },
            { key: 'avg_margin', label: 'Margin', align: 'right' as const, render: (v: any) => formatPercent(v) },
            { key: 'total_invoices', label: 'บิล', align: 'right' as const, render: (v: any) => formatNumber(v) },
            { key: 'total_customers', label: 'ลูกค้า', align: 'right' as const, render: (v: any) => formatNumber(v) },
          ]}
          data={branchRanking}
        />
      </ChartCard>
    </div>
  );
}
