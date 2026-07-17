import { NavLink } from 'react-router-dom';
import { Home, Compass, Bookmark, Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export const MobileNav = () => {
  const items = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Search', path: '/search', icon: Search },
    { name: 'Add', path: '#add', icon: Plus, isAction: true },
    { name: 'Saved', path: '/collections', icon: Bookmark },
    { name: 'Menu', path: '/reels', icon: Compass },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-2 pb-safe z-50">
      {items.map((item) => {
        if (!item || !item.icon) return null;
        const Icon = item.icon;
        return (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center justify-center w-full h-full space-y-1',
                isActive && !item.isAction ? 'text-white' : 'text-zinc-500'
              )
            }
          >
            {({ isActive }) => (
              <>
                {item.isAction ? (
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg -translate-y-4 border-4 border-zinc-950">
                      <Icon className="w-6 h-6" />
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="mobile-active"
                        className="absolute top-0 w-8 h-1 bg-indigo-500 rounded-b-full"
                      />
                    )}
                    <Icon className={cn("w-6 h-6 transition-colors", isActive ? "text-indigo-400" : "")} />
                    <span className="text-[10px] font-medium">{item.name}</span>
                  </>
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};
