'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  BarChart3, TrendingUp, Building2, Package, Users, Wrench,
  ShieldCheck, GraduationCap, AlertTriangle, Settings, LogOut,
  ChevronLeft, ChevronRight, LayoutDashboard
} from 'lucide-react';

const menuItems = [
  { href: '/executive', label: 'Executive Summary', icon: BarChart3, roles: ['CEO', 'HQ_EXEC', 'HQ_ADMIN', 'SYS_ADMIN'] },
  { href: '/sales', label: 'ยอดขายและรายได้', icon: TrendingUp, roles: ['CEO', 'HQ_EXEC', 'HQ_ADMIN', 'MANAGER', 'BUSINESS', 'SALES', 'BRANCH_MGR', 'SYS_ADMIN'] },
  { href: '/branch', label: 'ผลงานสาขา', icon: Building2, roles: ['CEO', 'HQ_EXEC', 'HQ_ADMIN', 'MANAGER', 'BRANCH_MGR', 'BRANCH', 'SYS_ADMIN'] },
  { href: '/inventory', label: 'สต็อกสินค้า', icon: Package, roles: ['CEO', 'HQ_EXEC', 'HQ_ADMIN', 'MANAGER', 'BUSINESS', 'BRANCH_MGR', 'SYS_ADMIN'] },
  { href: '/customer', label: 'ลูกค้าและ CRM', icon: Users, roles: ['CEO', 'HQ_EXEC', 'HQ_ADMIN', 'MANAGER', 'SALES', 'CS', 'CONSULTANT', 'SYS_ADMIN'] },
  { href: '/service', label: 'งานบริการ', icon: Wrench, roles: ['CEO', 'HQ_EXEC', 'HQ_ADMIN', 'MANAGER', 'BRANCH_MGR', 'TECHNICIAN', 'SYS_ADMIN'] },
  { href: '/audit', label: 'ตรวจสอบคุณภาพ', icon: ShieldCheck, roles: ['CEO', 'HQ_EXEC', 'HQ_ADMIN', 'MANAGER', 'BRANCH_MGR', 'CONSULTANT', 'SYS_ADMIN'] },
  { href: '/learning', label: 'การเรียนรู้', icon: GraduationCap, roles: ['CEO', 'HQ_EXEC', 'HQ_ADMIN', 'MANAGER', 'BRANCH_MGR', 'TECHNICIAN', 'SYS_ADMIN'] },
  { href: '/claim', label: 'เคลมและรับประกัน', icon: AlertTriangle, roles: ['CEO', 'HQ_EXEC', 'HQ_ADMIN', 'MANAGER', 'CS', 'CONSULTANT', 'SYS_ADMIN'] },
  { href: '/admin', label: 'Admin / DataOps', icon: Settings, roles: ['SYS_ADMIN', 'HQ_ADMIN'] },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const userRoles = user?.roles || [];

  const filteredMenu = menuItems.filter(item => item.roles.some(r => userRoles.includes(r)));

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col transition-all duration-300 min-h-screen`}>
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-slate-700/50">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
          <LayoutDashboard className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="font-bold text-sm leading-tight">BI DataAnalytic</h1>
            <p className="text-[10px] text-slate-400">AutoFast Ecosystem</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {filteredMenu.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'}`}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-700/50">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium truncate">{user.fullName}</p>
            <p className="text-[10px] text-slate-400 truncate">{user.roleNames?.[0] || user.roles?.[0]}</p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-colors w-full">
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>ออกจากระบบ</span>}
          </button>
          <button onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors flex-shrink-0">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
