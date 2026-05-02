import { useState } from 'react';
import { Button } from '../components/ui/Button';

export function SignIn({ onSignIn }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!email || !email.includes('@')) {
      setError('Enter a valid email');
      return;
    }
    setLoading(true); setError('');
    const { error } = await onSignIn(email);
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-6 py-16 bg-ink-950">
      <div className="flex-1 flex flex-col items-center justify-center text-center w-full max-w-xs">
        <div className="text-[10px] uppercase tracking-[0.3em] text-gold-500/70 mb-3">
          Personal · Private · Yours
        </div>
        <h1 className="font-display text-5xl text-ink-50 leading-tight">Ledger</h1>
        <div className="mt-3 inline-block gold-underline">
          <span className="text-ink-400 text-sm">a quiet place for your money</span>
        </div>

        {!sent ? (
          <>
            <p className="mt-12 text-ink-400 text-sm leading-relaxed">
              Enter your email — we'll send you a magic link to sign in.
            </p>
            <div className="w-full mt-6">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="you@example.com"
                className="w-full h-12 px-4 bg-ink-900 border border-ink-700 rounded-xl text-ink-50 text-center placeholder:text-ink-600 focus:outline-none focus:border-gold-500/50"
              />
              {error && <div className="text-danger text-xs mt-2">{error}</div>}
              <Button onClick={handleSubmit} disabled={loading} size="lg" className="w-full mt-3">
                {loading ? 'Sending…' : 'Send magic link'}
              </Button>
            </div>
          </>
        ) : (
          <div className="mt-12 animate-fade-in">
            <div className="text-4xl mb-4">✉️</div>
            <p className="text-ink-100 text-base leading-relaxed">Check your email.</p>
            <p className="text-ink-400 text-sm mt-2 leading-relaxed">
              Tap the link we sent to <span className="text-ink-100">{email}</span>. You can close this tab.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(''); }}
              className="mt-6 text-xs text-ink-500 underline"
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
      <div className="text-[11px] text-ink-500 text-center">Single user · End-to-end yours</div>
    </div>
  );
}
