// ===== AUTH TYPES =====
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  token: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ===== CHAT TYPES =====
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: SourceDocument[];
  suggestedQuestions?: string[];
  domainDetected?: string;
  responseTime?: number;
  isLoading?: boolean;
  isBookmarked?: boolean;
}

export interface SourceDocument {
  content: string;
  metadata: Record<string, string>;
  relevance_score?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  persona: string;
  domain?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===== PERSONA & DOMAIN TYPES =====
export interface Persona {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface KnowledgeDomain {
  id: string;
  name: string;
  icon: string;
  description: string;
  documentCount: number;
  color: string;
  keywords: string[];
  insights: string[];
}

// ===== TOP 10 TYPES =====
export interface Top10Item {
  rank: number;
  title: string;
  description: string;
  action?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface Top10Response {
  topic: string;
  domain?: string;
  response: string;
  items?: Top10Item[];
}

// ===== ANALYTICS TYPES =====
export interface AnalyticsDashboard {
  total_queries: number;
  domain_distribution: Record<string, number>;
  persona_distribution: Record<string, number>;
  top_queries: Array<{ query: string; count: number }>;
  daily_trends: Array<{ date: string; count: number }>;
  avg_response_time: number;
  knowledge_gaps: string[];
}

export interface SearchHistoryItem {
  id: string;
  question: string;
  persona: string;
  domain?: string;
  timestamp: string;
  response_time: number;
  session_id: string;
}

// ===== SETTINGS TYPES =====
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  voiceInput: boolean;
  autoSuggest: boolean;
  fontSize: 'small' | 'medium' | 'large';
}
