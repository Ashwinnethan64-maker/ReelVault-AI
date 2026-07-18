import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Grid3X3, List, Star, Clock,
  PlaySquare, Plus, Trash2, Sparkles, ExternalLink, X
} from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { AddReelModal } from '@/components/ui/AddReelModal';
import { cn } from '@/lib/utils';

interface Tag { name: string; color: string; }
interface Reel {
  id: string;
  title?: string;
  creator?: string;
  thumbnail?: string;
  url: string;
  aiSummary?: string;
  difficulty?: string;
  estimatedTime?: number;
  isFavorite: boolean;
  isWatchLater: boolean;
  createdAt: string;
  tags?: { tag: Tag }[];
  category?: { name: string } | null;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'newest' | 'oldest' | 'estimatedTime' | 'priority';

const difficultyColor: Record<string, string> = {
  Beginner: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Intermediate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Advanced: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export const Reels: React.FC = () => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [filterWatchLater, setFilterWatchLater] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReels, setTotalReels] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);
  const toast = useToast();

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortBy, filterFavorites, filterWatchLater]);

  const fetchReels = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sort: sortBy,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filterFavorites && { favorites: 'true' }),
        ...(filterWatchLater && { watchLater: 'true' }),
      });
      const res = await api.get(`/reels?${params}`);
      setReels(res.data.reels || []);
      setTotalPages(res.data.pagination?.pages || 1);
      setTotalReels(res.data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load reels');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, sortBy, filterFavorites, filterWatchLater]);

  useEffect(() => { fetchReels(); }, [fetchReels]);

  useEffect(() => {
    const handleReelAdded = () => fetchReels();
    window.addEventListener('reelAdded', handleReelAdded);
    return () => window.removeEventListener('reelAdded', handleReelAdded);
  }, [fetchReels]);

  const toggleFavorite = async (reel: Reel) => {
    try {
      await api.patch(`/reels/${reel.id}`, { isFavorite: !reel.isFavorite });
      toast.success(reel.isFavorite ? 'Removed from favorites' : 'Added to favorites');
      fetchReels();
    } catch { toast.error('Failed to update'); }
  };

  const toggleWatchLater = async (reel: Reel) => {
    try {
      await api.patch(`/reels/${reel.id}`, { isWatchLater: !reel.isWatchLater });
      toast.success(reel.isWatchLater ? 'Removed from Watch Later' : 'Added to Watch Later');
      fetchReels();
    } catch { toast.error('Failed to update'); }
  };

  const deleteReel = async (reel: Reel) => {
    try {
      await api.delete(`/reels/${reel.id}`);
      if (selectedReel?.id === reel.id) setSelectedReel(null);
      fetchReels();
      toast.successWithUndo(`"${reel.title || 'Reel'}" deleted`, async () => {
        try {
          await api.post(`/reels/${reel.id}/restore`);
          toast.success('Reel restored!');
          fetchReels();
        } catch { toast.error('Failed to restore reel'); }
      });
    } catch { toast.error('Failed to delete reel'); }
  };

  const ReelGridCard = ({ reel }: { reel: Reel }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -3 }}
      className="group rounded-xl border border-white/5 bg-zinc-900/40 overflow-hidden hover:border-white/10 transition-all cursor-pointer"
      onClick={() => setSelectedReel(reel)}
    >
      <div className="relative h-40 bg-zinc-800 overflow-hidden">
        {reel.thumbnail ? (
          <img src={reel.thumbnail} alt={reel.title || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/40 to-purple-900/40">
            <PlaySquare className="w-10 h-10 text-indigo-400/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavorite(reel); }}
            className={cn('h-7 w-7 rounded-full backdrop-blur-sm flex items-center justify-center transition-all', reel.isFavorite ? 'bg-amber-500 text-white' : 'bg-zinc-900/70 text-zinc-400 hover:text-amber-400')}
          ><Star className="w-3.5 h-3.5" /></button>
          <button
            onClick={(e) => { e.stopPropagation(); toggleWatchLater(reel); }}
            className={cn('h-7 w-7 rounded-full backdrop-blur-sm flex items-center justify-center transition-all', reel.isWatchLater ? 'bg-sky-500 text-white' : 'bg-zinc-900/70 text-zinc-400 hover:text-sky-400')}
          ><Clock className="w-3.5 h-3.5" /></button>
          <button
            onClick={(e) => { e.stopPropagation(); deleteReel(reel); }}
            className="h-7 w-7 rounded-full bg-zinc-900/70 text-zinc-400 hover:text-rose-400 backdrop-blur-sm flex items-center justify-center transition-all"
          ><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
        {reel.difficulty && (
          <span className={cn('absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium border', difficultyColor[reel.difficulty] || 'bg-zinc-800 text-zinc-400 border-zinc-700')}>
            {reel.difficulty}
          </span>
        )}
        {reel.estimatedTime && (
          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/50 text-white/70">
            ~{reel.estimatedTime}min
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-white truncate">{reel.title || 'Untitled Reel'}</p>
        {reel.creator && <p className="text-xs text-zinc-500 mt-0.5">@{reel.creator}</p>}
        {reel.aiSummary && <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">{reel.aiSummary}</p>}
        {reel.tags && reel.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {reel.tags.slice(0, 3).map(({ tag }) => (
              <span key={tag.name} className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );

  const ReelListRow = ({ reel }: { reel: Reel }) => (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="group flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-white/10 transition-all cursor-pointer"
      onClick={() => setSelectedReel(reel)}
    >
      <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
        {reel.thumbnail ? (
          <img src={reel.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PlaySquare className="w-5 h-5 text-zinc-600" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{reel.title || 'Untitled Reel'}</p>
        <p className="text-xs text-zinc-500 mt-0.5 truncate">{reel.aiSummary || (reel.creator ? `@${reel.creator}` : reel.url)}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {reel.difficulty && (
          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium border', difficultyColor[reel.difficulty] || '')}>
            {reel.difficulty}
          </span>
        )}
        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(reel); }} className={cn('p-1.5 rounded-lg transition-all', reel.isFavorite ? 'text-amber-400' : 'text-zinc-600 hover:text-amber-400 opacity-0 group-hover:opacity-100')}>
          <Star className="w-4 h-4" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); deleteReel(reel); }} className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 transition-all opacity-0 group-hover:opacity-100">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="px-6 py-6 border-b border-white/5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">All Reels</h1>
            <p className="text-zinc-400 text-sm mt-0.5">{totalReels} reels in your vault</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors shrink-0 shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" /> Add Reel
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reels, summaries, tags..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-zinc-900/60 border border-white/5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setFilterFavorites(!filterFavorites)} className={cn('flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all', filterFavorites ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:text-white')}>
              <Star className="w-3.5 h-3.5" /> Favorites
            </button>
            <button onClick={() => setFilterWatchLater(!filterWatchLater)} className={cn('flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-all', filterWatchLater ? 'bg-sky-500/15 border-sky-500/30 text-sky-400' : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:text-white')}>
              <Clock className="w-3.5 h-3.5" /> Watch Later
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-zinc-900/60 border border-white/5 text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="estimatedTime">By Duration</option>
              <option value="priority">By Priority</option>
            </select>

            <div className="flex items-center rounded-lg bg-zinc-900/60 border border-white/5 overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={cn('p-2 transition-colors', viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white')}>
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={cn('p-2 transition-colors', viewMode === 'list' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white')}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className={cn(viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2')}>
            {[...Array(8)].map((_, i) => (
              viewMode === 'grid' ? (
                <div key={i} className="rounded-xl border border-white/5 bg-zinc-900/40 overflow-hidden animate-pulse">
                  <div className="h-40 bg-zinc-800/60" /><div className="p-3 space-y-2">
                    <div className="h-3 bg-zinc-700/60 rounded w-3/4" /><div className="h-2 bg-zinc-800/60 rounded w-1/2" />
                  </div>
                </div>
              ) : (
                <div key={i} className="h-20 rounded-xl bg-zinc-900/40 animate-pulse" />
              )
            ))}
          </div>
        ) : reels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
              <PlaySquare className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-white font-semibold">No reels found</p>
            <p className="text-zinc-500 text-sm mt-1">
              {search || filterFavorites || filterWatchLater ? 'Try changing your filters.' : 'Add your first reel to get started!'}
            </p>
            {!search && !filterFavorites && !filterWatchLater && (
              <button onClick={() => setIsModalOpen(true)} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> Add Reel
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>{reels.map((r) => <ReelGridCard key={r.id} reel={r} />)}</AnimatePresence>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>{reels.map((r) => <ReelListRow key={r.id} reel={r} />)}</AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-1.5 text-sm rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              Previous
            </button>
            <span className="text-sm text-zinc-400">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-1.5 text-sm rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              Next
            </button>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedReel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedReel(null)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-zinc-950 border-l border-white/10 z-50 flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <h3 className="text-lg font-bold text-white">Reel Details</h3>
                <button onClick={() => setSelectedReel(null)} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {selectedReel.thumbnail && (
                  <img src={selectedReel.thumbnail} alt="" className="w-full h-48 object-cover rounded-xl" />
                )}

                <div>
                  <h4 className="text-lg font-bold text-white">{selectedReel.title || 'Untitled Reel'}</h4>
                  {selectedReel.creator && <p className="text-sm text-zinc-400 mt-0.5">@{selectedReel.creator}</p>}
                </div>

                {selectedReel.aiSummary && (
                  <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/15">
                    <div className="flex items-center gap-1.5 mb-1.5 text-indigo-400">
                      <Sparkles className="w-4 h-4" /><span className="text-xs font-semibold">AI Summary</span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{selectedReel.aiSummary}</p>
                  </div>
                )}

                {selectedReel.tags && selectedReel.tags.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedReel.tags.map(({ tag }) => (
                        <span key={tag.name} className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {selectedReel.difficulty && (
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium border', difficultyColor[selectedReel.difficulty] || '')}>
                      {selectedReel.difficulty}
                    </span>
                  )}
                  {selectedReel.estimatedTime && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400">
                      ~{selectedReel.estimatedTime} min
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-white/5 flex gap-2">
                <button onClick={() => toggleFavorite(selectedReel)} className={cn('flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-all', selectedReel.isFavorite ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-zinc-800 border-white/5 text-zinc-300 hover:text-amber-400')}>
                  <Star className="w-4 h-4" />{selectedReel.isFavorite ? 'Favorited' : 'Favorite'}
                </button>
                <a href={selectedReel.url} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-indigo-500 hover:bg-indigo-400 text-white transition-colors">
                  <ExternalLink className="w-4 h-4" /> Open Reel
                </a>
                <button onClick={() => deleteReel(selectedReel)} className="py-2 px-3 rounded-lg text-sm border border-rose-500/20 bg-rose-950/20 text-rose-400 hover:bg-rose-950/40 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AddReelModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchReels} />
    </div>
  );
};
