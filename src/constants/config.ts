export const Config = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.yummeat.app',
  GROK_API_KEY: process.env.EXPO_PUBLIC_GROK_API_KEY ?? '',
  TRIAL_DAYS: 7,
  INVITE_CODE_LENGTH: 6,
};

export const GROK_MODEL = 'grok-4.20-0309-non-reasoning';
export const GROK_VISION_MODEL = 'grok-4.5';

export const SYSTEM_PROMPT_RECIPE = `Actúa como un chef profesional y experto en nutrición.
Basado en el plato indicado, genera ÚNICAMENTE un JSON válido con la siguiente estructura,
sin texto adicional antes o después:
{
  "nombre_receta": "string",
  "lista_ingredientes": [{"nombre": "string", "cantidad": "string", "unidad": "string"}],
  "pasos": ["string"],
  "tiempo_estimado_minutos": number
}`;

export const SYSTEM_PROMPT_SCAN = `Eres un experto en identificación de alimentos.
Analiza la imagen del refrigerador o despensa y genera ÚNICAMENTE un JSON válido con:
{
  "ingredientes_detectados": ["string"],
  "recetas_sugeridas": [
    {
      "nombre_receta": "string",
      "lista_ingredientes": [{"nombre": "string", "cantidad": "string", "unidad": "string"}],
      "pasos": ["string"],
      "tiempo_estimado_minutos": number
    }
  ]
}
Sugiere exactamente 3 recetas que se puedan hacer con los ingredientes detectados.`;
