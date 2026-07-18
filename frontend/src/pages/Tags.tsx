import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tag, PlaySquare } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

interface TagData {
  id: string;
  name: string;
  color: string;
  count: number;
}

const TAG_COLORS = [
  'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  'bg-purple-500/10 border-purple-500/20 text-purple-400',
  'bg-sky-500/10 border-sky-500/20 text-sky-400',
  'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  'bg-amber-500/10 border-amber-500/20 text-amber-400',
  'bg-rose-500/10 border-rose-500/20 text-rose-400',
  'bg-teal-500/10 border-teal-500/20 text-teal-400',
  'bg-pink-500/10 border-pink-500/20 text-pink-400',
];

export const Tags: React.FC = () => {
  const [tags, setTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      try {
        const res = await api.get('/tags');
        setTags(res.data);
      } catch {
        toast.error('Failed to load tags');
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, []);

  const handleTagClick = (tag: TagData) => {
    // Navigate to reels with tag filter (future: use query param)
    navigate(`/reels?tag=${encodeURIComponent(tag.name)}`);
  };

  const maxCount = Math.max(...tags.map(t => t.count), 1);

  return (
    <div className="min-h-full">
      <div className="px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Tag className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Tags</h1>
            <p className="text-zinc-400 text-sm">{tags.length} unique tag{tags.length !== 1 ? 's' : ''} across your vault</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex flex-wrap gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-10 w-24 rounded-full bg-zinc-900/40 animate-pulse" />
            ))}
          </div>
        ) : tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
              <Tag className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-white font-semibold">No tags yet</p>
            <p className="text-zinc-500 text-sm mt-1 max-w-xs">
              Tags are automatically created by AI when you add reels. Add a reel to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Tag Cloud */}
            <div>
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Tag Cloud</h2>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, i) => {
                  const colorClass = TAG_COLORS[i % TAG_COLORS.length];
                  const fontSize = 0.7 + (tag.count / maxCount) * 0.6;
                  return (
                    <motion.button
                      key={tag.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleTagClick(tag)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all font-medium cursor-pointer ${colorClass}`}
                      style={{ fontSize: `${fontSize}rem` }}
                    >
                      <span>#</span>
                      <span>{tag.name}</span>
                      <span className="opacity-50 text-xs ml-0.5">({tag.count})</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Tag List */}
            <div>
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">All Tags</h2>
              <div className="space-y-2">
                {tags.map((tag, i) => {
                  const colorClass = TAG_COLORS[i % TAG_COLORS.length];
                  return (
                    <motion.button
                      key={tag.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => handleTagClick(tag)}
                      className="group w-full flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-white/10 transition-all text-left"
                    >
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${colorClass}`}>
                        #{tag.name}
                      </div>
                      <div className="flex-1">
                        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(tag.count / maxCount) * 100}%` }}
                            transition={{ delay: i * 0.04, duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-zinc-500 shrink-0">
                        <PlaySquare className="w-3.5 h-3.5" />
                        <span>{tag.count} reel{tag.count !== 1 ? 's' : ''}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
