import { create } from 'zustand';
import { Household, CalendarEntry, ShoppingItem, MealType, Recipe } from '../types';
import { householdService } from '../services/householdService';
import { calendarService } from '../services/calendarService';
import { shoppingService } from '../services/shoppingService';
import { getWeekStart } from '../utils/dateUtils';

interface HouseholdState {
  household: Household | null;
  calendarEntries: CalendarEntry[];
  shoppingList: ShoppingItem[];
  isLoading: boolean;
  error: string | null;

  createHousehold: (name: string) => Promise<void>;
  joinHousehold: (inviteCode: string) => Promise<void>;
  loadHousehold: (id: string) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  regenerateInviteCode: () => Promise<void>;

  loadCalendar: (weekStart?: string) => Promise<void>;
  addCalendarEntry: (recipe: Recipe, date: string, mealType: MealType) => Promise<void>;
  removeCalendarEntry: (entryId: string) => Promise<void>;

  loadShoppingList: (weekStart?: string) => Promise<void>;
  toggleShoppingItem: (itemName: string) => void;

  clearError: () => void;
}

export const useHouseholdStore = create<HouseholdState>((set, get) => ({
  household: null,
  calendarEntries: [],
  shoppingList: [],
  isLoading: false,
  error: null,

  createHousehold: async (name) => {
    set({ isLoading: true, error: null });
    try {
      const household = await householdService.create(name);
      set({ household });
    } catch (e: any) {
      set({ error: e.response?.data?.message ?? 'Error al crear el hogar' });
    } finally {
      set({ isLoading: false });
    }
  },

  joinHousehold: async (inviteCode) => {
    set({ isLoading: true, error: null });
    try {
      const household = await householdService.join(inviteCode);
      set({ household });
    } catch (e: any) {
      set({ error: e.response?.data?.message ?? 'Código incorrecto o expirado' });
    } finally {
      set({ isLoading: false });
    }
  },

  loadHousehold: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const household = await householdService.get(id);
      set({ household });
    } catch (e: any) {
      set({ error: 'Error al cargar el hogar' });
    } finally {
      set({ isLoading: false });
    }
  },

  removeMember: async (userId) => {
    const { household } = get();
    if (!household) return;
    try {
      await householdService.removeMember(household.id, userId);
      set({
        household: {
          ...household,
          members: household.members.filter((m) => m.userId !== userId),
        },
      });
    } catch (e: any) {
      set({ error: 'Error al eliminar miembro' });
    }
  },

  regenerateInviteCode: async () => {
    const { household } = get();
    if (!household) return;
    try {
      const inviteCode = await householdService.regenerateInviteCode(household.id);
      set({ household: { ...household, inviteCode } });
    } catch {
      set({ error: 'Error al regenerar código' });
    }
  },

  loadCalendar: async (weekStart) => {
    const { household } = get();
    if (!household) return;
    set({ isLoading: true });
    try {
      const start = weekStart ?? getWeekStart();
      const entries = await calendarService.getWeek(household.id, start);
      set({ calendarEntries: entries });
    } catch {
      set({ error: 'Error al cargar el calendario' });
    } finally {
      set({ isLoading: false });
    }
  },

  addCalendarEntry: async (recipe, date, mealType) => {
    const { household } = get();
    if (!household) return;
    try {
      const entry = await calendarService.addEntry(household.id, recipe.id, date, mealType);
      set({ calendarEntries: [...get().calendarEntries, entry] });
    } catch {
      set({ error: 'Error al agregar al calendario' });
    }
  },

  removeCalendarEntry: async (entryId) => {
    const { household } = get();
    if (!household) return;
    try {
      await calendarService.removeEntry(household.id, entryId);
      set({ calendarEntries: get().calendarEntries.filter((e) => e.id !== entryId) });
    } catch {
      set({ error: 'Error al eliminar entrada' });
    }
  },

  loadShoppingList: async (weekStart) => {
    const { household } = get();
    if (!household) return;
    set({ isLoading: true });
    try {
      const start = weekStart ?? getWeekStart();
      const items = await shoppingService.getWeekList(household.id, start);
      set({ shoppingList: items });
    } catch {
      set({ error: 'Error al cargar la lista de compras' });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleShoppingItem: (itemName) => {
    set({
      shoppingList: get().shoppingList.map((item) =>
        item.name === itemName ? { ...item, checked: !item.checked } : item
      ),
    });
  },

  clearError: () => set({ error: null }),
}));
