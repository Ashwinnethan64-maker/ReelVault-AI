import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Clock, Star, Plus, ArrowRight, 
  PlaySquare, Sparkles, Tag, FolderOpen, Brain
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { AddReelModal } from '@/components/ui/AddReelModal';

interface Reel {
  id: string;
  title?: string;
  creator?: string;
  thumbnail?: string;
  url: string;
  aiSummary?: string;
  isFavorite: boolean;
  isWatchLater: boolean;
  createdAt: string;
  tags?: { tag: { name: string; color: string } }[];
}

interface Stats {
  total: number;
  favorites: number;
  watchLater: number;
  thisWeek: number;
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number | undefined;
  gradient: string;
  delay: number;
}

const StatCard = ({ icon: Icon, label, value, gradient, delay }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-5 backdrop-blur-sm hover:border-white/10 transition-all group"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-zinc-400 font-medium">{label}</p>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
      </div>
      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </motion.div>
);

const ReelCard = ({ reel }: { reel: Reel }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="rounded-xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm overflow-hidden hover:border-white/10 transition-all group"
  >
    <div className="relative h-36 overflow-hidden bg-zinc-800">
      {reel.thumbnail ? (
        <img 
          src={reel.thumbnail} 
          alt={reel.title || 'Reel'} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/40 to-purple-900/40">
          <PlaySquare className="w-10 h-10 text-indigo-400/40" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      {reel.isFavorite && (
        <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-amber-500/90 flex items-center justify-center">
          <Star className="w-3 h-3 text-white fill-white" />
        </div>
      )}
    </div>
    <div className="p-3">
      <p className="text-sm font-semibold text-white truncate">{reel.title || 'Untitled Reel'}</p>
      {reel.creator && <p className="text-xs text-zinc-500 mt-0.5">@{reel.creator}</p>}
      {reel.aiSummary && (
        <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">{reel.aiSummary}</p>
      )}
      <div className="flex items-center gap-2 mt-2">
        {reel.tags?.slice(0, 2).map(({ tag }) => (
          <span key={tag.name} className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {tag.name}
          </span>
        ))}
      </div>
    </div>
  </motion.div>
);

// Mini SVG Bar Chart for weekly uploads
const WeeklyChart = ({ data }: { data: number[] }) => {
  const max = Math.max(...data, 1);
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(val / max) * 80}px` }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 200 }}
            className="w-full rounded-t-sm bg-gradient-to-t from-indigo-600 to-indigo-400 min-h-[4px]"
          />
          <span className="text-[10px] text-zinc-600">{days[i]}</span>
        </div>
      ))}
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [reels, setReels] = useState<Reel[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, favorites: 0, watchLater: 0, thisWeek: 0 });
  const [weeklyData, setWeeklyData] = useState<number[]>([0,0,0,0,0,0,0]);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [res, analyticsRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/analytics')
      ]);
      setReels(res.data.recentReels || []);
      setStats(res.data.stats || { total: 0, favorites: 0, watchLater: 0, thisWeek: 0 });
      setWeeklyData(res.data.weeklyData || [0,0,0,0,0,0,0]);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      // silently fail – empty state will show
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleReelAdded = () => fetchData();
    window.addEventListener('reelAdded', handleReelAdded);
    return () => window.removeEventListener('reelAdded', handleReelAdded);
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'there';

  const statCards = [
    { icon: PlaySquare, label: 'Total Reels', value: stats.total, gradient: 'from-indigo-500 to-purple-600', delay: 0 },
    { icon: Brain, label: 'Knowledge Score', value: (analytics?.knowledgeScore as number) || 0, gradient: 'from-emerald-500 to-teal-600', delay: 0.05 },
    { icon: Clock, label: 'Watch Later', value: stats.watchLater, gradient: 'from-sky-500 to-blue-600', delay: 0.1 },
    { icon: TrendingUp, label: 'This Week', value: stats.thisWeek, gradient: 'from-amber-500 to-orange-600', delay: 0.15 },
  ];

  const quickActions = [
    { icon: Plus, label: 'Add Reel', desc: 'Save an Instagram reel', action: () => setIsModalOpen(true), color: 'indigo' },
    { icon: FolderOpen, label: 'Collections', desc: 'Organize your reels', href: '/collections', color: 'purple' },
    { icon: Tag, label: 'Browse Tags', desc: 'Filter by topic', href: '/tags', color: 'sky' },
    { icon: Sparkles, label: 'All Reels', desc: 'View your entire vault', href: '/reels', color: 'emerald' },
  ];

  return (
    <div className="min-h-full">
      {/* Hero */}
      <div className="relative px-6 pt-8 pb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-transparent to-purple-950/20 pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-indigo-400 font-medium mb-1">Good {getTimeOfDay()}</p>
          <h1 className="text-3xl font-bold text-white">Welcome back, {firstName} 👋</h1>
          <p className="text-zinc-400 mt-1.5 text-sm max-w-md">
            {stats.total > 0 
              ? `You have ${stats.total} reel${stats.total > 1 ? 's' : ''} in your vault. ${stats.watchLater > 0 ? `${stats.watchLater} waiting to watch.` : ''}`
              : `Your vault is empty. Start by adding your first Instagram reel.`}
          </p>
        </motion.div>
      </div>

      <div className="px-6 pb-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* Quick Actions + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-zinc-900/40 p-5 backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((qa) => {
                const Icon = qa.icon;
                const colorMap: Record<string, string> = {
                  indigo: 'bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/15 text-indigo-300',
                  purple: 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/15 text-purple-300',
                  sky: 'bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/15 text-sky-300',
                  emerald: 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15 text-emerald-300',
                };
                const classes = `flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer group ${colorMap[qa.color]}`;
                const content = (
                  <>
                    <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-white">{qa.label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{qa.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 ml-auto self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                  </>
                );
                return qa.href ? (
                  <Link key={qa.label} to={qa.href} className={classes}>{content}</Link>
                ) : (
                  <button key={qa.label} onClick={qa.action} className={classes}>{content}</button>
                );
              })}
            </div>
          </div>

          {/* Weekly Chart */}
          <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-5 backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">Weekly Uploads</h2>
            <WeeklyChart data={weeklyData} />
            <p className="text-xs text-zinc-500 mt-4 text-center">{stats.thisWeek} reels saved this week</p>
          </div>
        </div>

        {/* Recent Reels */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Recent Reels</h2>
            <Link to="/reels" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl border border-white/5 bg-zinc-900/40 overflow-hidden animate-pulse">
                  <div className="h-36 bg-zinc-800/60" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-zinc-700/60 rounded w-3/4" />
                    <div className="h-2 bg-zinc-800/60 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : reels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-white/10 bg-zinc-900/20">
              <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
                <PlaySquare className="w-7 h-7 text-indigo-400" />
              </div>
              <p className="text-white font-semibold">Your vault is empty</p>
              <p className="text-zinc-500 text-sm mt-1 mb-4 max-w-xs">
                Start adding Instagram reels to build your personal knowledge library.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" /> Add First Reel
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {reels.map((reel) => (
                <ReelCard key={reel.id} reel={reel} />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddReelModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
};

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
