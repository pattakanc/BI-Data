'use client';
import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { Wrench, Clock, DollarSign, CheckCircle } from 'lucide-react';
import KpiCard from '@/components/KpiCard';
import ChartCard from '@/components/ChartCard';
import DateRangeFilter, { toDateKey } from '@/components/DateRangeFilter';
import Loading from '@/components/Loading';
import { api } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';

const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b'];

export default function ServicePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-04-06');

  const fetchData = useCallback((from: string, to: string) => {
    setLoading(true);
    api.serviceSummary(toDateKey(from), toDateKey(to))
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

  const { overview, statusBreakdown: rawStatus, trend: rawTrend } = data;
  const statusBreakdown = (rawStatus || []).map((r: any) => ({ ...r, count: Number(r.count) || 0 }));
  const trend = (rawTrend || []).map((r: any) => ({ ...r, jobs: Number(r.jobs) || 0, avg_turnaround: Number(r.avg_turnaround) || 0 }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">งานบริการ</h1>
          <p className="text-sm text-gray-500 mt-1">Service Operation Analytics</p>
        </div>
        <DateRangeFilter from={dateFrom} to={dateTo} onChange={handleDateChange} loading={loading} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Job Orders ทั้งหมด" value={formatNumber(overview.total_jobs)} icon={<Wrench className="w-6 h-6" />} color="blue" />
        <KpiCard title="เวลาเฉลี่ย (นาที)" value={formatNumber(overview.avg_turnaround, 0)} icon={<Clock className="w-6 h-6" />} color="orange" />
        <KpiCard title="รายได้รวม" value={formatCurrency(overview.total_revenue)} icon={<DollarSign className="w-6 h-6" />} color="green" />
        <KpiCard title="กำไรขั้นต้น" value={formatCurrency(overview.total_gp)} icon={<CheckCircle className="w-6 h-6" />} color="purple" subtitle={`บริการ ${formatCurrency(overview.service_rev)} / อะไหล่ ${formatCurrency(overview.parts_rev)}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="สถานะ Job Order" subtitle="Status Breakdown">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statusBreakdown} cx="50%" cy="45%" outerRadius={85} dataKey="count" nameKey="job_status"
                label={({ x, y, job_status, percent }: any) => (
                  <text x={x} y={y} textAnchor={x > 0 ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fill="#374151">
                    {`${job_status} ${((percent || 0) * 100).toFixed(0)}%`}
                  </text>
                )}>
                {statusBreakdown.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="แนวโน้มรายเดือน" subtitle="Monthly Trend">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month_no" tickFormatter={v => `เดือน ${v}`} fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(value: any) => formatNumber(value)} />
              <Bar dataKey="jobs" fill="#3b82f6" radius={[6, 6, 0, 0]} name="จำนวนงาน" />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Turnaround Time รายเดือน">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month_no" tickFormatter={v => `เดือน ${v}`} fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip formatter={(value: any) => `${parseFloat(value).toFixed(0)} นาที`} />
            <Line type="monotone" dataKey="avg_turnaround" stroke="#f59e0b" strokeWidth={3} name="เวลาเฉลี่ย (นาที)" dot={{ r: 5 }} />
            <Legend />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
