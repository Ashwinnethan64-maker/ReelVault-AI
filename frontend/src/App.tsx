import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Lazy loaded pages
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Reels = lazy(() => import('./pages/Reels').then(m => ({ default: m.Reels })));
const Collections = lazy(() => import('./pages/Collections').then(m => ({ default: m.Collections })));
const WatchLater = lazy(() => import('./pages/WatchLater').then(m => ({ default: m.WatchLater })));
const Tags = lazy(() => import('./pages/Tags').then(m => ({ default: m.Tags })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-zinc-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-zinc-500 text-sm">Loading...</p>
    </div>
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
              <Route index element={<Dashboard />} />
              <Route path="reels" element={<Reels />} />
              <Route path="collections" element={<Collections />} />
              <Route path="watch-later" element={<WatchLater />} />
              <Route path="tags" element={<Tags />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          {/* 404 fallback */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-4">
              <h1 className="text-6xl font-bold text-zinc-700">404</h1>
              <p className="text-zinc-400">Page not found</p>
              <a href="/" className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">Go home →</a>
            </div>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
