import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { MobileNav } from './MobileNav';

export const AppShell = () => {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col h-full w-full">
        {/* Top Navigation */}
        <TopNav />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
        
        {/* Mobile Navigation (Bottom) */}
        <div className="md:hidden">
          <MobileNav />
        </div>
      </div>
    </div>
  );
};
