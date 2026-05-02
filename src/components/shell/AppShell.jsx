import { NavLink, Outlet } from 'react-router-dom';
import { Home, List, PieChart, Calendar, Wallet } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

const tabs = [
  { to: '/',           label: 'Home',    icon: Home },
  { to: '/recent',     label: 'Recent',  icon: List },
  { to: '/categories', label: 'Spend',   icon: PieChart },
  { to: '/autopays',   label: 'Autopay', icon: Calendar },
  { to: '/lending',    label: 'Lending', icon: Wallet },
];

export function AppShell() {
  const online = useOnlineStatus();

  return (
    <div className="min-h-screen flex flex-col bg-ink-950">
      {!online && (
        <div className="bg-warn/15 text-warn text-xs text-center py-1.5 border-b border-warn/20">
          Offline — changes sync when you're back online.
        </div>
      )}
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-ink-900/95 backdrop-blur-md border-t border-ink-800 pb-safe">
        <div className="max-w-md mx-auto grid grid-cols-5">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2.5 text-[11px] transition ${
                  isActive ? 'text-gold-400' : 'text-ink-400'
                }`
              }
            >
              <Icon size={20} strokeWidth={1.75} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
