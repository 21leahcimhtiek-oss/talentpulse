'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [loading, setLoading] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setStatus(error ? 'error' : 'sent');
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Reset Password</h1>
          <p className="text-slate-500 mt-2">We will send you a reset link</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {status === 'sent' ? (
            <div className="text-center">
              <p className="text-green-700 bg-green-50 px-4 py-3 rounded-lg">Check your email for a reset link.</p>
              <Link href="/login" className="mt-4 block text-sm text-primary-600 hover:underline">Back to login</Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="you@company.com"
                />
              </div>
              {status === 'error' && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">Failed to send. Try again.</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors"
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
              <Link href="/login" className="block text-center text-sm text-slate-500 hover:text-primary-600">Back to login</Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}