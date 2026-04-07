'use client';
import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { AlertTriangle, DollarSign, Clock, FileWarning } from 'lucide-react';
import KpiCard from '@/components/KpiCard';
import ChartCard from '@/components/ChartCard';
import DateRangeFilter, { toDateKey } from '@/components/DateRangeFilter';
import Loading from '@/components/Loading';
import { api } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = { OPEN: '#f59e0b', APPROVED: '#10b981', REJECTED: '#ef4444', CLOSED: '#3b82f6' };
const REASON_COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ClaimPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-04-06');

  const fetchData = useCallback((from: string, to: string) => {
    setLoading(true);
    api.claimSummary(toDateKey(from), toDateKey(to))
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

  const { overview, byStatus: rawByStatus, byReason: rawByReason, trend: rawTrend } = data;
  const byStatus = (rawByStatus || []).map((r: any) => ({ ...r, count: Number(r.count) || 0 }));
  const byReason = (rawByReason || []).map((r: any) => ({ ...r, count: Number(r.count) || 0, amount: Number(r.amount) || 0 }));
  const trend = (rawTrend || []).map((r: any) => ({ ...r, claims: Number(r.claims) || 0, amount: Number(r.amount) || 0 }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">เคลมและการรับประกัน</h1>
          <p className="text-sm text-gray-500 mt-1">Claim & Warranty Analytics</p>
        </div>
        <DateRangeFilter from={dateFrom} to={dateTo} onChange={handleDateChange} loading={loading} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="เคลมทั้งหมด" value={formatNumber(overview.total_claims)} icon={<AlertTriangle className="w-6 h-6" />} color="orange" />
        <KpiCard title="มูลค่าเคลมรวม" value={formatCurrency(overview.total_amount)} icon={<DollarSign className="w-6 h-6" />} color="red" />
        <KpiCard title="เวลาแก้ไขเฉลี่ย" value={`${parseInt(overview.avg_resolution)} นาที`} icon={<Clock className="w-6 h-6" />} color="blue" />
        <KpiCard title="เคลมค้าง (Open)" value={formatNumber(overview.open_count)} icon={<FileWarning className="w-6 h-6" />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="สถานะเคลม">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={byStatus} cx="50%" cy="45%" outerRadius={85} dataKey="count" nameKey="claim_status"
                label={({ x, y, claim_status, percent }: any) => (
                  <text x={x} y={y} textAnchor={x > 0 ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fill="#374151">
                    {`${claim_status} ${((percent || 0) * 100).toFixed(0)}%`}
                  </text>
                )}>
                {byStatus.map((entry: any, i: number) => <Cell key={i} fill={STATUS_COLORS[entry.claim_status] || '#94a3b8'} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="สาเหตุการเคลม">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byReason} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" fontSize={12} />
              <YAxis type="category" dataKey="claim_reason_code" fontSize={12} width={110} />
              <Tooltip formatter={(value: any, name: any) => name === 'amount' ? formatCurrency(value) : formatNumber(value)} />
              <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} name="จำนวน" />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="แนวโน้มเคลมรายเดือน">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month_no" tickFormatter={v => `เดือน ${v}`} fontSize={12} />
            <YAxis yAxisId="left" fontSize={12} />
            <YAxis yAxisId="right" orientation="right" fontSize={12} />
            <Tooltip formatter={(value: any, name: any) => name === 'มูลค่า' ? formatCurrency(value) : formatNumber(value)} />
            <Bar yAxisId="left" dataKey="claims" fill="#3b82f6" radius={[6, 6, 0, 0]} name="จำนวน" />
            <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={2} name="มูลค่า" dot={{ r: 4 }} />
            <Legend />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
