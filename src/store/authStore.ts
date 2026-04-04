import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { authService } from '../services/authService';
import { Config } from '../constants/config';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<{ email: string } | null>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  loadStoredUser: () => Promise<void>;
  clearError: () => void;
  isOnTrial: () => boolean;
  hasActiveSubscription: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  loadStoredUser: async () => {
    const user = await authService.getStoredUser();
    if (user) set({ user, isAuthenticated: true });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user, token } = await authService.login(email, password);
      await AsyncStorage.setItem('accessToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch (e: any) {
      set({ error: e.response?.data?.message ?? 'Correo o contraseña incorrectos' });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      await authService.register(name, email, password);
      return { email: email.toLowerCase() };
    } catch (e: any) {
      set({ error: e.response?.data?.message ?? 'Error al registrarse' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  verifyEmail: async (email, code) => {
    set({ isLoading: true, error: null });
    try {
      const { user, token } = await authService.verifyEmail(email, code);
      await AsyncStorage.setItem('accessToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch (e: any) {
      set({ error: e.response?.data?.message ?? 'Código incorrecto' });
    } finally {
      set({ isLoading: false });
    }
  },

  resendCode: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await authService.resendCode(email);
    } catch (e: any) {
      set({ error: e.response?.data?.message ?? 'Error al reenviar código' });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await authService.forgotPassword(email);
    } catch (e: any) {
      set({ error: e.response?.data?.message ?? 'Error al enviar correo' });
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  isOnTrial: () => {
    const { user } = get();
    if (!user) return false;
    if (user.subscriptionStatus === 'trial') {
      const start = new Date(user.trialStart);
      const now = new Date();
      const diff = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= Config.TRIAL_DAYS;
    }
    return false;
  },

  hasActiveSubscription: () => {
    const { user } = get();
    if (!user) return false;
    return user.subscriptionStatus === 'active' || get().isOnTrial();
  },
}));
