import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SourceDocument } from '../../types';
import { truncate } from '../../utils/helpers';

interface SourceCitationProps {
  sources: SourceDocument[];
}

export default function SourceCitation({ sources }: SourceCitationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
      >
        <FileText className="w-3 h-3" />
        {sources.length} source{sources.length > 1 ? 's' : ''} referenced
        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 space-y-2 overflow-hidden"
          >
            {sources.map((source, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    [{index + 1}] {source.metadata?.filename || 'Document'}
                  </span>
                  <span className="badge badge-blue">{source.metadata?.domain || 'general'}</span>
                  {source.relevance_score !== undefined && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                      {(source.relevance_score * 100).toFixed(0)}% match
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {truncate(source.content, 200)}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
