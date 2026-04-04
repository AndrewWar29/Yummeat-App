// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  householdId?: string;
  trialStart: string; // ISO date
  subscriptionStatus: 'trial' | 'active' | 'expired';
}

// ─── Household ────────────────────────────────────────────────────────────────

export interface Household {
  id: string;
  name: string;
  adminId: string;
  inviteCode: string;
  members: HouseholdMember[];
}

export interface HouseholdMember {
  userId: string;
  name: string;
  role: 'admin' | 'member';
  joinedAt: string;
}

// ─── Recipe ───────────────────────────────────────────────────────────────────

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  steps: string[];
  estimatedMinutes: number;
  createdBy: string;
  createdAt: string;
}

// ─── Calendar ────────────────────────────────────────────────────────────────

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface CalendarEntry {
  id: string;
  householdId: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  recipe: Recipe;
}

// ─── Shopping List ────────────────────────────────────────────────────────────

export interface ShoppingItem {
  name: string;
  totalQuantity: string;
  unit: string;
  checked: boolean;
}

// ─── Scan & Cook ──────────────────────────────────────────────────────────────

export interface ScanResult {
  detectedIngredients: string[];
  suggestedRecipes: Recipe[];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
}
