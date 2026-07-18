import React, { useState } from 'react';
import { Bell, Search, Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AddReelModal } from '../ui/AddReelModal';

export const TopNav: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/reels?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <>
      <header className="h-16 border-b border-white/5 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 md:px-8">
        {/* Logo (Mobile only) */}
        <div className="md:hidden pl-12">
          <h1 className="text-xl font-bold text-white tracking-tight">ReelVault</h1>
        </div>

        {/* Search (Desktop) */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-auto px-6">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search your vault... (Press Enter)"
              className="w-full pl-10 pr-20 py-2 bg-zinc-900/50 border border-white/5 focus:border-indigo-500/30 text-white text-sm placeholder:text-zinc-500 rounded-full h-10 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/10 bg-zinc-800 px-1.5 font-mono text-[10px] font-medium text-zinc-400">
                Enter
              </kbd>
            </div>
          </div>
        </form>

        {/* Mobile Search Overlay */}
        {showMobileSearch && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 z-50 bg-zinc-950 flex items-center px-4 md:hidden gap-3"
          >
            <form onSubmit={handleSearch} className="flex-1">
              <input
                autoFocus
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search reels..."
                className="w-full px-4 py-2 text-sm rounded-lg bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none"
              />
            </form>
            <button onClick={() => setShowMobileSearch(false)} className="text-zinc-400">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowMobileSearch(true)}
            className="p-2 rounded-full md:hidden text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <Search className="w-5 h-5" />
          </button>

          <button className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all relative">
            <Bell className="w-5 h-5" />
          </button>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button
              onClick={() => setIsModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 rounded-full px-5 bg-white text-black hover:bg-zinc-200 transition-colors font-medium h-9 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Reel
            </button>
          </motion.div>

          {/* Mobile fab */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </header>

      <AddReelModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
