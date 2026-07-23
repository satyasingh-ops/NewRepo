import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { BarChart3, TrendingUp, Clock, Brain, AlertTriangle, Activity, Search } from 'lucide-react';
import { analyticsApi } from '../api/analyticsApi';
import { KNOWLEDGE_DOMAINS, PERSONAS } from '../utils/constants';
import { getDomainColor } from '../utils/helpers';

const CHART_COLORS = ['#0052cc', '#7c3aed', '#dc2626', '#059669', '#0891b2', '#d97706', '#db2777', '#0e7490', '#16a34a', '#854d0e'];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    analyticsApi.getDashboard()
      .then(setAnalytics)
      .catch(() => {
        // Seed demo data if backend not available
        setAnalytics({
          total_queries: 247,
          domain_distribution: {
            operations: 52, compliance: 41, risk: 38, audit: 35,
            controls: 28, governance: 22, euda: 15, automation: 8, learning: 5, hr: 3
          },
          persona_distribution: {
            operations_analyst: 72, manager: 55, internal_auditor: 43,
            compliance_officer: 38, risk_owner: 25, new_joiner: 14
          },
          top_queries: [
            { query: 'Top 10 Audit Readiness Actions', count: 18 },
            { query: 'What are the SLA requirements?', count: 15 },
            { query: 'Three lines of defense model', count: 12 },
            { query: 'GDPR compliance checklist', count: 10 },
            { query: 'EUDA inventory requirements', count: 8 },
          ],
          daily_trends: [
            { date: '2025-07-15', count: 28 },
            { date: '2025-07-16', count: 35 },
            { date: '2025-07-17', count: 42 },
            { date: '2025-07-18', count: 31 },
            { date: '2025-07-19', count: 48 },
            { date: '2025-07-20', count: 39 },
            { date: '2025-07-21', count: 24 },
          ],
          avg_response_time: 1.4,
          knowledge_gaps: ['hr', 'learning', 'automation'],
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Prepare chart data
  const domainChartData = Object.entries(analytics?.domain_distribution || {})
    .map(([key, value]) => ({
      name: KNOWLEDGE_DOMAINS.find((d) => d.id === key)?.icon + ' ' + key,
      count: value as number,
      fill: getDomainColor(key),
    }))
    .sort((a, b) => b.count - a.count);

  const personaChartData = Object.entries(analytics?.persona_distribution || {})
    .map(([key, value]) => ({
      name: PERSONAS.find((p) => p.id === key)?.name || key,
      value: value as number,
    }));

  const trendData = (analytics?.daily_trends || []).map((d: any) => ({
    date: new Date(d.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    queries: d.count,
  }));

  const summaryStats = [
    {
      label: 'Total Queries',
      value: analytics?.total_queries || 0,
      icon: Search,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      desc: 'All time',
    },
    {
      label: 'Active Personas',
      value: Object.keys(analytics?.persona_distribution || {}).length,
      icon: Brain,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      desc: 'Unique roles',
    },
    {
      label: 'Avg Response',
      value: `${analytics?.avg_response_time || 0}s`,
      icon: Clock,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
      desc: 'Per query',
    },
    {
      label: 'Knowledge Gaps',
      value: analytics?.knowledge_gaps?.length || 0,
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      desc: 'Underutilized domains',
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-white/10 rounded-xl p-3 shadow-lg">
          <p className="text-xs font-semibold text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} className="text-xs text-gray-600 dark:text-gray-400">
              {entry.name}: <span className="font-semibold" style={{ color: entry.color }}>{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Analytics Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Knowledge usage insights and search trends</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryStats.map((stat, i) => (
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
            <div className="text-xs text-gray-400 dark:text-gray-500">{stat.desc}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Domain Distribution Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 glass-card"
        >
          <h2 className="font-bold text-gray-900 dark:text-white mb-1">Queries by Domain</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Most searched knowledge areas</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={domainChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {domainChartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Persona Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass-card"
        >
          <h2 className="font-bold text-gray-900 dark:text-white mb-1">Persona Distribution</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Who's using the system</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={personaChartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {personaChartData.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {personaChartData.slice(0, 4).map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-gray-600 dark:text-gray-400 truncate">{item.name}</span>
                <span className="ml-auto font-semibold text-gray-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Search Trends Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-3 glass-card"
        >
          <h2 className="font-bold text-gray-900 dark:text-white mb-1">Search Trends</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Daily query volume (last 7 days)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="queries"
                stroke="#0052cc"
                strokeWidth={2.5}
                dot={{ fill: '#0052cc', r: 4 }}
                activeDot={{ r: 6, fill: '#1a6eff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Queries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 glass-card"
        >
          <h2 className="font-bold text-gray-900 dark:text-white mb-1">Top Queries</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Most frequently asked</p>
          <div className="space-y-3">
            {(analytics?.top_queries || []).slice(0, 5).map((item: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-lg font-black" style={{ color: CHART_COLORS[i] }}>#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{item.query}</p>
                  <div className="mt-1 bg-gray-100 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(item.count / Math.max(...analytics.top_queries.map((q: any) => q.count))) * 100}%`,
                        backgroundColor: CHART_COLORS[i]
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{item.count} queries</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Knowledge Gaps */}
      {analytics?.knowledge_gaps?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-gray-900 dark:text-white">Knowledge Gaps</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            These domains have low query volume, suggesting potential knowledge gaps or underutilization:
          </p>
          <div className="flex flex-wrap gap-3">
            {analytics.knowledge_gaps.map((gap: string) => {
              const domain = KNOWLEDGE_DOMAINS.find((d) => d.id === gap);
              return domain ? (
                <div
                  key={gap}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm"
                  style={{ borderColor: `${domain.color}40`, backgroundColor: `${domain.color}10` }}
                >
                  <span>{domain.icon}</span>
                  <span className="font-medium" style={{ color: domain.color }}>{domain.name}</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                </div>
              ) : null;
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
