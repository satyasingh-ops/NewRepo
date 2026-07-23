import { useState } from 'react';
import { ChevronDown, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PERSONAS } from '../../utils/constants';
import { useChatStore } from '../../store/chatStore';
import { cn } from '../../utils/helpers';

export default function PersonaSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentPersona, setPersona } = useChatStore();

  const selected = PERSONAS.find((p) => p.id === currentPersona) || PERSONAS[0];

  const handleSelect = (id: string) => {
    setPersona(id);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 transition-colors border border-gray-200 dark:border-white/10"
      >
        <span className="text-lg leading-none">{selected.icon}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-white hidden sm:block">{selected.name}</span>
        <ChevronDown className={cn('w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 left-0 z-50 w-72 bg-white dark:bg-[#1a2332] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden"
            >
              <div className="p-3 border-b border-gray-100 dark:border-white/10">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Select Your Persona</p>
              </div>
              <div className="p-2 max-h-72 overflow-y-auto">
                {PERSONAS.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => handleSelect(persona.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                      persona.id === currentPersona
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                    )}
                  >
                    <span className="text-xl">{persona.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{persona.name}</p>
                      {persona.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{persona.description}</p>
                      )}
                    </div>
                    {persona.id === currentPersona && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
