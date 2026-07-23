import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Upload, BookOpen, ChevronRight, FileText, ExternalLink } from 'lucide-react';
import { KNOWLEDGE_DOMAINS } from '../utils/constants';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';

export default function RepositoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setDomain, createSession } = useChatStore();

  const filtered = KNOWLEDGE_DOMAINS.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSearch = (domain: typeof KNOWLEDGE_DOMAINS[0]) => {
    setDomain(domain.id);
    createSession();
    navigate('/chat');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Knowledge Repository</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">10 structured knowledge domains covering all Deutsche Bank operations</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search domains, keywords, topics..."
            className="input pl-11"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 text-sm">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Domain Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((domain, i) => (
          <motion.div
            key={domain.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-6 group"
          >
            {/* Domain Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
                  style={{ backgroundColor: `${domain.color}20`, border: `1px solid ${domain.color}30` }}
                >
                  {domain.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{domain.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <FileText className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{domain.documentCount} documents</span>
                  </div>
                </div>
              </div>
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: domain.color }}
              />
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{domain.description}</p>

            {/* Keywords */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {domain.keywords.slice(0, 4).map((kw) => (
                <span
                  key={kw}
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${domain.color}15`, color: domain.color }}
                >
                  {kw}
                </span>
              ))}
            </div>

            {/* Key Insights */}
            <div className="border-t border-gray-100 dark:border-white/5 pt-4 mb-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Key Insights</p>
              <ul className="space-y-1">
                {domain.insights.slice(0, 2).map((insight) => (
                  <li key={insight} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: domain.color }} />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action */}
            <button
              onClick={() => handleSearch(domain)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg group-hover:scale-[1.01]"
              style={{ background: `linear-gradient(135deg, ${domain.color}, ${domain.color}cc)` }}
            >
              <Search className="w-3.5 h-3.5" />
              Ask About This Domain
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No domains match your search</p>
          <button onClick={() => setSearchQuery('')} className="text-blue-600 dark:text-blue-400 text-sm mt-2 hover:underline">Clear search</button>
        </div>
      )}
    </div>
  );
}
