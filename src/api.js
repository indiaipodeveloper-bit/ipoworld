import axios from 'axios';
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const API = axios.create({ baseURL });
API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
