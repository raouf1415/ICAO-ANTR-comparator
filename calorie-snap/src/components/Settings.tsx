import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { Key, Camera, Save, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onClearHistory: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onSaveSettings,
  onClearHistory
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleInputChange = (field: keyof AppSettings, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      onSaveSettings(formData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const hasApiKeys = formData.nutritionixAppId || formData.nutritionixApiKey || formData.calorieNinjasKey;

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* API Keys Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>API Keys</span>
          </h3>
          <button
            onClick={() => setShowApiKeys(!showApiKeys)}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            {showApiKeys ? 'Hide' : 'Show'}
          </button>
        </div>

        {showApiKeys && (
          <div className="space-y-4">
            {/* Nutritionix */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nutritionix App ID
              </label>
              <input
                type="text"
                value={formData.nutritionixAppId}
                onChange={(e) => handleInputChange('nutritionixAppId', e.target.value)}
                placeholder="Enter your Nutritionix App ID"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nutritionix API Key
              </label>
              <input
                type="password"
                value={formData.nutritionixApiKey}
                onChange={(e) => handleInputChange('nutritionixApiKey', e.target.value)}
                placeholder="Enter your Nutritionix API Key"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CalorieNinjas API Key
              </label>
              <input
                type="password"
                value={formData.calorieNinjasKey}
                onChange={(e) => handleInputChange('calorieNinjasKey', e.target.value)}
                placeholder="Enter your CalorieNinjas API Key"
                className="input-field"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Get free API keys:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• <a href="https://www.nutritionix.com/business/api" target="_blank" rel="noopener noreferrer" className="underline">Nutritionix API</a></li>
                <li>• <a href="https://calorieninjas.com/" target="_blank" rel="noopener noreferrer" className="underline">CalorieNinjas API</a></li>
              </ul>
            </div>
          </div>
        )}

        {/* API Status */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {hasApiKeys ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">API keys configured</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">Using local database only</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Camera className="w-5 h-5" />
          <span>Preferences</span>
        </h3>

        <div className="space-y-4">
          {/* Auto-open Camera */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Auto-open Camera
              </label>
              <p className="text-xs text-gray-500">
                Automatically open camera when app starts
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoOpenCamera}
                onChange={(e) => handleInputChange('autoOpenCamera', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Save Photos */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Save Photos to History
              </label>
              <p className="text-xs text-gray-500">
                Store captured images in your history
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.savePhotosToHistory}
                onChange={(e) => handleInputChange('savePhotosToHistory', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Units */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight Units
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => handleInputChange('units', 'g')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  formData.units === 'g'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Grams (g)
              </button>
              <button
                onClick={() => handleInputChange('units', 'oz')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  formData.units === 'oz'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Ounces (oz)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Trash2 className="w-5 h-5" />
          <span>Data Management</span>
        </h3>

        <div className="space-y-3">
          <button
            onClick={onClearHistory}
            className="w-full btn-secondary flex items-center justify-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All History</span>
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="card">
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className="w-full btn-primary flex items-center justify-center space-x-2"
        >
          {saveStatus === 'saving' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Saved!</span>
            </>
          ) : saveStatus === 'error' ? (
            <>
              <AlertCircle className="w-4 h-4" />
              <span>Error</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="card bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Privacy & Security</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• All photos are processed locally on your device</li>
          <li>• No images are uploaded to external servers</li>
          <li>• Only food names are sent to nutrition APIs</li>
          <li>• All data is stored locally on your device</li>
        </ul>
      </div>
    </div>
  );
};