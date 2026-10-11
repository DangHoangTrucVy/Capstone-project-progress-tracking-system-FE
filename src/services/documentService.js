import api from './api';

export const getGroupDocuments = async (id, params) => (await api.get(`/groups/${id}/documents`, { params })).data;
export const submitDocumentLink = async (id, data) => (await api.post(`/groups/${id}/documents`, data)).data;
export const uploadDocument = async (id, data) => (await api.post(`/groups/${id}/documents`, data, { headers: { 'Content-Type': undefined } })).data;
export const downloadDocument = async (id) => api.get(`/documents/${id}/file`, { responseType: 'blob' });
