import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AppShell } from './components/shell/AppShell';
import { SignIn } from './screens/SignIn';
import { Dashboard } from './screens/Dashboard';
import { Recent } from './screens/Recent';
import { Categories } from './screens/Categories';
import { Trends } from './screens/Trends';
import { Autopays } from './screens/Autopays';
import { Lending } from './screens/Lending';
import { Budgets } from './screens/Budgets';
import { Reports } from './screens/Reports';
import { Settings } from './screens/Settings';

export default function App() {
  const { user, loading, signInWithEmail, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950 text-ink-400">
        <div className="animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!user) return <SignIn onSignIn={signInWithEmail} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/"           element={<Dashboard user={user} />} />
          <Route path="/recent"     element={<Recent />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/trends"     element={<Trends />} />
          <Route path="/autopays"   element={<Autopays />} />
          <Route path="/lending"    element={<Lending />} />
          <Route path="/budgets"    element={<Budgets />} />
          <Route path="/reports"    element={<Reports />} />
          <Route path="/settings"   element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
