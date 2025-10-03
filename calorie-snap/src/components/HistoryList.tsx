import React, { useState, useMemo } from 'react';
import { HistoryEntry } from '../types';
import { Search, Download, Trash2, Calendar, Flame, Eye } from 'lucide-react';
import { formatDate, formatTime } from '../lib/export';

interface HistoryListProps {
  entries: HistoryEntry[];
  onDeleteEntry: (id: string) => void;
  onClearHistory: () => void;
  onExportCSV: () => void;
  onViewEntry: (entry: HistoryEntry) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  entries,
  onDeleteEntry,
  onClearHistory,
  onExportCSV,
  onViewEntry
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    
    const query = searchQuery.toLowerCase();
    return entries.filter(entry =>
      entry.displayName.toLowerCase().includes(query) ||
      entry.label.toLowerCase().includes(query)
    );
  }, [entries, searchQuery]);

  const handleClearHistory = () => {
    onClearHistory();
    setShowConfirmClear(false);
  };

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

  if (entries.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="card text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No History Yet
          </h3>
          <p className="text-gray-600">
            Your food scans will appear here. Start by taking a photo of your food!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            History ({entries.length})
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={onExportCSV}
              className="btn-outline flex items-center space-x-1 px-3 py-2"
              disabled={entries.length === 0}
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Export</span>
            </button>
            <button
              onClick={() => setShowConfirmClear(true)}
              className="btn-secondary flex items-center space-x-1 px-3 py-2"
              disabled={entries.length === 0}
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Clear</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-3">
        {filteredEntries.map((entry) => (
          <div key={entry.id} className="card p-4">
            <div className="flex items-start space-x-3">
              {/* Thumbnail */}
              <div className="flex-shrink-0">
                <img
                  src={entry.thumbDataUrl}
                  alt={entry.displayName}
                  className="w-12 h-12 object-cover rounded-lg"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 truncate">
                      {entry.displayName}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`confidence-badge ${getConfidenceClass(entry.confidence)}`}>
                        {getConfidenceText(entry.confidence)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {entry.grams}g • {entry.servings} serving{entry.servings !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Flame className="w-3 h-3" />
                        <span>{entry.kcal} kcal</span>
                      </div>
                      <span>{formatDate(entry.timestamp)}</span>
                      <span>{formatTime(entry.timestamp)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-1">
                    <button
                      onClick={() => onViewEntry(entry)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteEntry(entry.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Macros */}
                <div className="flex space-x-4 mt-3 text-xs text-gray-500">
                  <span>P: {entry.macros.protein}g</span>
                  <span>C: {entry.macros.carbs}g</span>
                  <span>F: {entry.macros.fat}g</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty Search Results */}
      {searchQuery && filteredEntries.length === 0 && (
        <div className="card text-center">
          <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">
            No entries found for "{searchQuery}"
          </p>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Clear History?
            </h3>
            <p className="text-gray-600 mb-6">
              This will permanently delete all {entries.length} entries from your history. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};