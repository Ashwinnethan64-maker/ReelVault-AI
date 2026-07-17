import { NavLink } from 'react-router-dom';
import { Home, Compass, Bookmark, Clock, Tags, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'All Reels', path: '/reels', icon: Compass },
    { name: 'Collections', path: '/collections', icon: Bookmark },
    { name: 'Watch Later', path: '/watch-later', icon: Clock },
    { name: 'Tags', path: '/tags', icon: Tags },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
          ReelVault AI
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-20 bg-accent rounded animate-pulse" />
            <div className="h-3 w-32 bg-accent/50 rounded mt-2 animate-pulse" />
          </div>
        </div>
      </div>
    </aside>
  );
};
