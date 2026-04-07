'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'ðŸ ' },
  { href: '/employees', label: 'Employees', icon: 'ðŸ‘¥' },
  { href: '/okrs', label: 'OKRs', icon: 'ðŸŽ¯' },
  { href: '/reviews', label: 'Reviews', icon: 'ðŸ“‹' },
  { href: '/coaching', label: 'Coaching', icon: 'ðŸ§ ' },
  { href: '/team-health', label: 'Team Health', icon: 'â¤ï¸' },
  { href: '/billing', label: 'Billing', icon: 'ðŸ’³' },
  { href: '/settings', label: 'Settings', icon: 'âš™ï¸' },
];

interface SidebarProps {
  profile: { full_name?: string; email?: string; role?: string } | null;
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen">
      <div className="px-6 py-5 border-b border-slate-100">
        <span className="text-lg font-bold text-primary-700">TalentPulse</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
            {profile?.full_name?.charAt(0) ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{profile?.full_name ?? 'User'}</p>
            <p className="text-xs text-slate-400 truncate">{profile?.role ?? 'member'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}