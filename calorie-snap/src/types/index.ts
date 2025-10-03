export interface FoodPrediction {
  label: string;
  confidence: number;
  displayName: string;
}

export interface NutritionData {
  kcalPer100g: number;
  protein: number;
  carbs: number;
  fat: number;
  source: 'nutritionix' | 'calorieninjas' | 'local';
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  label: string;
  displayName: string;
  grams: number;
  servings: number;
  kcal: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  thumbDataUrl: string;
  confidence: number;
}

export interface AppSettings {
  nutritionixAppId: string;
  nutritionixApiKey: string;
  calorieNinjasKey: string;
  autoOpenCamera: boolean;
  savePhotosToHistory: boolean;
  units: 'g' | 'oz';
}

export interface PortionData {
  servings: number;
  grams: number;
}

export type AppScreen = 'landing' | 'camera' | 'preview' | 'suggestions' | 'portion' | 'result' | 'history' | 'settings';

export interface AppState {
  currentScreen: AppScreen;
  capturedImage: string | null;
  predictions: FoodPrediction[];
  selectedFood: FoodPrediction | null;
  portionData: PortionData;
  nutritionData: NutritionData | null;
  history: HistoryEntry[];
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentScreen: (screen: AppScreen) => void;
  setCapturedImage: (image: string | null) => void;
  setPredictions: (predictions: FoodPrediction[]) => void;
  setSelectedFood: (food: FoodPrediction | null) => void;
  setPortionData: (portion: PortionData) => void;
  setNutritionData: (nutrition: NutritionData | null) => void;
  setHistory: (history: HistoryEntry[]) => void;
  setSettings: (settings: AppSettings) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Complex actions
  capturePhoto: (imageDataUrl: string) => Promise<void>;
  selectFood: (food: FoodPrediction) => void;
  getNutritionData: (foodName: string) => Promise<void>;
  saveToHistory: () => Promise<void>;
  loadHistory: () => Promise<void>;
  deleteHistoryEntry: (id: string) => Promise<void>;
  clearAllHistory: () => Promise<void>;
  exportHistory: () => void;
  resetApp: () => void;
}