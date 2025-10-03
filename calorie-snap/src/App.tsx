import React, { useEffect, useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, AppScreen, FoodPrediction, HistoryEntry, AppSettings, PortionData } from './types';
import { CameraCapture } from './components/CameraCapture';
import { FoodSuggestions } from './components/FoodSuggestions';
import { PortionPicker } from './components/PortionPicker';
import { ResultCard } from './components/ResultCard';
import { HistoryList } from './components/HistoryList';
import { Settings } from './components/Settings';
import { predictFood } from './lib/tfModel';
import { getNutrition, calculateCalories, calculateMacros } from './lib/nutrition';
import { saveHistoryEntry, getHistoryEntries, deleteHistoryEntry, clearHistory, initDB } from './lib/db';
import { exportToCSV, downloadCSV } from './lib/export';
import { History, Settings as SettingsIcon, ArrowLeft, Camera } from 'lucide-react';

// Default settings
const defaultSettings: AppSettings = {
  nutritionixAppId: '',
  nutritionixApiKey: '',
  calorieNinjasKey: '',
  autoOpenCamera: false,
  savePhotosToHistory: true,
  units: 'g'
};

// Zustand store for app state
const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentScreen: 'landing',
      capturedImage: null,
      predictions: [],
      selectedFood: null,
      portionData: { servings: 1, grams: 100 },
      nutritionData: null,
      history: [],
      settings: defaultSettings,
      isLoading: false,
      error: null,

      // Actions
      setCurrentScreen: (screen: AppScreen) => set({ currentScreen: screen }),
      setCapturedImage: (image: string | null) => set({ capturedImage: image }),
      setPredictions: (predictions: FoodPrediction[]) => set({ predictions }),
      setSelectedFood: (food: FoodPrediction | null) => set({ selectedFood: food }),
      setPortionData: (portion: PortionData) => set({ portionData: portion }),
      setNutritionData: (nutrition: any) => set({ nutritionData: nutrition }),
      setHistory: (history: HistoryEntry[]) => set({ history }),
      setSettings: (settings: AppSettings) => set({ settings }),
      setIsLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),

      // Complex actions
      capturePhoto: async (imageDataUrl: string) => {
        set({ capturedImage: imageDataUrl, isLoading: true, error: null });
        
        try {
          // Create image element for prediction
          const img = new Image();
          img.onload = async () => {
            try {
              const predictions = await predictFood(img);
              set({ predictions, currentScreen: 'suggestions', isLoading: false });
            } catch (error) {
              set({ 
                error: error instanceof Error ? error.message : 'Failed to analyze image',
                isLoading: false 
              });
            }
          };
          img.src = imageDataUrl;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to process image',
            isLoading: false 
          });
        }
      },

      selectFood: (food: FoodPrediction) => {
        set({ selectedFood: food, currentScreen: 'portion' });
      },

      getNutritionData: async (foodName: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const nutritionData = await getNutrition(foodName);
          set({ nutritionData, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to get nutrition data',
            isLoading: false 
          });
        }
      },

      saveToHistory: async () => {
        const state = get();
        if (!state.selectedFood || !state.nutritionData || !state.capturedImage) return;

        try {
          const calories = calculateCalories(state.nutritionData, state.portionData.grams);
          const macros = calculateMacros(state.nutritionData, state.portionData.grams);

          const entry: HistoryEntry = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            label: state.selectedFood.label,
            displayName: state.selectedFood.displayName,
            grams: state.portionData.grams,
            servings: state.portionData.servings,
            kcal: calories,
            macros,
            thumbDataUrl: state.capturedImage,
            confidence: state.selectedFood.confidence
          };

          await saveHistoryEntry(entry);
          const updatedHistory = await getHistoryEntries();
          set({ history: updatedHistory, currentScreen: 'history' });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to save to history'
          });
        }
      },

      loadHistory: async () => {
        try {
          const history = await getHistoryEntries();
          set({ history });
        } catch (error) {
          console.error('Failed to load history:', error);
        }
      },

      deleteHistoryEntry: async (id: string) => {
        try {
          await deleteHistoryEntry(id);
          const updatedHistory = await getHistoryEntries();
          set({ history: updatedHistory });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete entry'
          });
        }
      },

      clearAllHistory: async () => {
        try {
          await clearHistory();
          set({ history: [] });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to clear history'
          });
        }
      },

      exportHistory: () => {
        const state = get();
        const csvContent = exportToCSV(state.history);
        downloadCSV(csvContent);
      },

      resetApp: () => {
        set({
          currentScreen: 'landing',
          capturedImage: null,
          predictions: [],
          selectedFood: null,
          portionData: { servings: 1, grams: 100 },
          nutritionData: null,
          isLoading: false,
          error: null
        });
      }
    }),
    {
      name: 'calorie-snap-storage',
      partialize: (state) => ({ 
        settings: state.settings,
        history: state.history 
      }),
    }
  )
);

export const App: React.FC = () => {
  const {
    currentScreen,
    predictions,
    selectedFood,
    portionData,
    nutritionData,
    history,
    settings,
    isLoading,
    error,
    setCurrentScreen,
    capturePhoto,
    selectFood,
    getNutritionData,
    saveToHistory,
    loadHistory,
    deleteHistoryEntry,
    clearAllHistory,
    exportHistory,
    setError
  } = useAppStore();

  // Initialize database and load history on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDB();
        await loadHistory();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };
    initializeApp();
  }, [loadHistory]);

  // Auto-open camera if setting is enabled
  useEffect(() => {
    if (settings.autoOpenCamera && currentScreen === 'landing') {
      setCurrentScreen('camera');
    }
  }, [settings.autoOpenCamera, currentScreen, setCurrentScreen]);

  const handleCapture = useCallback(async (imageDataUrl: string) => {
    await capturePhoto(imageDataUrl);
  }, [capturePhoto]);

  const handleSelectFood = useCallback(async (food: FoodPrediction) => {
    selectFood(food);
    await getNutritionData(food.displayName);
  }, [selectFood, getNutritionData]);

  const handleManualSearch = useCallback(async (query: string) => {
    const mockFood: FoodPrediction = {
      label: query.toLowerCase().replace(/\s+/g, '_'),
      confidence: 0.5,
      displayName: query
    };
    selectFood(mockFood);
    await getNutritionData(query);
  }, [selectFood, getNutritionData]);

  const handleSaveToHistory = useCallback(async () => {
    await saveToHistory();
  }, [saveToHistory]);

  const handleDeleteEntry = useCallback(async (id: string) => {
    await deleteHistoryEntry(id);
  }, [deleteHistoryEntry]);

  const handleClearHistory = useCallback(async () => {
    await clearAllHistory();
  }, [clearAllHistory]);

  const handleExportHistory = useCallback(() => {
    exportHistory();
  }, [exportHistory]);

  const handleBack = useCallback(() => {
    if (currentScreen === 'suggestions') {
      setCurrentScreen('camera');
    } else if (currentScreen === 'portion') {
      setCurrentScreen('suggestions');
    } else if (currentScreen === 'result') {
      setCurrentScreen('portion');
    } else {
      setCurrentScreen('landing');
    }
  }, [currentScreen, setCurrentScreen]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'landing':
        return (
          <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col items-center justify-center p-4">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Calorie Snap</h1>
              <p className="text-gray-600 max-w-md">
                Take a photo of your food and get instant calorie estimates with AI-powered analysis.
              </p>
            </div>
            
            <button
              onClick={() => setCurrentScreen('camera')}
              className="btn-primary text-lg px-8 py-4"
            >
              Take Photo
            </button>
            
            <div className="mt-8 flex space-x-4">
              <button
                onClick={() => setCurrentScreen('history')}
                className="btn-outline flex items-center space-x-2"
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </button>
              <button
                onClick={() => setCurrentScreen('settings')}
                className="btn-outline flex items-center space-x-2"
              >
                <SettingsIcon className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        );

      case 'camera':
        return (
          <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentScreen('landing')}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <h2 className="text-lg font-semibold text-gray-900">Camera</h2>
                <div className="w-16" /> {/* Spacer */}
              </div>
              
              <CameraCapture
                onCapture={handleCapture}
                onError={setError}
              />
            </div>
          </div>
        );

      case 'suggestions':
        return (
          <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handleBack}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <h2 className="text-lg font-semibold text-gray-900">Food Recognition</h2>
                <div className="w-16" /> {/* Spacer */}
              </div>
              
              <FoodSuggestions
                predictions={predictions}
                onSelectFood={handleSelectFood}
                onManualSearch={handleManualSearch}
                isLoading={isLoading}
              />
            </div>
          </div>
        );

      case 'portion':
        return (
          <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handleBack}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <h2 className="text-lg font-semibold text-gray-900">Portion Size</h2>
                <div className="w-16" /> {/* Spacer */}
              </div>
              
              <PortionPicker
                initialPortion={portionData}
                onPortionChange={(portion) => {
                  useAppStore.setState({ portionData: portion });
                }}
                units={settings.units}
              />
              
              {nutritionData && (
                <div className="mt-6">
                  <button
                    onClick={() => setCurrentScreen('result')}
                    className="w-full btn-primary"
                  >
                    View Results
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'result':
        return (
          <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handleBack}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <h2 className="text-lg font-semibold text-gray-900">Results</h2>
                <div className="w-16" /> {/* Spacer */}
              </div>
              
              {selectedFood && nutritionData && (
                <ResultCard
                  food={selectedFood}
                  nutritionData={nutritionData}
                  portion={portionData}
                  calories={calculateCalories(nutritionData, portionData.grams)}
                  macros={calculateMacros(nutritionData, portionData.grams)}
                  onSave={handleSaveToHistory}
                />
              )}
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentScreen('landing')}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <h2 className="text-lg font-semibold text-gray-900">History</h2>
                <div className="w-16" /> {/* Spacer */}
              </div>
              
              <HistoryList
                entries={history}
                onDeleteEntry={handleDeleteEntry}
                onClearHistory={handleClearHistory}
                onExportCSV={handleExportHistory}
                onViewEntry={(entry) => {
                  // For now, just show a simple view
                  console.log('View entry:', entry);
                }}
              />
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentScreen('landing')}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
                <div className="w-16" /> {/* Spacer */}
              </div>
              
              <Settings
                settings={settings}
                onSaveSettings={(newSettings) => {
                  useAppStore.setState({ settings: newSettings });
                }}
                onClearHistory={handleClearHistory}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="App">
      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-red-800 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <span className="text-gray-700">Processing...</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      {renderScreen()}
    </div>
  );
};