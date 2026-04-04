import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { User } from '../types';

export const authService = {
  async register(name: string, email: string, password: string): Promise<void> {
    await api.post('/auth/register', { name, email, password });
  },

  async verifyEmail(email: string, code: string): Promise<{ user: User; token: string }> {
    const { data } = await api.post('/auth/verify', { email, code });
    return { user: data.user, token: data.token };
  },

  async resendCode(email: string): Promise<void> {
    await api.post('/auth/resend-code', { email });
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const { data } = await api.post('/auth/login', { email, password });
    return { user: data.user, token: data.token };
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('user');
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async getStoredUser(): Promise<User | null> {
    const raw = await AsyncStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },
};
