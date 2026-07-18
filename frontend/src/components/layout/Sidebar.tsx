import { NavLink } from 'react-router-dom';
import { Home, Compass, Bookmark, Clock, Tag, Settings, Sparkles, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'All Reels', path: '/reels', icon: Compass },
  { name: 'Collections', path: '/collections', icon: Bookmark },
  { name: 'Watch Later', path: '/watch-later', icon: Clock },
  { name: 'Tags', path: '/tags', icon: Tag },
];

const SidebarContent = ({ onClose }: { onClose?: () => void }) => {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">ReelVault</h1>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="px-4 pb-2">
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-2">Menu</div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                  <Icon className={cn('w-5 h-5 transition-colors', isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300')} />
                  {item.name}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <NavLink
          to="/settings"
          onClick={onClose}
          className={({ isActive }) =>
            cn('flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group', isActive ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200')
          }
        >
          <Settings className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300" />
          Settings
        </NavLink>

        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 group/profile">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm shadow-inner shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name || 'User'}</div>
              <div className="text-xs text-zinc-500 truncate">{user?.email || ''}</div>
            </div>
            <button
              onClick={() => logout()}
              className="text-zinc-500 hover:text-rose-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Sidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 border-r border-white/5 bg-zinc-950/50 flex-col h-full backdrop-blur-xl relative z-10">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger button - rendered by TopNav via context, but we also expose it */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3.5 left-4 z-50 p-2 rounded-lg bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5 backdrop-blur-sm"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="md:hidden fixed left-0 top-0 h-full w-72 bg-zinc-950 border-r border-white/5 z-50 flex flex-col"
            >
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
