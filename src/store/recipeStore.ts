import { create } from 'zustand';
import { Recipe, ScanResult } from '../types';
import { recipeService } from '../services/recipeService';

interface RecipeState {
  recipes: Recipe[];
  currentRecipe: Recipe | null;
  scanResult: ScanResult | null;
  isLoading: boolean;
  isScanLoading: boolean;
  error: string | null;

  generateRecipe: (dishName: string) => Promise<Recipe | null>;
  scanFridge: (imageBase64: string) => Promise<void>;
  saveRecipe: (recipe: Recipe) => Promise<Recipe | null>;
  setCurrentRecipe: (recipe: Recipe | null) => void;
  clearScanResult: () => void;
  clearError: () => void;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  currentRecipe: null,
  scanResult: null,
  isLoading: false,
  isScanLoading: false,
  error: null,

  generateRecipe: async (dishName) => {
    set({ isLoading: true, error: null, currentRecipe: null });
    try {
      const recipe = await recipeService.generateFromName(dishName);
      set({ currentRecipe: recipe });
      return recipe;
    } catch (e: any) {
      set({ error: 'Error al generar la receta. Intenta de nuevo.' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  scanFridge: async (imageBase64) => {
    set({ isScanLoading: true, error: null, scanResult: null });
    try {
      const result = await recipeService.scanImage(imageBase64);
      set({ scanResult: result });
    } catch {
      set({ error: 'Error al analizar la imagen. Intenta de nuevo.' });
    } finally {
      set({ isScanLoading: false });
    }
  },

  saveRecipe: async (recipe) => {
    try {
      const saved = await recipeService.save(recipe);
      set({ recipes: [...get().recipes, saved] });
      return saved;
    } catch {
      set({ error: 'Error al guardar la receta' });
      return null;
    }
  },

  setCurrentRecipe: (recipe) => set({ currentRecipe: recipe }),
  clearScanResult: () => set({ scanResult: null }),
  clearError: () => set({ error: null }),
}));
