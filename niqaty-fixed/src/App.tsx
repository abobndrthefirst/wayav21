import { useState, useEffect } from "react";
import { AuthProvider } from "./lib/AuthContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CardBuilder from "./pages/CardBuilder";

export function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function Router() {
  const [route, setRoute] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  if (route === '/dashboard') return <Dashboard />;
  if (route === '/dashboard/card-builder') return <CardBuilder />;
  if (route === '/login') return <Login />;
  if (route === '/signup') return <Signup />;

  return <Home />;
}

function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

export default App;
