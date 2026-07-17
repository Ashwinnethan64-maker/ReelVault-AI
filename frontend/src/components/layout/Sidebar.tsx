import { NavLink } from 'react-router-dom';
import { Home, Compass, Bookmark, Clock, Tag, Settings, Sparkles, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'All Reels', path: '/reels', icon: Compass },
    { name: 'Collections', path: '/collections', icon: Bookmark },
    { name: 'Watch Later', path: '/watch-later', icon: Clock },
    { name: 'Tags', path: '/tags', icon: Tag },
  ];

  return (
    <aside className="w-64 border-r border-white/5 bg-zinc-950/50 flex flex-col h-full backdrop-blur-xl relative z-10">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            ReelVault
          </h1>
        </div>
      </div>

      <div className="px-4 pb-2">
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-2">Menu</div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (!item || !item.icon) return null;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
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
                      exit={{ opacity: 0 }}
                    />
                  )}
                  <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300")} />
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
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
              isActive
                ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
            )
          }
        >
          <Settings className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300" />
          Settings
        </NavLink>

        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 group/profile">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm shadow-inner shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name || 'User'}</div>
              <div className="text-xs text-zinc-500 truncate">{user?.email || 'user@example.com'}</div>
            </div>
            <button 
              onClick={() => logout()}
              className="hidden group-hover/profile:flex text-zinc-500 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
