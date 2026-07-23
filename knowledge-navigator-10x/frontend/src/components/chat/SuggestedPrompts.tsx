import { Lightbulb, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface SuggestedPromptsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
}

export default function SuggestedPrompts({ prompts, onSelect }: SuggestedPromptsProps) {
  if (!prompts || prompts.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Follow-up questions</span>
      </div>
      <div className="space-y-1.5">
        {prompts.map((prompt, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(prompt)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 border border-gray-200 dark:border-white/10 hover:border-blue-200 dark:hover:border-blue-700 transition-all group"
          >
            <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
            {prompt}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
