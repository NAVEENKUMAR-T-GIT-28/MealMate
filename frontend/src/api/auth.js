import client from './client';

export const authApi = {
  signup: async (fullName, email, password) => {
    const response = await client.post('/auth/signup', { full_name: fullName, email, password });
    return response.data;
  },
  login: async (email, password) => {
    const response = await client.post('/auth/login', { email, password });
    return response.data;
  },
  getMe: async () => {
    const response = await client.get('/auth/me');
    return response.data;
  },
  updateProfile: async (fullName) => {
    const response = await client.put('/auth/me', { full_name: fullName });
    return response.data;
  }
};
