import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, MessageSquare, Trophy, Database,
  BarChart3, Zap, ArrowRight, Shield, Globe,
  Sparkles, ChevronRight, Star, BookOpen
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const features = [
  {
    icon: Search,
    title: 'Smart Search',
    description: 'Semantic search across 1000+ documents instantly. Ask in natural language, get precise answers.',
    color: 'from-blue-500 to-blue-700',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    icon: MessageSquare,
    title: 'AI Assistant',
    description: 'Powered by Google Gemini. Role-adaptive responses tailored to your persona and context.',
    color: 'from-purple-500 to-purple-700',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    icon: Trophy,
    title: 'Top 10 Generator',
    description: 'Generate instant Top 10 checklists for audit readiness, risk controls, compliance checks and more.',
    color: 'from-amber-500 to-amber-700',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
  },
  {
    icon: Zap,
    title: 'Semantic Search',
    description: 'Vector-based retrieval using ChromaDB. Finds contextually relevant documents, not just keywords.',
    color: 'from-green-500 to-green-700',
    bg: 'bg-green-50 dark:bg-green-900/20',
  },
  {
    icon: Database,
    title: 'Knowledge Repository',
    description: '10 structured knowledge domains covering Operations, Risk, Audit, Compliance, EUDA and more.',
    color: 'from-cyan-500 to-cyan-700',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Real-time insights on knowledge usage, search trends, popular domains and knowledge gaps.',
    color: 'from-rose-500 to-rose-700',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
  },
];

const stats = [
  { number: '10', label: 'Knowledge Domains', icon: Database },
  { number: '10', label: 'User Personas', icon: Globe },
  { number: '1000+', label: 'Documents Indexed', icon: BookOpen },
  { number: '10X', label: 'Faster Search', icon: Zap },
];

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Apply dark mode on home page
    document.documentElement.classList.add('dark');
    return () => { /* keep dark mode */ };
  }, []);

  return (
    <div className="min-h-screen bg-[#000a1a] text-white overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">Knowledge Navigator <span className="text-blue-300">10X</span></span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-full bg-white/10">
              <Shield className="w-3 h-3 text-blue-300" />
              <span className="text-xs text-blue-300">Deutsche Bank</span>
            </div>
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary text-sm py-2"
              >
                Go to Dashboard
              </button>
            ) : (
              <Link to="/login" className="btn-primary text-sm py-2">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        {/* Animated background */}
        <div className="absolute inset-0 bg-hero-gradient opacity-90" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />

        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-blue-500/10 border border-blue-500/20"
            style={{
              width: Math.random() * 200 + 50,
              height: Math.random() * 200 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 mb-8"
          >
            <Star className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">Hackathon 2026 · Deutsche Bank Innovation</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black leading-tight mb-6"
          >
            Knowledge Navigator <span className="gradient-text">10X</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-blue-100/80 mb-4 font-light"
          >
            Navigate Enterprise Knowledge <span className="text-white font-semibold">10X Faster</span>
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-base text-blue-200/60 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            AI-powered enterprise knowledge assistant for Deutsche Bank employees.
            Ask questions, get instant answers from SOPs, policies, risk frameworks, and more.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className="btn-primary text-base px-8 py-4 group"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white border border-white/20 hover:bg-white/10 transition-all text-base"
            >
              Explore Knowledge
              <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 text-sm flex flex-col items-center gap-2"
        >
          <span className="text-xs">Scroll to explore</span>
          <div className="w-0.5 h-8 bg-white/20 rounded-full" />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-white/5 border-y border-white/10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-black gradient-text mb-2">{stat.number}</div>
              <div className="text-blue-300/70 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Everything you need to <span className="gradient-text">navigate knowledge</span>
            </h2>
            <p className="text-blue-200/60 max-w-2xl mx-auto">
              One intelligent interface for all Deutsche Bank enterprise knowledge.
              Powered by cutting-edge AI and semantic search technology.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                className="glass rounded-2xl p-6 border border-white/10 group cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-blue-200/60 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-blue-900/50 to-purple-900/50">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-black mb-6"
          >
            Ready to navigate knowledge <span className="gradient-text">10X faster?</span>
          </motion.h2>
          <p className="text-blue-200/70 mb-8">
            Join Deutsche Bank employees who are already using AI to find answers instantly.
          </p>
          <Link to="/login" className="btn-primary text-base px-10 py-4">
            <Sparkles className="w-5 h-5" />
            Start Now — It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-semibold">Knowledge Navigator 10X</span>
        </div>
        <p className="text-blue-300/40 text-xs">
          © 2026 Deutsche Bank AG · Hackathon Innovation Project · "Navigate Enterprise Knowledge 10X Faster"
        </p>
      </footer>
    </div>
  );
}
