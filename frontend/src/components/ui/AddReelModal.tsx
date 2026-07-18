import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PlaySquare, Link, Sparkles, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

interface AddReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddReelModal: React.FC<AddReelModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Quick regex validation for Instagram URL
    const urlPattern = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i;
    if (!url.match(urlPattern)) {
      setError('Please enter a valid Instagram Reel or Post URL');
      return;
    }

    setLoading(true);

    try {
      await api.post('/reels', {
        url,
        title: title || undefined,
        description: description || undefined
      });

      toast.success('Reel added successfully! AI metadata extraction enqueued in the background.');
      setUrl('');
      setTitle('');
      setDescription('');
      onClose();
      if (onSuccess) onSuccess();
      window.dispatchEvent(new Event('reelAdded'));
    } catch (err: any) {
      console.error('AddReelModal Error:', err);
      const errorMsg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to add Reel. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950/95 p-6 shadow-2xl relative z-10 overflow-hidden backdrop-blur-xl"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-pink-500/10 flex items-center justify-center border border-pink-500/20 text-pink-400">
                  <PlaySquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Add Instagram Reel</h3>
                  <p className="text-xs text-zinc-400">Save knowledge reels into your dashboard</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 rounded-lg border border-white/5 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="url" className="text-zinc-300">Instagram Reel URL</Label>
                <div className="relative">
                  <Link className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://www.instagram.com/reel/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="pl-10 bg-zinc-900/50 border-white/5 text-white placeholder:text-zinc-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-zinc-300">Custom Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="e.g. Next.js Routing Tips"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-zinc-900/50 border-white/5 text-white placeholder:text-zinc-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-zinc-300">Notes / Description (Optional)</Label>
                <textarea
                  id="description"
                  placeholder="What is this reel about?..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-white/5 bg-zinc-900/50 p-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs font-medium text-rose-400 bg-rose-950/20 border border-rose-500/20 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={onClose}
                  className="text-zinc-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/20"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Validating URL...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>Add to Vault</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
