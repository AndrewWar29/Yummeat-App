import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { User, AuthTokens } from '../types';

export const authService = {
  async register(name: string, email: string, password: string): Promise<User> {
    const { data } = await api.post('/auth/register', { name, email, password });
    await storeTokens(data.tokens);
    return data.user;
  },

  async login(email: string, password: string): Promise<User> {
    const { data } = await api.post('/auth/login', { email, password });
    await storeTokens(data.tokens);
    return data.user;
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', { token, newPassword });
  },

  async getStoredUser(): Promise<User | null> {
    const raw = await AsyncStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },
};

async function storeTokens(tokens: AuthTokens) {
  await AsyncStorage.setItem('accessToken', tokens.accessToken);
  await AsyncStorage.setItem('refreshToken', tokens.refreshToken);
}
