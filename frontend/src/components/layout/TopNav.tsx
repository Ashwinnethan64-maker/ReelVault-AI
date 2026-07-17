import { Bell, Search, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export const TopNav = () => {
  return (
    <header className="h-16 border-b border-white/5 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 md:px-8">
      <div className="md:hidden">
        <h1 className="text-xl font-bold text-white tracking-tight">ReelVault</h1>
      </div>

      <div className="hidden md:flex flex-1 max-w-2xl mx-auto px-6">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
          <Input 
            placeholder="Search your vault... (Press Cmd+K)" 
            className="w-full pl-10 bg-zinc-900/50 border-white/5 focus:border-indigo-500/50 transition-all rounded-full h-10 placeholder:text-zinc-500 text-sm"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/10 bg-zinc-800 px-1.5 font-mono text-[10px] font-medium text-zinc-400">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full text-zinc-400 hover:text-white hover:bg-white/10">
          <Bell className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full md:hidden text-zinc-400 hover:text-white hover:bg-white/10">
          <Search className="w-5 h-5" />
        </Button>
        
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button className="hidden md:flex rounded-full px-5 bg-white text-black hover:bg-zinc-200 transition-colors font-medium h-9">
            <Plus className="w-4 h-4 mr-2" />
            Add Reel
          </Button>
        </motion.div>
      </div>
    </header>
  );
};
