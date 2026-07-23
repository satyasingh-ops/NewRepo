import { useState, useRef, type KeyboardEvent } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';
import { useSettingsStore } from '../../store/settingsStore';

// Browser Speech Recognition custom interface
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

interface ISpeechRecognitionEvent {
  results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionResultList {
  [index: number]: ISpeechRecognitionResult;
  length: number;
}

interface ISpeechRecognitionResult {
  [index: number]: { transcript: string };
}


interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const { voiceInput } = useSettingsStore();

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  };

  const toggleVoice = () => {
    if (!voiceInput) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI() as ISpeechRecognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  return (
    <div className="relative">
      {/* Voice indicator */}
      {isListening && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-12 left-0 right-0 flex items-center justify-center gap-2 text-red-500 text-sm font-medium"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-2 h-2 rounded-full bg-red-500"
          />
          Listening... speak now
        </motion.div>
      )}

      <div className={cn(
        'flex items-end gap-3 p-4 rounded-2xl border transition-all',
        'bg-white dark:bg-[#1a2332]',
        'border-gray-200 dark:border-white/10',
        'focus-within:border-blue-500 dark:focus-within:border-blue-500',
        'focus-within:shadow-glow-sm',
        disabled && 'opacity-60'
      )}>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder || 'Ask anything about Deutsche Bank policies, procedures, or best practices...'}
          rows={1}
          className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none resize-none leading-relaxed"
          style={{ maxHeight: '160px' }}
        />

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Voice Button */}
          {voiceInput && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleVoice}
              disabled={disabled}
              className={cn(
                'p-2 rounded-xl transition-colors',
                isListening
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-500 animate-pulse'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10'
              )}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </motion.button>
          )}

          {/* Send Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={disabled || !input.trim()}
            className={cn(
              'p-2.5 rounded-xl transition-all',
              input.trim() && !disabled
                ? 'bg-gradient-to-r from-db-500 to-db-700 text-white shadow-glow-sm hover:shadow-glow'
                : 'bg-gray-100 dark:bg-white/10 text-gray-400 cursor-not-allowed'
            )}
            title="Send message (Enter)"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
        Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-gray-600 dark:text-gray-300 font-mono">Enter</kbd> to send · <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-gray-600 dark:text-gray-300 font-mono">Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}
