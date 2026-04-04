import axios from 'axios';
import { Recipe, ScanResult, Ingredient } from '../types';
import { Config, GROK_MODEL, GEMINI_VISION_MODEL, SYSTEM_PROMPT_RECIPE, SYSTEM_PROMPT_SCAN } from '../constants/config';
import api from './api';

// ─── Grok (xAI): generate recipe from dish name ──────────────────────────────

export const recipeService = {
  async generateFromName(dishName: string): Promise<Recipe> {
    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: GROK_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_RECIPE },
          { role: 'user', content: `Plato: ${dishName}` },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      },
      {
        headers: {
          Authorization: `Bearer ${Config.GROK_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const raw = response.data.choices[0].message.content;
    const parsed = JSON.parse(raw);
    return mapToRecipe(parsed, dishName);
  },

  // ─── Gemini 2.5 Flash Lite: scan fridge image ────────────────────────────

  async scanImage(imageBase64: string): Promise<ScanResult> {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_VISION_MODEL}:generateContent?key=${Config.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT_SCAN },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageBase64,
                },
              },
              { text: 'Analiza esta imagen y devuelve el JSON solicitado.' },
            ],
          },
        ],
        generationConfig: { maxOutputTokens: 2048, temperature: 0.4 },
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const raw = response.data.candidates[0].content.parts[0].text;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    return {
      detectedIngredients: parsed.ingredientes_detectados,
      suggestedRecipes: parsed.recetas_sugeridas.map((r: any) => mapToRecipe(r, r.nombre_receta)),
    };
  },

  // ─── Save recipe to backend ────────────────────────────────────────────────

  async save(recipe: Recipe): Promise<Recipe> {
    const { data } = await api.post('/recipes', recipe);
    return data;
  },

  async getById(id: string): Promise<Recipe> {
    const { data } = await api.get(`/recipes/${id}`);
    return data;
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapToRecipe(parsed: any, fallbackName: string): Recipe {
  return {
    id: '',
    name: parsed.nombre_receta ?? fallbackName,
    ingredients: (parsed.lista_ingredientes ?? []).map((i: any): Ingredient => ({
      name: i.nombre,
      quantity: i.cantidad,
      unit: i.unidad,
    })),
    steps: parsed.pasos ?? [],
    estimatedMinutes: parsed.tiempo_estimado_minutos ?? 0,
    createdBy: '',
    createdAt: new Date().toISOString(),
  };
}
