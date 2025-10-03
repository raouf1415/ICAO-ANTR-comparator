import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNutrition, calculateCalories, calculateMacros } from '../lib/nutrition';

// Mock environment variables
const mockEnv = {
  VITE_NUTRITIONIX_APP_ID: 'test-app-id',
  VITE_NUTRITIONIX_API_KEY: 'test-api-key',
  VITE_CALORIE_NINJAS_KEY: 'test-calorie-key'
};

// Mock fetch
global.fetch = vi.fn();

describe('nutrition.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock environment variables
    Object.assign(import.meta.env, mockEnv);
  });

  describe('getNutrition', () => {
    it('should return nutrition data from Nutritionix API', async () => {
      const mockResponse = {
        foods: [{
          nf_calories: 250,
          serving_weight_grams: 200,
          nf_protein: 20,
          nf_total_carbohydrate: 30,
          nf_total_fat: 10
        }]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await getNutrition('apple');

      expect(result).toEqual({
        kcalPer100g: 125, // 250 / (200/100) = 125
        protein: 20,
        carbs: 30,
        fat: 10,
        source: 'nutritionix'
      });
    });

    it('should fallback to CalorieNinjas when Nutritionix fails', async () => {
      // Mock Nutritionix failure
      (fetch as any).mockRejectedValueOnce(new Error('Nutritionix failed'));

      // Mock CalorieNinjas success
      const mockCalorieNinjasResponse = {
        items: [{
          calories: 200,
          protein_g: 15,
          carbohydrates_total_g: 25,
          fat_total_g: 8
        }]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCalorieNinjasResponse)
      });

      const result = await getNutrition('banana');

      expect(result).toEqual({
        kcalPer100g: 200,
        protein: 15,
        carbs: 25,
        fat: 8,
        source: 'calorieninjas'
      });
    });

    it('should fallback to local database when APIs fail', async () => {
      // Mock both APIs failing
      (fetch as any).mockRejectedValue(new Error('API failed'));

      const result = await getNutrition('apple');

      expect(result).toEqual({
        kcalPer100g: 52,
        protein: 0.3,
        carbs: 14,
        fat: 0.2,
        source: 'local'
      });
    });

    it('should return default values for unknown foods in local database', async () => {
      (fetch as any).mockRejectedValue(new Error('API failed'));

      const result = await getNutrition('unknown food');

      expect(result).toEqual({
        kcalPer100g: 200,
        protein: 10,
        carbs: 20,
        fat: 8,
        source: 'local'
      });
    });
  });

  describe('calculateCalories', () => {
    it('should calculate calories correctly', () => {
      const nutritionData = {
        kcalPer100g: 100,
        protein: 10,
        carbs: 20,
        fat: 5,
        source: 'local' as const
      };

      const result = calculateCalories(nutritionData, 250);
      expect(result).toBe(250); // (100 * 250) / 100 = 250
    });

    it('should round calories to nearest integer', () => {
      const nutritionData = {
        kcalPer100g: 133,
        protein: 10,
        carbs: 20,
        fat: 5,
        source: 'local' as const
      };

      const result = calculateCalories(nutritionData, 150);
      expect(result).toBe(200); // (133 * 150) / 100 = 199.5 -> 200
    });
  });

  describe('calculateMacros', () => {
    it('should calculate macros correctly', () => {
      const nutritionData = {
        kcalPer100g: 100,
        protein: 10,
        carbs: 20,
        fat: 5,
        source: 'local' as const
      };

      const result = calculateMacros(nutritionData, 200);

      expect(result).toEqual({
        protein: 20, // 10 * 2
        carbs: 40,  // 20 * 2
        fat: 10     // 5 * 2
      });
    });

    it('should round macros to one decimal place', () => {
      const nutritionData = {
        kcalPer100g: 100,
        protein: 10.7,
        carbs: 20.3,
        fat: 5.8,
        source: 'local' as const
      };

      const result = calculateMacros(nutritionData, 150);

      expect(result).toEqual({
        protein: 16.1, // 10.7 * 1.5 = 16.05 -> 16.1
        carbs: 30.5,  // 20.3 * 1.5 = 30.45 -> 30.5
        fat: 8.7       // 5.8 * 1.5 = 8.7
      });
    });
  });
});