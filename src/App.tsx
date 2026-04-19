import { useState, useEffect } from 'react';
import { AuthProvider } from './lib/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PassLab from './pages/PassLab';
import Billing from './pages/Billing';
import BillingReturn from './pages/BillingReturn';
import BillingCancel from './pages/BillingCancel';
import { useSubscription } from './lib/useSubscription';
import { useAuth } from './lib/AuthContext';

export function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * PassLabGate — redirects unsubscribed users to /billing. Mounted only when
 * the user visits /pass-lab so we don't query the status endpoint on every
 * page.
 */
function PassLabGate() {
  const { user, loading: authLoading } = useAuth();
  const { hasActive, loading: subLoading } = useSubscription();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login?next=/pass-lab');
      return;
    }
    if (!subLoading && !hasActive) {
      navigate('/billing');
    }
  }, [user, authLoading, subLoading, hasActive]);

  if (authLoading || subLoading || !user || !hasActive) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 bg-gray-950">
        جارٍ التحميل...
      </div>
    );
  }
  return <PassLab />;
}

function Router() {
  const [route, setRoute] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  if (route === '/login') return <Login />;
  if (route === '/signup') return <Signup />;
  if (route === '/pass-lab') return <PassLabGate />;
  if (route === '/billing') return <Billing />;
  if (route === '/billing/return') return <BillingReturn />;
  if (route === '/billing/cancel') return <BillingCancel />;
  return <Home />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
