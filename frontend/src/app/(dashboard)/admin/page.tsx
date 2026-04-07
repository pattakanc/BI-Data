'use client';
import { useState, useEffect } from 'react';
import { Database, Users, Activity, AlertTriangle } from 'lucide-react';
import KpiCard from '@/components/KpiCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import Loading from '@/components/Loading';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';

export default function AdminPage() {
  const [dbStats, setDbStats] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.adminDbStats().then(res => { if (res.success) setDbStats(res.data); }),
      api.adminUsers().then(res => { if (res.success) setUsers(res.data); }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  const totalRows = dbStats.reduce((sum: number, t: any) => sum + parseInt(t.row_count || 0), 0);
  const schemas = [...new Set(dbStats.map((t: any) => t.schemaname))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin / DataOps</h1>
        <p className="text-sm text-gray-500 mt-1">ข้อมูลระบบและการจัดการ</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="จำนวน Tables" value={formatNumber(dbStats.length)} icon={<Database className="w-6 h-6" />} color="blue" />
        <KpiCard title="จำนวน Schemas" value={formatNumber(schemas.length)} icon={<Activity className="w-6 h-6" />} color="green" />
        <KpiCard title="จำนวน Rows ทั้งหมด" value={formatNumber(totalRows)} icon={<Database className="w-6 h-6" />} color="purple" />
        <KpiCard title="จำนวนผู้ใช้" value={formatNumber(users.length)} icon={<Users className="w-6 h-6" />} color="orange" />
      </div>

      <ChartCard title="สถิติ Database" subtitle="จำนวนข้อมูลในแต่ละตาราง">
        <DataTable
          columns={[
            { key: 'schemaname', label: 'Schema', render: (v: string) => <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">{v}</span> },
            { key: 'table_name', label: 'Table', render: (v: string) => <span className="font-mono text-xs">{v}</span> },
            { key: 'row_count', label: 'Rows', align: 'right' as const, render: (v: any) => formatNumber(parseInt(v || 0)) },
          ]}
          data={dbStats}
        />
      </ChartCard>

      {users.length > 0 && (
        <ChartCard title="ผู้ใช้ในระบบ" subtitle="User Management">
          <DataTable
            columns={[
              { key: 'username', label: 'Username', render: (v: string) => <span className="font-medium">{v}</span> },
              { key: 'full_name', label: 'ชื่อ' },
              { key: 'email', label: 'Email' },
              { key: 'roles', label: 'Roles', render: (v: string[]) => (
                <div className="flex flex-wrap gap-1">
                  {v?.filter(Boolean).map((r: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">{r}</span>
                  ))}
                </div>
              )},
              { key: 'status', label: 'สถานะ', render: (v: string) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${v === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{v}</span>
              )},
            ]}
            data={users}
          />
        </ChartCard>
      )}
    </div>
  );
}
