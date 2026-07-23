import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageSquare, Trophy, BookOpen, BarChart3,
  Zap, TrendingUp, Clock, Bookmark, ArrowRight,
  Sparkles, ChevronRight, Activity
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { analyticsApi } from '../api/analyticsApi';
import { BUSINESS_INSIGHTS, KNOWLEDGE_DOMAINS, PERSONAS } from '../utils/constants';
import { formatRelativeTime } from '../utils/helpers';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { sessions, createSession, setActiveSession } = useChatStore();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    analyticsApi.getDashboard().then(setAnalytics).catch(console.error);
    analyticsApi.getHistory(5).then((d) => setHistory(d.history || [])).catch(console.error);
  }, []);

  const totalMessages = sessions.reduce((acc, s) => acc + s.messages.length, 0);
  const bookmarks = sessions.flatMap((s) => s.messages.filter((m) => m.isBookmarked)).length;

  const quickStats = [
    {
      label: 'Total Messages',
      value: totalMessages,
      icon: MessageSquare,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      trend: '+12%',
    },
    {
      label: 'Knowledge Queries',
      value: analytics?.total_queries || 50,
      icon: Activity,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      trend: '+8%',
    },
    {
      label: 'Avg Response',
      value: `${analytics?.avg_response_time || 1.2}s`,
      icon: Clock,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
      trend: '-20%',
    },
    {
      label: 'Saved Answers',
      value: bookmarks,
      icon: Bookmark,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      trend: '+5',
    },
  ];

  const quickActions = [
    { label: 'Start AI Chat', icon: MessageSquare, to: '/chat', color: 'from-blue-500 to-blue-700', desc: 'Ask any enterprise question' },
    { label: 'Top 10 Lists', icon: Trophy, to: '/top10', color: 'from-amber-500 to-amber-700', desc: 'Generate instant checklists' },
    { label: 'Knowledge Base', icon: BookOpen, to: '/repository', color: 'from-green-500 to-green-700', desc: 'Browse all 10 domains' },
    { label: 'Analytics', icon: BarChart3, to: '/analytics', color: 'from-purple-500 to-purple-700', desc: 'Usage insights & trends' },
  ];

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden mb-8"
        style={{ background: 'linear-gradient(135deg, #0052cc 0%, #003d99 50%, #1a237e 100%)' }}
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="relative z-10 p-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-blue-200 text-sm mb-1">{greeting} 👋</p>
              <h1 className="text-white text-3xl font-black mb-2">{user?.name || 'Welcome'}</h1>
              <p className="text-blue-200/70 text-sm max-w-md">
                Your intelligent enterprise knowledge assistant is ready. Ask questions, generate insights, and navigate information 10X faster.
              </p>
            </div>
            <div className="hidden md:flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-2">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <span className="text-blue-200 text-xs">AI Active</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => { createSession(); navigate('/chat'); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Start Chatting
            </button>
            <button
              onClick={() => navigate('/top10')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/20 text-white rounded-xl font-semibold text-sm hover:bg-white/30 transition-colors border border-white/30"
            >
              <Trophy className="w-4 h-4" />
              Generate Top 10
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</div>
            <div className="text-xs font-medium text-green-600 dark:text-green-400 mt-1">{stat.trend}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(action.to)}
                className="glass-card p-5 text-left group"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{action.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{action.desc}</p>
                <ArrowRight className="w-4 h-4 text-gray-400 mt-2 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h2>
            <button onClick={() => navigate('/history')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="glass-card p-4 space-y-3">
            {history.length > 0 ? history.slice(0, 5).map((item: any, i: number) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-800 dark:text-gray-200 font-medium truncate">{item.question}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatRelativeTime(item.timestamp)}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
                <button onClick={() => navigate('/chat')} className="text-xs text-blue-600 dark:text-blue-400 mt-1 hover:underline">Start asking questions</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Business Insights */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Key Business Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {BUSINESS_INSIGHTS.slice(0, 4).map((insight, i) => (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-5"
            >
              <div className="text-3xl mb-3">{insight.icon}</div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1.5">{insight.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{insight.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
