import axios from 'axios';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${baseUrl}/api`;

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// We no longer need the request interceptor for localStorage
// because the HttpOnly cookie is sent automatically by the browser.

export default client;
