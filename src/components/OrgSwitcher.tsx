'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Org {
  id: string;
  name: string;
}

export default function OrgSwitcher() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [currentOrg, setCurrentOrg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('profiles')
        .select('org_id, organizations(id, name)')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          const orgData = data as { org_id?: string; organizations?: Org | Org[] | null } | null;
          if (orgData?.organizations) {
            const orgsArr = Array.isArray(orgData.organizations) ? orgData.organizations : [orgData.organizations];
            setOrgs(orgsArr);
            setCurrentOrg(orgData.org_id ?? null);
          }
        });
    });
  }, []);

  if (!orgs.length) return null;

  const current = orgs.find(o => o.id === currentOrg);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors w-full"
      >
        <span className="w-5 h-5 rounded bg-primary-200 flex items-center justify-center text-xs font-bold text-primary-800">
          {current?.name.charAt(0) ?? '?'}
        </span>
        <span className="flex-1 text-left truncate">{current?.name ?? 'Select Org'}</span>
        <span className="text-slate-400 text-xs">{open ? 'â–²' : 'â–¼'}</span>
      </button>
      {open && orgs.length > 1 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
          {orgs.map(org => (
            <button
              key={org.id}
              onClick={() => { setCurrentOrg(org.id); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${org.id === currentOrg ? 'bg-primary-50 text-primary-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              {org.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}