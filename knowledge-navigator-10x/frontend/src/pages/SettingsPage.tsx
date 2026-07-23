import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Palette, Bell, Mic, Zap, Type,
  RotateCcw, Save, ChevronRight, Moon, Sun, Monitor,
  Globe, Shield, CheckCircle
} from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import ThemeToggle from '../components/ui/ThemeToggle';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const settings = useSettingsStore();
  const { user } = useAuthStore();
  const { clearSession, sessions } = useChatStore();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    toast.success('Settings saved successfully!');
    setTimeout(() => setSaved(false), 3000);
  };

  const handleResetChat = () => {
    if (confirm('Are you sure you want to clear the current chat session?')) {
      clearSession();
      toast.success('Chat session cleared');
    }
  };

  const ToggleSwitch = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <motion.div
        animate={{ x: enabled ? 24 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
      />
    </button>
  );

  const sections = [
    {
      title: 'Profile',
      icon: User,
      content: (
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-xl">
            {user?.name?.[0] || 'U'}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            <span className="badge badge-blue mt-1">{user?.role}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Appearance',
      icon: Palette,
      content: (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</p>
            <ThemeToggle />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Font Size</p>
            <div className="flex gap-2">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => settings.setFontSize(size)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    settings.fontSize === size
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Notifications',
      icon: Bell,
      content: (
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Enable Notifications</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Receive alerts and updates</p>
          </div>
          <ToggleSwitch enabled={settings.notifications} onToggle={() => settings.setNotifications(!settings.notifications)} />
        </div>
      ),
    },
    {
      title: 'AI Features',
      icon: Zap,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Voice Input</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Use microphone to ask questions</p>
            </div>
            <ToggleSwitch enabled={settings.voiceInput} onToggle={() => settings.setVoiceInput(!settings.voiceInput)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Auto-Suggest Questions</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Show follow-up question suggestions</p>
            </div>
            <ToggleSwitch enabled={settings.autoSuggest} onToggle={() => settings.setAutoSuggest(!settings.autoSuggest)} />
          </div>
        </div>
      ),
    },
    {
      title: 'Data & Privacy',
      icon: Shield,
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5">
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">Clear Chat History</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{sessions.length} sessions stored locally</p>
            </div>
            <button
              onClick={handleResetChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-green-500" />
            All data is stored locally and securely. No personal data is sent to external servers.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Customize your Knowledge Navigator 10X experience</p>
      </div>

      <div className="space-y-4">
        {sections.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <section.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{section.title}</h2>
            </div>
            {section.content}
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all ${
            saved ? 'bg-green-600' : 'bg-gradient-to-r from-db-500 to-db-700'
          }`}
        >
          {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Settings</>}
        </button>
      </div>
    </div>
  );
}
