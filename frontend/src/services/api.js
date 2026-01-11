import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL
});

// User APIs
export const registerUser = (data) => api.post('/users/register', data);
export const loginUser = (data) => api.post('/users/login', data);

// Document APIs
export const uploadDocument = (formData) => api.post('/documents/upload', formData);
export const getAllDocuments = () => api.get('/documents');
export const getDocumentById = (id) => api.get(`/documents/${id}`);

// Annotation APIs
export const createAnnotation = (data) => api.post('/annotations', data);
export const getAnnotationsByDocument = (documentId) => api.get(`/annotations/${documentId}`);
export const deleteAnnotation = (id, userId) => api.delete(`/annotations/${id}`, { data: { userId } });

export default api;