import api from './api';
import { ShoppingItem } from '../types';

export const shoppingService = {
  async getWeekList(householdId: string, weekStart: string): Promise<ShoppingItem[]> {
    const { data } = await api.get(`/households/${householdId}/shopping-list`, {
      params: { weekStart },
    });
    return data;
  },
};
