import React from 'react';
import { FoodPrediction } from '../types';
import { CheckCircle, AlertCircle, Search } from 'lucide-react';

interface FoodSuggestionsProps {
  predictions: FoodPrediction[];
  onSelectFood: (food: FoodPrediction) => void;
  onManualSearch: (query: string) => void;
  isLoading: boolean;
}

export const FoodSuggestions: React.FC<FoodSuggestionsProps> = ({
  predictions,
  onSelectFood,
  onManualSearch,
  isLoading
}) => {
  const [manualQuery, setManualQuery] = React.useState('');
  const [showManualSearch, setShowManualSearch] = React.useState(false);

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

  const handleManualSearch = () => {
    if (manualQuery.trim()) {
      onManualSearch(manualQuery.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSearch();
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="card">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <span className="text-gray-600">Analyzing image...</span>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="card text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Couldn't identify food
          </h3>
          <p className="text-gray-600 mb-4">
            The AI couldn't confidently identify the food in your photo. Try taking another photo or search manually.
          </p>
          
          {!showManualSearch ? (
            <button
              onClick={() => setShowManualSearch(true)}
              className="btn-outline flex items-center justify-center space-x-2 mx-auto"
            >
              <Search className="w-4 h-4" />
              <span>Search Manually</span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter food name..."
                  className="flex-1 input-field"
                  autoFocus
                />
                <button
                  onClick={handleManualSearch}
                  className="btn-primary px-4"
                  disabled={!manualQuery.trim()}
                >
                  Search
                </button>
              </div>
              <button
                onClick={() => setShowManualSearch(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          What did you eat?
        </h3>
        
        <div className="space-y-3 mb-4">
          {predictions.map((prediction, index) => (
            <button
              key={prediction.label}
              onClick={() => onSelectFood(prediction)}
              className="w-full p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {prediction.displayName}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`confidence-badge ${getConfidenceClass(prediction.confidence)}`}>
                      {getConfidenceText(prediction.confidence)} confidence
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round(prediction.confidence * 100)}%
                    </span>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={() => setShowManualSearch(true)}
            className="w-full btn-outline flex items-center justify-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>None of these? Search manually</span>
          </button>
        </div>

        {showManualSearch && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter food name..."
                  className="flex-1 input-field"
                  autoFocus
                />
                <button
                  onClick={handleManualSearch}
                  className="btn-primary px-4"
                  disabled={!manualQuery.trim()}
                >
                  Search
                </button>
              </div>
              <button
                onClick={() => setShowManualSearch(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};