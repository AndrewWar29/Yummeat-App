import api from './api';
import { CalendarEntry, MealType } from '../types';

export const calendarService = {
  async getWeek(householdId: string, weekStart: string): Promise<CalendarEntry[]> {
    const { data } = await api.get(`/households/${householdId}/calendar`, {
      params: { weekStart },
    });
    return data;
  },

  async addEntry(
    householdId: string,
    recipeId: string,
    date: string,
    mealType: MealType
  ): Promise<CalendarEntry> {
    const { data } = await api.post(`/households/${householdId}/calendar`, {
      recipeId,
      date,
      mealType,
    });
    return data;
  },

  async removeEntry(householdId: string, entryId: string): Promise<void> {
    await api.delete(`/households/${householdId}/calendar/${entryId}`);
  },
};
