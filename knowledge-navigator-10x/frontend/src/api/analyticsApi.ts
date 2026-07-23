import apiClient from './client';

export const analyticsApi = {
  getDashboard: async () => {
    const { data } = await apiClient.get('/api/analytics/dashboard');
    return data;
  },

  getHistory: async (limit = 50) => {
    const { data } = await apiClient.get('/api/analytics/history', { params: { limit } });
    return data;
  },

  addBookmark: async (params: { user_id: string; question: string; answer: string; domain: string }) => {
    const { data } = await apiClient.post('/api/analytics/bookmark', params);
    return data;
  },

  getBookmarks: async (userId: string) => {
    const { data } = await apiClient.get(`/api/analytics/bookmarks/${userId}`);
    return data.bookmarks;
  },
};
