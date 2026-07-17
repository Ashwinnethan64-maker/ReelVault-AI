import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Lazy loaded components
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-900">
    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AppShell />}>
              <Route index element={<div>Dashboard Placeholder</div>} />
              <Route path="reels" element={<div>All Reels Placeholder</div>} />
              <Route path="collections" element={<div>Collections Placeholder</div>} />
              <Route path="watch-later" element={<div>Watch Later Placeholder</div>} />
              <Route path="tags" element={<div>Tags Placeholder</div>} />
              <Route path="settings" element={<div>Settings Placeholder</div>} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
