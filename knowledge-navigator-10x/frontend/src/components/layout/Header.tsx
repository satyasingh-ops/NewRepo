import { Bell, Search, Menu, Moon, Sun, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../utils/helpers';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export default function Header({ onMenuClick, title }: HeaderProps) {
  const { theme, setTheme } = useSettingsStore();
  const { user } = useAuthStore();
  const isDark = theme === 'dark';

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  return (
    <header className={cn(
      'fixed top-0 right-0 z-30 h-16 flex items-center px-6 border-b transition-all',
      'left-64 bg-white/80 dark:bg-[#0d1421]/80 backdrop-blur-xl',
      'border-gray-200/60 dark:border-white/5'
    )}>
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>

      {/* Title */}
      {title && (
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status Badge */}
      <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 mr-4">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-medium text-green-700 dark:text-green-400">AI Active</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </motion.button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-db-500 to-navy-700 flex items-center justify-center text-white font-bold text-sm ml-1 cursor-pointer">
          {user?.name?.[0] || 'U'}
        </div>
      </div>
    </header>
  );
}
