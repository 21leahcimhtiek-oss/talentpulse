'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Target, ClipboardList,
  MessageSquare, Brain, Activity, CreditCard,
  Settings, LogOut, Zap, ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

interface SidebarProps {
  user: { email: string; role: UserRole };
  org: { name: string; plan: string; slug: string };
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const planBadgeClass: Record<string, string> = {
  starter: 'bg-gray-100 text-gray-600',
  pro: 'bg-indigo-100 text-indigo-700',
  enterprise: 'bg-purple-100 text-purple-700',
};

const navItems: NavItem[] = [
  { label: 'Dashboard',    href: '/dashboard',    icon: <LayoutDashboard size={17} />, roles: ['admin', 'manager', 'employee'] },
  { label: 'Employees',    href: '/employees',    icon: <Users size={17} />,           roles: ['admin', 'manager', 'employee'] },
  { label: 'OKRs',         href: '/okrs',         icon: <Target size={17} />,          roles: ['admin', 'manager', 'employee'] },
  { label: 'Reviews',      href: '/reviews',      icon: <ClipboardList size={17} />,   roles: ['admin', 'manager'] },
  { label: '360 Feedback', href: '/feedback',     icon: <MessageSquare size={17} />,   roles: ['admin', 'manager', 'employee'] },
  { label: 'Coaching',     href: '/coaching',     icon: <Brain size={17} />,           roles: ['admin', 'manager'] },
  { label: 'Team Health',  href: '/team-health',  icon: <Activity size={17} />,        roles: ['admin', 'manager'] },
  { label: 'Billing',      href: '/billing',      icon: <CreditCard size={17} />,      roles: ['admin'] },
  { label: 'Settings',     href: '/settings',     icon: <Settings size={17} />,        roles: ['admin', 'manager', 'employee'] },
];

export default function Sidebar({ user, org }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const visible = navItems.filter((item) => item.roles.includes(user.role));

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-white border-r border-gray-200 py-4 px-3">
      {/* Org Header */}
      <div className="px-2 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Zap size={15} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{org.name}</p>
            <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded capitalize', planBadgeClass[org.plan] || planBadgeClass.starter)}>
              {org.plan}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {visible.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors group',
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <span className={cn('flex-shrink-0 transition-colors', isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600')}>
                {item.icon}
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {isActive && <ChevronRight size={14} className="text-indigo-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="pt-3 border-t border-gray-200 mt-3 space-y-1">
        <div className="px-3 py-2">
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
          <p className="text-xs font-medium text-gray-700 capitalize">{user.role}</p>
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={17} className="text-gray-400" />
          {signingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}