import axios, { InternalAxiosRequestConfig } from 'axios';
import { getToken } from '../auth/tokenStorage';

// Base URL detection: Web browser (http://localhost:5000) vs Native Android (http://10.0.2.2:5000)
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';
const defaultHost = isWeb ? 'http://localhost:5000' : 'http://10.0.2.2:5000';
const rawBaseUrl = process.env.EXPO_PUBLIC_API_URL || defaultHost;
const baseUrl = rawBaseUrl.replace(/\/+$/, '');
const API_URL = `${baseUrl}/api`;

console.log("[DIAGNOSTIC] Final Resolved API_URL:", API_URL);

const client = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 seconds to allow for Render free-tier cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach Bearer token
client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

export default client;
