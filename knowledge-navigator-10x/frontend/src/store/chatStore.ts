import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, ChatSession } from '../types';
import { generateId } from '../utils/helpers';
import { chatApi } from '../api/chatApi';

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  currentPersona: string;
  currentDomain: string | null;
  isLoading: boolean;
  suggestions: string[];

  // Actions
  createSession: () => string;
  setActiveSession: (id: string) => void;
  getActiveSession: () => ChatSession | null;
  sendMessage: (content: string) => Promise<void>;
  setPersona: (persona: string) => void;
  setDomain: (domain: string | null) => void;
  clearSession: () => void;
  deleteSession: (id: string) => void;
  setSuggestions: (suggestions: string[]) => void;
  toggleBookmark: (messageId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      currentPersona: 'operations_analyst',
      currentDomain: null,
      isLoading: false,
      suggestions: [],

      createSession: () => {
        const id = generateId();
        const session: ChatSession = {
          id,
          title: 'New Conversation',
          messages: [],
          persona: get().currentPersona,
          domain: get().currentDomain || undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          sessions: [session, ...state.sessions],
          activeSessionId: id,
        }));
        return id;
      },

      setActiveSession: (id: string) => set({ activeSessionId: id }),

      getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find((s) => s.id === activeSessionId) || null;
      },

      sendMessage: async (content: string) => {
        const state = get();
        let sessionId = state.activeSessionId;

        // Create session if none exists
        if (!sessionId) {
          sessionId = get().createSession();
        }

        const userMessage: ChatMessage = {
          id: generateId(),
          role: 'user',
          content,
          timestamp: new Date(),
        };

        const loadingMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          isLoading: true,
        };

        // Add user message + loading state
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: [...s.messages, userMessage, loadingMessage],
                  title: s.messages.length === 0 ? content.substring(0, 50) : s.title,
                  updatedAt: new Date(),
                }
              : s
          ),
          isLoading: true,
        }));

        try {
          const session = get().sessions.find((s) => s.id === sessionId);
          const response = await chatApi.sendMessage({
            question: content,
            persona: state.currentPersona,
            domain: state.currentDomain || undefined,
            session_id: sessionId,
            conversation_history: session?.messages.slice(-10) || [],
          });

          const aiMessage: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: response.answer,
            timestamp: new Date(),
            sources: response.sources,
            suggestedQuestions: response.suggested_questions,
            domainDetected: response.domain_detected,
            responseTime: response.response_time,
          };

          // Replace loading message with actual response
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId
                ? {
                    ...s,
                    messages: [...s.messages.filter((m) => !m.isLoading), aiMessage],
                    updatedAt: new Date(),
                  }
                : s
            ),
            isLoading: false,
            suggestions: response.suggested_questions || [],
          }));
        } catch {
          const errorMessage: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: '❌ **Connection Error**\n\nUnable to connect to the backend. Please ensure the FastAPI server is running on port 8000.\n\n```\ncd backend\npython -m uvicorn app.main:app --reload\n```',
            timestamp: new Date(),
          };

          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId
                ? { ...s, messages: [...s.messages.filter((m) => !m.isLoading), errorMessage] }
                : s
            ),
            isLoading: false,
          }));
        }
      },

      setPersona: (persona: string) => {
        set({ currentPersona: persona });
        // Update active session persona
        const { activeSessionId } = get();
        if (activeSessionId) {
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === activeSessionId ? { ...s, persona } : s
            ),
          }));
        }
      },

      setDomain: (domain: string | null) => set({ currentDomain: domain }),

      clearSession: () => {
        const { activeSessionId } = get();
        if (activeSessionId) {
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === activeSessionId ? { ...s, messages: [], updatedAt: new Date() } : s
            ),
          }));
        }
      },

      deleteSession: (id: string) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
        }));
      },

      setSuggestions: (suggestions: string[]) => set({ suggestions }),

      toggleBookmark: (messageId: string) => {
        set((state) => ({
          sessions: state.sessions.map((s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === messageId ? { ...m, isBookmarked: !m.isBookmarked } : m
            ),
          })),
        }));
      },
    }),
    {
      name: 'kn10x_chat',
      partialize: (state) => ({
        sessions: state.sessions.slice(0, 20), // Keep last 20 sessions
        currentPersona: state.currentPersona,
        currentDomain: state.currentDomain,
      }),
    }
  )
);
