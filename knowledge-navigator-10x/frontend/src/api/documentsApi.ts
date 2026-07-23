import apiClient from './client';

export const documentsApi = {
  getDomains: async () => {
    const { data } = await apiClient.get('/api/documents/domains');
    return data.domains;
  },

  uploadDocument: async (file: File, domain: string, description = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('domain', domain);
    formData.append('description', description);
    const { data } = await apiClient.post('/api/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  searchDocuments: async (query: string, domain?: string, topK = 5) => {
    const { data } = await apiClient.post('/api/documents/search', { query, domain, top_k: topK });
    return data.results;
  },

  ingestKnowledgeBase: async () => {
    const { data } = await apiClient.post('/api/documents/ingest');
    return data;
  },

  getStatus: async () => {
    const { data } = await apiClient.get('/api/documents/status');
    return data;
  },
};
