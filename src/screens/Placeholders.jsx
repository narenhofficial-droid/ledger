export function Recent()     { return <Placeholder title="Recent"     hint="Phase 3 — chronological list, filters, edit/delete" />; }
export function Categories() { return <Placeholder title="Spend"      hint="Phase 4 — donut chart + category breakdown" />; }
export function Trends()     { return <Placeholder title="Trends"     hint="Phase 8 — 6-month line chart + month-on-month change" />; }
export function Autopays()   { return <Placeholder title="Autopays"   hint="Phase 5 — calendar + recurring engine" />; }
export function Lending()    { return <Placeholder title="Lending"    hint="Phase 6 — lent / borrowed tabs" />; }
export function Budgets()    { return <Placeholder title="Budgets"    hint="Phase 7 — limits + alerts" />; }
export function Reports()    { return <Placeholder title="Reports"    hint="Phase 8 — month-end summary + CSV export" />; }
export function Settings()   { return <Placeholder title="Settings"   hint="Phase 9 — notifications + preferences" />; }

function Placeholder({ title, hint }) {
  return (
    <div className="max-w-md mx-auto px-5 pt-safe pt-6">
      <div className="text-xs text-ink-400 uppercase tracking-widest">Coming next</div>
      <h1 className="font-display text-3xl text-ink-50 mt-1">{title}</h1>
      <p className="mt-4 text-sm text-ink-500">{hint}</p>
    </div>
  );
}
