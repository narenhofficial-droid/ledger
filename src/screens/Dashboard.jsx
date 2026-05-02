import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Target, FileText, Settings } from 'lucide-react';
import { useExpenses } from '../hooks/useExpenses';
import { useIncomes } from '../hooks/useIncomes';
import { useCategories } from '../hooks/useCategories';
import { useUpcomingAutopays } from '../hooks/useAutopays';
import { thisMonthRange, todayRange, format, relativeDay } from '../lib/dates';
import { formatINR } from '../lib/format';
import { AddExpenseModal } from '../components/expense/AddExpenseModal';
import { AddIncomeModal } from '../components/income/AddIncomeModal';
import { Fab } from '../components/shell/Fab';

export function Dashboard({ user, onSignOut }) {
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const navigate = useNavigate();

  const monthRange = thisMonthRange();
  const monthExpenses = useExpenses(user.id, monthRange);
  const todayExpenses = useExpenses(user.id, todayRange());
  const monthIncomes = useIncomes(user.id, monthRange);
  const categories = useCategories(user.id);
  const upcoming = useUpcomingAutopays(user.id, 7);

  const monthSpend  = useMemo(() => monthExpenses.reduce((s, e) => s + Number(e.amount), 0), [monthExpenses]);
  const todaySpend  = useMemo(() => todayExpenses.reduce((s, e) => s + Number(e.amount), 0), [todayExpenses]);
  const monthIncome = useMemo(() => monthIncomes.reduce((s, e) => s + Number(e.amount), 0), [monthIncomes]);
  const leftToSpend = monthIncome - monthSpend;

  const topCategories = useMemo(() => {
    const byCat = new Map();
    for (const e of monthExpenses)
      byCat.set(e.category_id, (byCat.get(e.category_id) ?? 0) + Number(e.amount));
    return Array.from(byCat.entries())
      .map(([id, total]) => {
        const cat = categories.find(c => c.id === id);
        return { id, total, name: cat?.name ?? '—', icon: cat?.icon ?? '•', color: cat?.color ?? '#666' };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  }, [monthExpenses, categories]);

  const monthLabel = format(new Date(), 'MMMM yyyy');

  const quickLinks = [
    { label: 'Trends',   icon: TrendingUp, path: '/trends',   hint: '6-month view' },
    { label: 'Budgets',  icon: Target,     path: '/budgets',  hint: 'Monthly limits' },
    { label: 'Reports',  icon: FileText,   path: '/reports',  hint: 'Export & review' },
    { label: 'Settings', icon: Settings,   path: '/settings', hint: 'Prefs & sign out' },
  ];

  return (
    <div className="max-w-md mx-auto px-5 pt-safe pt-4">
      {/* Header */}
      <div className="flex items-center justify-between py-3">
        <div>
          <div className="text-xs text-ink-400 uppercase tracking-widest">Ledger</div>
          <div className="font-display text-lg text-ink-100">{monthLabel}</div>
        </div>
        <button onClick={() => navigate('/settings')} className="text-ink-500 hover:text-ink-300 transition p-1">
          <Settings size={18} />
        </button>
      </div>

      {/* Hero — month spend */}
      <div className="mt-4 mb-2">
        <div className="text-[11px] uppercase tracking-widest text-ink-500">Spent this month</div>
        <div className="mt-2 inline-block gold-underline">
          <div className="amount font-display text-5xl font-medium text-ink-50">{formatINR(monthSpend)}</div>
        </div>
      </div>

      {/* Stats — Income card is tappable to add income */}
      <div className="mt-7 grid grid-cols-3 gap-3">
        <button
          onClick={() => setIncomeOpen(true)}
          className="bg-ink-900/60 border border-ink-800 rounded-2xl px-3 py-3 text-left hover:border-gold-500/30 transition active:scale-[0.97]"
        >
          <div className="text-[10px] uppercase tracking-widest text-ink-500">Income</div>
          <div className="amount mt-1 text-base font-medium text-ink-200">
            {monthIncome > 0 ? formatINR(monthIncome) : <span className="text-ink-600 text-sm">+ Add</span>}
          </div>
        </button>
        <Stat label="Left"  value={formatINR(leftToSpend)} tone={leftToSpend < 0 ? 'danger' : 'gold'} />
        <Stat label="Today" value={formatINR(todaySpend)}  tone="muted" />
      </div>

      {/* Top categories */}
      {topCategories.length > 0 && (
        <Section title="Top spending">
          <div className="space-y-2">
            {topCategories.map(c => {
              const pct = monthSpend > 0 ? Math.round((c.total / monthSpend) * 100) : 0;
              return (
                <div key={c.id} className="bg-ink-900/60 border border-ink-800 rounded-2xl p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{c.icon}</span>
                      <span className="text-sm text-ink-100">{c.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="amount text-ink-50 font-medium">{formatINR(c.total)}</div>
                      <div className="text-xs text-ink-500">{pct}%</div>
                    </div>
                  </div>
                  <div className="mt-2 h-1 bg-ink-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Upcoming autopays */}
      {upcoming.length > 0 && (
        <Section title="Upcoming this week">
          <div className="space-y-2">
            {upcoming.map(a => (
              <div key={a.id} className="flex items-center justify-between bg-ink-900/60 border border-ink-800 rounded-2xl px-4 py-3">
                <div>
                  <div className="text-sm text-ink-100">{a.name}</div>
                  <div className="text-xs text-ink-500">{relativeDay(a.next_charge_date)}</div>
                </div>
                <div className="amount text-ink-50">{formatINR(a.amount)}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Empty state */}
      {monthExpenses.length === 0 && monthIncome === 0 && (
        <div className="mt-12 text-center text-ink-500">
          <div className="text-4xl mb-3">🪙</div>
          <div className="text-sm">Nothing logged yet this month.</div>
          <div className="text-xs mt-1">Tap <span className="text-ink-300">Income</span> to add earnings · <span className="text-gold-500">+</span> to log expenses.</div>
        </div>
      )}

      {/* Quick links */}
      <Section title="More">
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map(({ label, icon: Icon, path, hint }) => (
            <button key={path} onClick={() => navigate(path)}
              className="bg-ink-900/60 border border-ink-800 rounded-2xl p-4 text-left hover:border-ink-600 transition active:scale-[0.97]">
              <Icon size={18} className="text-gold-400 mb-2" strokeWidth={1.75} />
              <div className="text-sm text-ink-100 font-medium">{label}</div>
              <div className="text-xs text-ink-500 mt-0.5">{hint}</div>
            </button>
          ))}
        </div>
      </Section>

      <div className="h-8" />
      <Fab onClick={() => setExpenseOpen(true)} />
      <AddExpenseModal open={expenseOpen} onClose={() => setExpenseOpen(false)} userId={user.id} />
      <AddIncomeModal  open={incomeOpen}  onClose={() => setIncomeOpen(false)}  userId={user.id} />
    </div>
  );
}

function Stat({ label, value, tone = 'muted' }) {
  const toneCls = { muted: 'text-ink-200', gold: 'text-gold-400', danger: 'text-danger' }[tone];
  return (
    <div className="bg-ink-900/60 border border-ink-800 rounded-2xl px-3 py-3">
      <div className="text-[10px] uppercase tracking-widest text-ink-500">{label}</div>
      <div className={`amount mt-1 text-base font-medium ${toneCls}`}>{value}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mt-7">
      <div className="text-[11px] uppercase tracking-widest text-ink-500 mb-3">{title}</div>
      {children}
    </div>
  );
}
