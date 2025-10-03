import React, { useState, useEffect } from 'react';
import { Minus, Plus, Scale } from 'lucide-react';
import { PortionData } from '../types';

interface PortionPickerProps {
  initialPortion: PortionData;
  onPortionChange: (portion: PortionData) => void;
  units: 'g' | 'oz';
}

export const PortionPicker: React.FC<PortionPickerProps> = ({
  initialPortion,
  onPortionChange,
  units
}) => {
  const [portion, setPortion] = useState<PortionData>(initialPortion);
  const [activeMode, setActiveMode] = useState<'servings' | 'grams'>('grams');

  // Preset portion options
  const presetServings = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];
  const presetGrams = [50, 100, 150, 200, 250, 300, 400, 500];

  useEffect(() => {
    onPortionChange(portion);
  }, [portion, onPortionChange]);

  const updateServings = (newServings: number) => {
    const clampedServings = Math.max(0.25, Math.min(3, newServings));
    const grams = Math.round(clampedServings * 100); // Assuming 1 serving = 100g
    setPortion({ servings: clampedServings, grams });
  };

  const updateGrams = (newGrams: number) => {
    const clampedGrams = Math.max(10, Math.min(1000, newGrams));
    const servings = Math.round((clampedGrams / 100) * 4) / 4; // Round to nearest 0.25
    setPortion({ servings, grams: clampedGrams });
  };

  const convertToDisplayUnits = (grams: number): number => {
    return units === 'oz' ? Math.round(grams * 0.035274 * 10) / 10 : grams;
  };

  const convertFromDisplayUnits = (value: number): number => {
    return units === 'oz' ? Math.round(value / 0.035274) : value;
  };

  const getDisplayValue = (grams: number): string => {
    const value = convertToDisplayUnits(grams);
    return `${value} ${units}`;
  };

  const handlePresetClick = (value: number, type: 'servings' | 'grams') => {
    if (type === 'servings') {
      updateServings(value);
    } else {
      updateGrams(value);
    }
  };

  const handleSliderChange = (value: string) => {
    const numValue = parseFloat(value);
    if (activeMode === 'servings') {
      updateServings(numValue);
    } else {
      updateGrams(convertFromDisplayUnits(numValue));
    }
  };

  const getSliderMin = (): number => {
    if (activeMode === 'servings') return 0.25;
    return convertToDisplayUnits(10);
  };

  const getSliderMax = (): number => {
    if (activeMode === 'servings') return 3;
    return convertToDisplayUnits(1000);
  };

  const getSliderValue = (): number => {
    if (activeMode === 'servings') return portion.servings;
    return convertToDisplayUnits(portion.grams);
  };

  const getSliderStep = (): number => {
    if (activeMode === 'servings') return 0.25;
    return units === 'oz' ? 0.1 : 10;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Portion Size
        </h3>

        {/* Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveMode('servings')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeMode === 'servings'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Servings
          </button>
          <button
            onClick={() => setActiveMode('grams')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeMode === 'grams'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Weight ({units})
          </button>
        </div>

        {/* Current Value Display */}
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {activeMode === 'servings' 
              ? `${portion.servings} serving${portion.servings !== 1 ? 's' : ''}`
              : getDisplayValue(portion.grams)
            }
          </div>
          <div className="text-sm text-gray-500">
            {activeMode === 'servings' 
              ? `≈ ${getDisplayValue(portion.grams)}`
              : `≈ ${portion.servings} serving${portion.servings !== 1 ? 's' : ''}`
            }
          </div>
        </div>

        {/* Slider */}
        <div className="mb-6">
          <input
            type="range"
            min={getSliderMin()}
            max={getSliderMax()}
            step={getSliderStep()}
            value={getSliderValue()}
            onChange={(e) => handleSliderChange(e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Quick Adjust Buttons */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <button
            onClick={() => {
              if (activeMode === 'servings') {
                updateServings(portion.servings - 0.25);
              } else {
                updateGrams(portion.grams - (units === 'oz' ? 10 : 10));
              }
            }}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
          >
            <Minus className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex items-center space-x-2 text-gray-600">
            <Scale className="w-4 h-4" />
            <span className="text-sm">Adjust</span>
          </div>
          
          <button
            onClick={() => {
              if (activeMode === 'servings') {
                updateServings(portion.servings + 0.25);
              } else {
                updateGrams(portion.grams + (units === 'oz' ? 10 : 10));
              }
            }}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
          >
            <Plus className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Preset Options */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 text-center">
            Quick Select
          </h4>
          
          <div className="flex flex-wrap gap-2 justify-center">
            {(activeMode === 'servings' ? presetServings : presetGrams).map((value) => (
              <button
                key={value}
                onClick={() => handlePresetClick(value, activeMode)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors duration-200 ${
                  (activeMode === 'servings' ? portion.servings === value : portion.grams === value)
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300'
                }`}
              >
                {activeMode === 'servings' 
                  ? `${value} serving${value !== 1 ? 's' : ''}`
                  : getDisplayValue(value)
                }
              </button>
            ))}
          </div>
        </div>

        {/* Manual Input */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="number"
              min={getSliderMin()}
              max={getSliderMax()}
              step={getSliderStep()}
              value={getSliderValue()}
              onChange={(e) => handleSliderChange(e.target.value)}
              className="flex-1 input-field text-center"
            />
            <span className="flex items-center text-gray-500 text-sm">
              {activeMode === 'servings' ? 'servings' : units}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};