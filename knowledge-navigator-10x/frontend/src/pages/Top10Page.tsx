import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, Loader2, Copy, Download, ChevronRight, Plus } from 'lucide-react';
import { chatApi } from '../api/chatApi';
import { TOP_10_TOPICS, KNOWLEDGE_DOMAINS } from '../utils/constants';
import { useChatStore } from '../store/chatStore';
import { copyToClipboard, exportToPDF } from '../utils/helpers';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';

export default function Top10Page() {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { currentPersona } = useChatStore();

  const activeTopic = customTopic || selectedTopic;

  const handleGenerate = async () => {
    if (!activeTopic.trim()) return;
    setIsLoading(true);
    setResult(null);
    try {
      const response = await chatApi.generateTop10({
        topic: activeTopic,
        domain: selectedDomain || undefined,
        persona: currentPersona,
      });
      setResult(response.response);
    } catch {
      toast.error('Failed to generate. Ensure backend is running.');
      setResult(`**🏆 Top 10: ${activeTopic}**\n\n> **Demo Mode**: Connect the backend to generate AI-powered Top 10 lists.\n\nHere are the top areas to focus on for **${activeTopic}**:\n\n1. **Establish Clear Ownership** — Every item must have a named, accountable owner\n2. **Document Everything** — Maintain audit-ready documentation for all activities\n3. **Identify Risks Early** — Proactive identification prevents escalation\n4. **Implement Effective Controls** — Design controls to prevent, detect, and correct issues\n5. **Test Regularly** — Validate effectiveness through regular testing cycles\n6. **Escalate Promptly** — Never delay escalation of material issues\n7. **Monitor Continuously** — Implement KPIs and track trends\n8. **Review Annually** — Subject all processes to annual certification\n9. **Train Your Team** — Ensure all stakeholders understand their responsibilities\n10. **Improve Continuously** — Apply lessons learned and optimize processes`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (result) {
      await copyToClipboard(result);
      toast.success('Copied to clipboard!');
    }
  };

  const handleExport = () => {
    if (result) exportToPDF(result, `top10-${activeTopic.replace(/\s+/g, '-').toLowerCase()}`);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Top 10 Generator</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Generate AI-powered Top 10 checklists for any Deutsche Bank topic</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Topic Selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Predefined Topics */}
          <div className="glass-card">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm mb-3">Popular Topics</h2>
            <div className="space-y-1.5">
              {TOP_10_TOPICS.map((topic) => (
                <button
                  key={topic.topic}
                  onClick={() => { setSelectedTopic(topic.topic); setCustomTopic(''); setSelectedDomain(topic.domain); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-all ${
                    selectedTopic === topic.topic && !customTopic
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                      : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-base">{topic.icon}</span>
                  <span className="font-medium">{topic.topic}</span>
                  {selectedTopic === topic.topic && !customTopic && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Topic */}
          <div className="glass-card">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm mb-3">Custom Topic</h2>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => { setCustomTopic(e.target.value); setSelectedTopic(''); }}
              placeholder="e.g. Risk Escalation Actions..."
              className="input mb-3"
            />
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="input"
            >
              <option value="">All Domains</option>
              {KNOWLEDGE_DOMAINS.map((d) => (
                <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!activeTopic.trim() || isLoading}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white transition-all ${
              activeTopic.trim() && !isLoading
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:shadow-lg'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Generate Top 10</>
            )}
          </button>
        </div>

        {/* Right: Result */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card flex flex-col items-center justify-center py-20"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-4"
                >
                  <Trophy className="w-8 h-8 text-white" />
                </motion.div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Generating your Top 10 list...</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Consulting enterprise knowledge base</p>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
              >
                {/* Action Buttons */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Results for: <span className="text-blue-600 dark:text-blue-400">{activeTopic}</span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                    <button
                      onClick={handleExport}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                    >
                      <Download className="w-3 h-3" /> PDF
                    </button>
                  </div>
                </div>

                <div className="prose-db text-sm text-gray-800 dark:text-gray-100">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({children}) => <p className="mb-3">{children}</p>,
                      strong: ({children}) => <strong className="font-semibold text-amber-600 dark:text-amber-400">{children}</strong>,
                      ol: ({children}) => <ol className="space-y-3 list-none p-0">{children}</ol>,
                      li: ({children}) => (
                        <motion.li
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5"
                        >
                          {children}
                        </motion.li>
                      ),
                      h1: ({children}) => <h1 className="text-xl font-black text-gray-900 dark:text-white mb-4">{children}</h1>,
                      h2: ({children}) => <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{children}</h2>,
                    }}
                  >
                    {result}
                  </ReactMarkdown>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-10 h-10 text-amber-500" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Select a topic to get started</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                  Choose from popular topics or enter a custom topic, then click Generate Top 10
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
