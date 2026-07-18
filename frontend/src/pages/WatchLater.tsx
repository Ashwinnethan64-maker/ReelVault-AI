import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2, PlaySquare, ExternalLink, Star } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

interface Reel {
  id: string;
  title?: string;
  thumbnail?: string;
  creator?: string;
  url: string;
  aiSummary?: string;
  estimatedTime?: number;
  isFavorite: boolean;
  isWatchLater: boolean;
  createdAt: string;
  tags?: { tag: { name: string } }[];
}

export const WatchLater: React.FC = () => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchReels = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reels?watchLater=true&limit=50');
      setReels(res.data.reels || []);
    } catch {
      toast.error('Failed to load Watch Later queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReels(); }, []);

  const removeFromWatchLater = async (reel: Reel) => {
    try {
      await api.patch(`/reels/${reel.id}`, { isWatchLater: false });
      toast.success('Removed from Watch Later');
      fetchReels();
    } catch { toast.error('Failed to remove'); }
  };

  const toggleFavorite = async (reel: Reel) => {
    try {
      await api.patch(`/reels/${reel.id}`, { isFavorite: !reel.isFavorite });
      toast.success(reel.isFavorite ? 'Removed from favorites' : 'Added to favorites');
      fetchReels();
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div className="min-h-full">
      <div className="px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
            <Clock className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Watch Later</h1>
            <p className="text-zinc-400 text-sm">{reels.length} reel{reels.length !== 1 ? 's' : ''} queued up</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-zinc-900/40 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : reels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-white font-semibold">Queue is empty</p>
            <p className="text-zinc-500 text-sm mt-1 max-w-xs">
              Mark reels with the clock icon to save them for later.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {reels.map((reel, idx) => (
                <motion.div
                  key={reel.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.04 }}
                  className="group flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-white/10 transition-all"
                >
                  <div className="shrink-0 w-7 h-7 rounded-full bg-zinc-700/60 flex items-center justify-center text-xs text-zinc-500 font-medium">
                    {idx + 1}
                  </div>
                  <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                    {reel.thumbnail ? (
                      <img src={reel.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlaySquare className="w-5 h-5 text-zinc-600" />
                      </div>
                    )}
                    {reel.estimatedTime && (
                      <span className="absolute bottom-0.5 right-0.5 text-[9px] bg-black/70 text-white/80 px-1 rounded">
                        {reel.estimatedTime}m
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{reel.title || 'Untitled Reel'}</p>
                    {reel.creator && <p className="text-xs text-zinc-500">@{reel.creator}</p>}
                    {reel.aiSummary && <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{reel.aiSummary}</p>}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleFavorite(reel)}
                      className={`p-1.5 rounded-lg transition-all ${reel.isFavorite ? 'text-amber-400' : 'text-zinc-600 hover:text-amber-400 opacity-0 group-hover:opacity-100'}`}
                    >
                      <Star className="w-4 h-4" />
                    </button>
                    <a
                      href={reel.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => removeFromWatchLater(reel)}
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
