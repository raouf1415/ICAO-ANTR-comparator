import { NutritionData } from '../types';

// Local food database for fallback when APIs are unavailable
const LOCAL_FOOD_DB: Record<string, NutritionData> = {
  'apple': { kcalPer100g: 52, protein: 0.3, carbs: 14, fat: 0.2, source: 'local' },
  'banana': { kcalPer100g: 89, protein: 1.1, carbs: 23, fat: 0.3, source: 'local' },
  'rice': { kcalPer100g: 130, protein: 2.7, carbs: 28, fat: 0.3, source: 'local' },
  'chicken breast': { kcalPer100g: 165, protein: 31, carbs: 0, fat: 3.6, source: 'local' },
  'pizza slice': { kcalPer100g: 266, protein: 11, carbs: 33, fat: 10, source: 'local' },
  'hamburger': { kcalPer100g: 295, protein: 17, carbs: 25, fat: 15, source: 'local' },
  'pasta': { kcalPer100g: 131, protein: 5, carbs: 25, fat: 1.1, source: 'local' },
  'bread': { kcalPer100g: 265, protein: 9, carbs: 49, fat: 3.2, source: 'local' },
  'eggs': { kcalPer100g: 155, protein: 13, carbs: 1.1, fat: 11, source: 'local' },
  'milk': { kcalPer100g: 42, protein: 3.4, carbs: 5, fat: 1, source: 'local' }
};

export async function getNutrition(foodName: string): Promise<NutritionData> {
  // Try Nutritionix first
  if (import.meta.env.VITE_NUTRITIONIX_APP_ID && import.meta.env.VITE_NUTRITIONIX_API_KEY) {
    try {
      return await getNutritionFromNutritionix(foodName);
    } catch (error) {
      console.warn('Nutritionix API failed:', error);
    }
  }

  // Try CalorieNinjas as fallback
  if (import.meta.env.VITE_CALORIE_NINJAS_KEY) {
    try {
      return await getNutritionFromCalorieNinjas(foodName);
    } catch (error) {
      console.warn('CalorieNinjas API failed:', error);
    }
  }

  // Fallback to local database
  return getNutritionFromLocal(foodName);
}

async function getNutritionFromNutritionix(foodName: string): Promise<NutritionData> {
  const appId = import.meta.env.VITE_NUTRITIONIX_APP_ID;
  const apiKey = import.meta.env.VITE_NUTRITIONIX_API_KEY;

  if (!appId || !apiKey) {
    throw new Error('Nutritionix credentials not configured');
  }

  const response = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-id': appId,
      'x-app-key': apiKey,
    },
    body: JSON.stringify({
      query: foodName,
    }),
  });

  if (!response.ok) {
    throw new Error(`Nutritionix API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.foods || data.foods.length === 0) {
    throw new Error('No nutrition data found for this food');
  }

  const food = data.foods[0];
  
  return {
    kcalPer100g: Math.round(food.nf_calories / (food.serving_weight_grams / 100)),
    protein: Math.round(food.nf_protein * 10) / 10,
    carbs: Math.round(food.nf_total_carbohydrate * 10) / 10,
    fat: Math.round(food.nf_total_fat * 10) / 10,
    source: 'nutritionix'
  };
}

async function getNutritionFromCalorieNinjas(foodName: string): Promise<NutritionData> {
  const apiKey = import.meta.env.VITE_CALORIE_NINJAS_KEY;

  if (!apiKey) {
    throw new Error('CalorieNinjas API key not configured');
  }

  const response = await fetch(`https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(foodName)}`, {
    headers: {
      'X-Api-Key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`CalorieNinjas API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.items || data.items.length === 0) {
    throw new Error('No nutrition data found for this food');
  }

  const food = data.items[0];
  
  return {
    kcalPer100g: Math.round(food.calories),
    protein: Math.round(food.protein_g * 10) / 10,
    carbs: Math.round(food.carbohydrates_total_g * 10) / 10,
    fat: Math.round(food.fat_total_g * 10) / 10,
    source: 'calorieninjas'
  };
}

function getNutritionFromLocal(foodName: string): NutritionData {
  const normalizedName = foodName.toLowerCase().trim();
  
  // Try exact match first
  if (LOCAL_FOOD_DB[normalizedName]) {
    return LOCAL_FOOD_DB[normalizedName];
  }

  // Try partial matches
  for (const [key, value] of Object.entries(LOCAL_FOOD_DB)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return value;
    }
  }

  // Default fallback for unknown foods
  return {
    kcalPer100g: 200, // Average calorie density
    protein: 10,
    carbs: 20,
    fat: 8,
    source: 'local'
  };
}

export function calculateCalories(nutritionData: NutritionData, grams: number): number {
  return Math.round((nutritionData.kcalPer100g * grams) / 100);
}

export function calculateMacros(nutritionData: NutritionData, grams: number) {
  const factor = grams / 100;
  return {
    protein: Math.round(nutritionData.protein * factor * 10) / 10,
    carbs: Math.round(nutritionData.carbs * factor * 10) / 10,
    fat: Math.round(nutritionData.fat * factor * 10) / 10,
  };
}