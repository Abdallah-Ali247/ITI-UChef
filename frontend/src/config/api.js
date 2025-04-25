// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default API_URL;
