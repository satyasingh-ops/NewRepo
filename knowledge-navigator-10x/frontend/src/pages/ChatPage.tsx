import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, ChevronRight, Trash2, Sparkles, Bot } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import PersonaSelector from '../components/chat/PersonaSelector';
import TypingIndicator from '../components/chat/TypingIndicator';
import { KNOWLEDGE_DOMAINS, PERSONAS } from '../utils/constants';
import { formatRelativeTime, cn } from '../utils/helpers';

const STARTER_PROMPTS = [
  { text: 'Top 10 Audit Readiness Actions', icon: '🔍', domain: 'audit' },
  { text: 'What are the key SLA requirements for Operations?', icon: '⚙️', domain: 'operations' },
  { text: 'Explain the Three Lines of Defense model', icon: '🛡️', domain: 'risk' },
  { text: 'Top 10 Compliance Checks for Deutsche Bank', icon: '✅', domain: 'compliance' },
  { text: 'How do I register an EUDA application?', icon: '💻', domain: 'euda' },
  { text: 'What mandatory training do I need as a new joiner?', icon: '📚', domain: 'learning' },
];

export default function ChatPage() {
  const {
    sessions, activeSessionId, isLoading,
    createSession, setActiveSession, sendMessage,
    deleteSession, getActiveSession, setDomain, currentDomain
  } = useChatStore();
  const [showSessions, setShowSessions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeSession = getActiveSession();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages?.length, isLoading]);

  const handleNewChat = () => {
    createSession();
  };

  const handleSend = async (message: string) => {
    if (!activeSessionId) createSession();
    await sendMessage(message);
  };

  const handlePromptSelect = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-[#0d1421]">
      {/* Sessions Sidebar */}
      <AnimatePresence>
        {showSessions && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-shrink-0 border-r border-gray-200 dark:border-white/5 bg-white dark:bg-[#111827] overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100 dark:border-white/5">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-db-500 to-db-700 text-white font-semibold text-sm hover:shadow-glow transition-all"
              >
                <Plus className="w-4 h-4" />
                New Conversation
              </button>
            </div>

            <div className="overflow-y-auto h-full pb-20">
              {sessions.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 dark:text-gray-500">No conversations yet</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => setActiveSession(session.id)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer group transition-colors',
                        session.id === activeSessionId
                          ? 'bg-blue-50 dark:bg-blue-900/30'
                          : 'hover:bg-gray-50 dark:hover:bg-white/5'
                      )}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        session.id === activeSessionId
                          ? 'bg-blue-100 dark:bg-blue-800/50'
                          : 'bg-gray-100 dark:bg-white/10'
                      )}>
                        <MessageSquare className={cn(
                          'w-3.5 h-3.5',
                          session.id === activeSessionId ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-xs font-medium truncate',
                          session.id === activeSessionId
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-700 dark:text-gray-300'
                        )}>
                          {session.title || 'New Conversation'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {session.messages.length} messages · {formatRelativeTime(session.updatedAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-[#111827] flex-shrink-0">
          <button
            onClick={() => setShowSessions(!showSessions)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <ChevronRight className={cn('w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform', showSessions && 'rotate-180')} />
          </button>

          <div className="flex-1 flex items-center gap-3 flex-wrap">
            <PersonaSelector />

            {/* Domain Filter */}
            <select
              value={currentDomain || ''}
              onChange={(e) => setDomain(e.target.value || null)}
              className="text-sm px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white outline-none cursor-pointer"
            >
              <option value="">All Domains</option>
              {KNOWLEDGE_DOMAINS.map((d) => (
                <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            AI Ready
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {!activeSession || activeSession.messages.length === 0 ? (
            // Empty state with starter prompts
            <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center mb-10"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto mb-5 shadow-glow">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                  Neura <span className="gradient-text">DB</span>
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Your AI assistant — ask anything about Deutsche Bank policies, procedures, risk, compliance, and more.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {STARTER_PROMPTS.map((prompt, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => handlePromptSelect(prompt.text)}
                    className="flex items-center gap-3 p-4 rounded-2xl text-left bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-card-hover transition-all group"
                  >
                    <span className="text-2xl flex-shrink-0">{prompt.icon}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">{prompt.text}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {activeSession.messages.map((message) => (
                message.isLoading ? (
                  <TypingIndicator key={message.id} />
                ) : (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onPromptSelect={handlePromptSelect}
                  />
                )
              ))}
              {isLoading && !activeSession.messages.some(m => m.isLoading) && (
                <TypingIndicator />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-[#111827] flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <ChatInput
              onSend={handleSend}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
