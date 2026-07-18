import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Plus, Trash2, X, PlaySquare, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

interface Reel {
  id: string;
  title?: string;
  thumbnail?: string;
  creator?: string;
}

interface Collection {
  id: string;
  name: string;
  createdAt: string;
  reels: { reel: Reel }[];
}

export const Collections: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const toast = useToast();

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const res = await api.get('/collections');
      setCollections(res.data);
    } catch {
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCollections(); }, []);

  const createCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.post('/collections', { name: newName.trim() });
      toast.success(`Collection "${newName}" created`);
      setNewName('');
      fetchCollections();
    } catch {
      toast.error('Failed to create collection');
    } finally {
      setCreating(false);
    }
  };

  const deleteCollection = async (id: string, name: string) => {
    try {
      await api.delete(`/collections/${id}`);
      toast.success(`Collection "${name}" deleted`);
      if (selectedCollection?.id === id) setSelectedCollection(null);
      fetchCollections();
    } catch {
      toast.error('Failed to delete collection');
    }
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="px-6 py-6 border-b border-white/5">
        <h1 className="text-2xl font-bold text-white">Collections</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Organise your reels into curated collections</p>

        <form onSubmit={createCollection} className="mt-4 flex gap-3 max-w-sm">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Collection name..."
            className="flex-1 px-4 py-2 text-sm rounded-lg bg-zinc-900/60 border border-white/5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-zinc-900/40 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-white font-semibold">No collections yet</p>
            <p className="text-zinc-500 text-sm mt-1">Create your first collection to organise your reels.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {collections.map((col) => (
                <motion.div
                  key={col.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -3 }}
                  className="group rounded-2xl border border-white/5 bg-zinc-900/40 p-5 hover:border-white/10 transition-all cursor-pointer relative"
                  onClick={() => setSelectedCollection(col)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                      <FolderOpen className="w-5 h-5 text-indigo-400" />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteCollection(col.id, col.name); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-semibold text-white">{col.name}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {col.reels.length} reel{col.reels.length !== 1 ? 's' : ''}
                  </p>

                  {/* Thumbnail preview row */}
                  {col.reels.length > 0 && (
                    <div className="flex -space-x-2 mt-3">
                      {col.reels.slice(0, 4).map(({ reel }) => (
                        <div key={reel.id} className="w-8 h-8 rounded-full overflow-hidden border-2 border-zinc-950 bg-zinc-800 shrink-0">
                          {reel.thumbnail ? (
                            <img src={reel.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <PlaySquare className="w-3.5 h-3.5 text-zinc-600" />
                            </div>
                          )}
                        </div>
                      ))}
                      {col.reels.length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-zinc-950 flex items-center justify-center text-[10px] font-medium text-zinc-400 shrink-0">
                          +{col.reels.length - 4}
                        </div>
                      )}
                    </div>
                  )}

                  <ChevronRight className="absolute bottom-5 right-5 w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Collection Detail Drawer */}
      <AnimatePresence>
        {selectedCollection && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCollection(null)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-full w-full max-w-sm bg-zinc-950 border-l border-white/10 z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedCollection.name}</h3>
                  <p className="text-xs text-zinc-500">{selectedCollection.reels.length} reels</p>
                </div>
                <button onClick={() => setSelectedCollection(null)} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {selectedCollection.reels.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <PlaySquare className="w-10 h-10 text-zinc-700 mb-3" />
                    <p className="text-zinc-500 text-sm">No reels in this collection yet.</p>
                  </div>
                ) : (
                  selectedCollection.reels.map(({ reel }) => (
                    <div key={reel.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/60 border border-white/5">
                      <div className="w-12 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                        {reel.thumbnail ? (
                          <img src={reel.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <PlaySquare className="w-4 h-4 text-zinc-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{reel.title || 'Untitled'}</p>
                        {reel.creator && <p className="text-xs text-zinc-500">@{reel.creator}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
