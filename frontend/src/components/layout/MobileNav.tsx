import { NavLink } from 'react-router-dom';
import { Home, Compass, Bookmark, Search, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MobileNav = () => {
  const items = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Search', path: '/search', icon: Search },
    { name: 'Add', path: '/add', icon: PlusCircle, isAction: true },
    { name: 'Collections', path: '/collections', icon: Bookmark },
    { name: 'More', path: '/menu', icon: Compass },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-background/80 backdrop-blur-md flex items-center justify-around px-2 pb-safe">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center w-full h-full space-y-1',
              isActive ? 'text-primary' : 'text-muted-foreground',
              item.isAction ? 'text-primary' : ''
            )
          }
        >
          <item.icon className={cn("w-6 h-6", item.isAction && "w-10 h-10")} />
          {!item.isAction && <span className="text-[10px] font-medium">{item.name}</span>}
        </NavLink>
      ))}
    </nav>
  );
};
