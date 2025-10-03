import React from 'react';
import { FoodPrediction, NutritionData, PortionData } from '../types';
import { Flame, Zap, Target, Award, Save, Share2 } from 'lucide-react';

interface ResultCardProps {
  food: FoodPrediction;
  nutritionData: NutritionData;
  portion: PortionData;
  calories: number;
  macros: { protein: number; carbs: number; fat: number };
  onSave: () => void;
  onShare?: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  food,
  nutritionData,
  portion,
  calories,
  macros,
  onSave,
  onShare
}) => {
  const getConfidenceClass = (confidence: number) => {
    if (confidence >= 0.7) return 'confidence-high';
    if (confidence >= 0.4) return 'confidence-medium';
    return 'confidence-low';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.7) return 'High';
    if (confidence >= 0.4) return 'Medium';
    return 'Low';
  };

  const getSourceBadge = (source: string) => {
    const badges = {
      nutritionix: { color: 'bg-blue-100 text-blue-800', text: 'Nutritionix' },
      calorieninjas: { color: 'bg-green-100 text-green-800', text: 'CalorieNinjas' },
      local: { color: 'bg-gray-100 text-gray-800', text: 'Local DB' }
    };
    return badges[source as keyof typeof badges] || badges.local;
  };

  const sourceBadge = getSourceBadge(nutritionData.source);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {food.displayName}
          </h3>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className={`confidence-badge ${getConfidenceClass(food.confidence)}`}>
              {getConfidenceText(food.confidence)} confidence
            </span>
            <span className={`confidence-badge ${sourceBadge.color}`}>
              {sourceBadge.text}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {portion.servings} serving{portion.servings !== 1 ? 's' : ''} • {portion.grams}g
          </p>
        </div>

        {/* Calories */}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 mb-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Flame className="w-6 h-6 text-primary-600" />
            <span className="text-sm font-medium text-primary-700">Total Calories</span>
          </div>
          <div className="text-4xl font-bold text-primary-600 mb-1">
            {calories}
          </div>
          <div className="text-sm text-primary-600">
            kcal
          </div>
        </div>

        {/* Macros */}
        <div className="space-y-4 mb-6">
          <h4 className="text-lg font-semibold text-gray-900 text-center">Macronutrients</h4>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Target className="w-4 h-4 text-red-600" />
                <span className="text-xs font-medium text-red-700">Protein</span>
              </div>
              <div className="text-lg font-bold text-red-600">
                {macros.protein}g
              </div>
            </div>
            
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Zap className="w-4 h-4 text-yellow-600" />
                <span className="text-xs font-medium text-yellow-700">Carbs</span>
              </div>
              <div className="text-lg font-bold text-yellow-600">
                {macros.carbs}g
              </div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Award className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">Fat</span>
              </div>
              <div className="text-lg font-bold text-green-600">
                {macros.fat}g
              </div>
            </div>
          </div>
        </div>

        {/* Nutrition Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Per 100g</h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Calories:</span>
              <span className="font-medium">{nutritionData.kcalPer100g} kcal</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Protein:</span>
              <span className="font-medium">{nutritionData.protein}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Carbs:</span>
              <span className="font-medium">{nutritionData.carbs}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fat:</span>
              <span className="font-medium">{nutritionData.fat}g</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onSave}
            className="flex-1 btn-primary flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save to History</span>
          </button>
          
          {onShare && (
            <button
              onClick={onShare}
              className="btn-outline flex items-center justify-center space-x-2 px-4"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            {nutritionData.source === 'local' 
              ? 'Values are approximate estimates from local database.'
              : 'Nutrition data provided by external API. Values may vary.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};