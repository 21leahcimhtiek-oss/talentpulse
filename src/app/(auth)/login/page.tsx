'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  }

  async function handleMagicLink() {
    if (!email) { setError('Enter your email first.'); return; }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) setError(error.message);
    else setError('Check your email for a magic link.');
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">TalentPulse</h1>
          <p className="text-slate-500 mt-2">Sign in to your account</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              />
            </div>
            {error && (
              <p className={`text-sm px-3 py-2 rounded-lg ${error.includes('Check your email') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Signing inâ€¦' : 'Sign In'}
            </button>
          </form>
          <div className="mt-4">
            <button
              onClick={handleMagicLink}
              disabled={loading}
              className="w-full py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors text-sm"
            >
              Send magic link
            </button>
          </div>
          <div className="mt-6 flex justify-between text-sm text-slate-500">
            <Link href="/reset-password" className="hover:text-primary-600">Forgot password?</Link>
            <Link href="/signup" className="hover:text-primary-600">Create account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}