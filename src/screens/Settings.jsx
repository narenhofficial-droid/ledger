import { useState } from 'react';
import { LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-gold-500' : 'bg-ink-700'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

function SettingRow({ label, hint, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-ink-800 last:border-0">
      <div>
        <div className="text-sm text-ink-100">{label}</div>
        {hint && <div className="text-xs text-ink-500 mt-0.5">{hint}</div>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

export function Settings() {
  const { user, signOut } = useAuth();

  // Local prefs (no DB write for now — can wire to settings table later)
  const [prefs, setPrefs] = useState({
    notify_daily: true,
    notify_weekly: true,
    notify_autopay: true,
    notify_budget: true,
  });

  function set(key) {
    return (val) => setPrefs(p => ({ ...p, [key]: val }));
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-safe pt-4 pb-10">
      <div className="py-3">
        <div className="text-xs text-ink-400 uppercase tracking-widest">Ledger</div>
        <div className="font-display text-lg text-ink-100">Settings</div>
      </div>

      {/* Account */}
      <div className="mt-4">
        <div className="text-[11px] uppercase tracking-widest text-ink-500 mb-3">Account</div>
        <div className="bg-ink-900/60 border border-ink-800 rounded-2xl px-4">
          <div className="py-4 border-b border-ink-800">
            <div className="text-[10px] uppercase tracking-widest text-ink-500">Signed in as</div>
            <div className="text-sm text-ink-100 mt-1">{user?.email}</div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center justify-between w-full py-4 text-danger hover:text-red-400 transition"
          >
            <div className="flex items-center gap-2">
              <LogOut size={16} />
              <span className="text-sm font-medium">Sign out</span>
            </div>
            <ChevronRight size={16} className="opacity-40" />
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="mt-7">
        <div className="text-[11px] uppercase tracking-widest text-ink-500 mb-3">Notifications</div>
        <div className="bg-ink-900/60 border border-ink-800 rounded-2xl px-4">
          <SettingRow label="Daily summary" hint="Evening recap of today's spend" value={prefs.notify_daily} onChange={set('notify_daily')} />
          <SettingRow label="Weekly report" hint="Monday morning overview" value={prefs.notify_weekly} onChange={set('notify_weekly')} />
          <SettingRow label="Autopay reminders" hint="2 days before a charge" value={prefs.notify_autopay} onChange={set('notify_autopay')} />
          <SettingRow label="Budget alerts" hint="When you hit 75% of a limit" value={prefs.notify_budget} onChange={set('notify_budget')} />
        </div>
      </div>

      {/* App info */}
      <div className="mt-7">
        <div className="text-[11px] uppercase tracking-widest text-ink-500 mb-3">About</div>
        <div className="bg-ink-900/60 border border-ink-800 rounded-2xl px-4">
          <div className="py-4 border-b border-ink-800 flex justify-between">
            <span className="text-sm text-ink-400">App</span>
            <span className="text-sm text-ink-100">Ledger</span>
          </div>
          <div className="py-4 border-b border-ink-800 flex justify-between">
            <span className="text-sm text-ink-400">Version</span>
            <span className="text-sm text-ink-100">1.0.0</span>
          </div>
          <div className="py-4 flex justify-between">
            <span className="text-sm text-ink-400">Data</span>
            <span className="text-sm text-ink-100">Offline-first · Supabase sync</span>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center text-[11px] text-ink-600">Personal · Private · Yours</div>
    </div>
  );
}
