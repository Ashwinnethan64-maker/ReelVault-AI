import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { MobileNav } from './MobileNav';
import { AIAssistant } from '../ui/AIAssistant';

export const AppShell = () => {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-zinc-950 text-foreground overflow-hidden selection:bg-indigo-500/30">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col h-full w-full relative">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/10 blur-[100px] pointer-events-none" />

        {/* Top Navigation */}
        <TopNav />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        
        {/* Mobile Navigation (Bottom) */}
        <div className="md:hidden border-t border-white/5 bg-zinc-950/80 backdrop-blur-xl z-50 relative">
          <MobileNav />
        </div>

        {/* Global Floating AI Assistant */}
        <AIAssistant />
      </div>
    </div>
  );
};
