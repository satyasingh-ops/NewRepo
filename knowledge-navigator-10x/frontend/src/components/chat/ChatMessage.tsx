import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy, Check, Download, Bookmark, BookmarkCheck,
  Clock, Zap, Globe
} from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../../types';
import SourceCitation from './SourceCitation';
import SuggestedPrompts from './SuggestedPrompts';
import { copyToClipboard, exportToPDF, formatRelativeTime, cn } from '../../utils/helpers';
import { useChatStore } from '../../store/chatStore';
import { PERSONAS, KNOWLEDGE_DOMAINS } from '../../utils/constants';

interface ChatMessageProps {
  message: ChatMessageType;
  onPromptSelect: (prompt: string) => void;
}

export default function ChatMessage({ message, onPromptSelect }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const { toggleBookmark } = useChatStore();
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await copyToClipboard(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    exportToPDF(message.content, `kn10x-response-${message.id}`);
  };

  const domainInfo = message.domainDetected
    ? KNOWLEDGE_DOMAINS.find((d) => d.id === message.domainDetected)
    : null;

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-end mb-6"
      >
        <div className="flex flex-col items-end gap-1 max-w-2xl">
          <div className="chat-bubble-user">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 px-1">
            {formatRelativeTime(message.timestamp)}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-start gap-4 mb-6"
    >
      {/* AI Avatar */}
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-db-500 to-navy-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-glow-sm">
        AI
      </div>

      <div className="flex-1 min-w-0">
        {/* Domain & Response Time badges */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {domainInfo && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
              <span>{domainInfo.icon}</span>
              {domainInfo.name}
            </span>
          )}
          {message.responseTime && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5">
              <Clock className="w-3 h-3" />
              {message.responseTime}s
            </span>
          )}
        </div>

        {/* Message Content */}
        <div className="chat-bubble-ai">
          <div className="prose-db text-sm text-gray-800 dark:text-gray-100 leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-blue-700 dark:text-blue-300">{children}</strong>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-gray-900 dark:text-white">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 text-gray-900 dark:text-white">{children}</h3>,
                code: ({ children, className }) => {
                  const isBlock = className?.includes('language-');
                  return isBlock ? (
                    <code className="block bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-xs font-mono overflow-x-auto mb-3">{children}</code>
                  ) : (
                    <code className="inline bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5 text-xs font-mono text-blue-700 dark:text-blue-300">{children}</code>
                  );
                },
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400 my-3">{children}</blockquote>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Sources */}
          {message.sources && message.sources.length > 0 && (
            <SourceCitation sources={message.sources} />
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              <Download className="w-3 h-3" />
              Export PDF
            </button>

            <button
              onClick={() => toggleBookmark(message.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors',
                message.isBookmarked
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white'
              )}
            >
              {message.isBookmarked ? (
                <BookmarkCheck className="w-3 h-3" />
              ) : (
                <Bookmark className="w-3 h-3" />
              )}
              {message.isBookmarked ? 'Saved' : 'Save'}
            </button>

            <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
              {formatRelativeTime(message.timestamp)}
            </span>
          </div>
        </div>

        {/* Suggested follow-up questions */}
        {message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
          <SuggestedPrompts
            prompts={message.suggestedQuestions}
            onSelect={onPromptSelect}
          />
        )}
      </div>
    </motion.div>
  );
}
