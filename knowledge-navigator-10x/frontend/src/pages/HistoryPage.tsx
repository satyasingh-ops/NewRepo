import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Search, Filter, Download, Trash2, MessageSquare, Zap } from 'lucide-react';
import { analyticsApi } from '../api/analyticsApi';
import { formatRelativeTime, getDomainColor } from '../utils/helpers';
import { PERSONAS, KNOWLEDGE_DOMAINS } from '../utils/constants';

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [filterPersona, setFilterPersona] = useState('');

  useEffect(() => {
    analyticsApi.getHistory(100)
      .then((data) => setHistory(data.history || []))
      .catch(() => setHistory([]))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = history.filter((item) => {
    const matchesSearch = !searchQuery || item.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = !filterDomain || item.domain === filterDomain;
    const matchesPersona = !filterPersona || item.persona === filterPersona;
    return matchesSearch && matchesDomain && matchesPersona;
  });

  const personaName = (id: string) => PERSONAS.find((p) => p.id === id)?.name || id;
  const domainName = (id: string) => KNOWLEDGE_DOMAINS.find((d) => d.id === id)?.name || id;
  const domainIcon = (id: string) => KNOWLEDGE_DOMAINS.find((d) => d.id === id)?.icon || '📄';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Search History</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{history.length} total queries recorded</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="input pl-9"
          />
        </div>
        <select
          value={filterDomain}
          onChange={(e) => setFilterDomain(e.target.value)}
          className="input max-w-48"
        >
          <option value="">All Domains</option>
          {KNOWLEDGE_DOMAINS.map((d) => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
        </select>
        <select
          value={filterPersona}
          onChange={(e) => setFilterPersona(e.target.value)}
          className="input max-w-48"
        >
          <option value="">All Personas</option>
          {PERSONAS.map((p) => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden p-0">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No history found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Question</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Domain</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Persona</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {filtered.map((item, i) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-gray-50 dark:hover:bg-white/3 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-sm text-gray-800 dark:text-gray-200 max-w-xs truncate">{item.question}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${getDomainColor(item.domain)}20`, color: getDomainColor(item.domain) }}>
                        {domainIcon(item.domain)} {item.domain}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-xs text-gray-600 dark:text-gray-400">{personaName(item.persona)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatRelativeTime(item.timestamp)}</span>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <Zap className="w-3 h-3" />
                        {item.response_time}s
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
