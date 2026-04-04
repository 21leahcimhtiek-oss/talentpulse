'use client';
import { Building2, ChevronDown, Settings, CreditCard, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface OrgSwitcherProps {
  orgName: string;
  plan: string;
  userEmail: string;
}

const planBadgeClass: Record<string, string> = {
  starter: 'bg-gray-100 text-gray-500',
  pro: 'bg-indigo-100 text-indigo-600',
  enterprise: 'bg-purple-100 text-purple-600',
};

export default function OrgSwitcher({ orgName, plan, userEmail }: OrgSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <Building2 size={12} className="text-white" />
        </div>
        <div className="text-left hidden sm:block">
          <p className="font-medium text-gray-900 text-xs leading-tight">{orgName}</p>
          <p className="text-gray-400 text-xs leading-tight truncate max-w-[140px]">{userEmail}</p>
        </div>
        <span className={`hidden sm:inline text-xs font-medium px-1.5 py-0.5 rounded capitalize ${planBadgeClass[plan] || planBadgeClass.starter}`}>
          {plan}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl border border-gray-200 shadow-lg z-50 py-1 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-900 truncate">{orgName}</p>
            <p className="text-xs text-gray-400 truncate">{userEmail}</p>
          </div>
          <div className="py-1">
            <button
              onClick={() => { setOpen(false); router.push('/settings'); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings size={15} className="text-gray-400" />
              Settings
            </button>
            <button
              onClick={() => { setOpen(false); router.push('/billing'); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <CreditCard size={15} className="text-gray-400" />
              Billing
            </button>
          </div>
          <div className="py-1 border-t border-gray-100">
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={15} className="text-red-400" />
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}