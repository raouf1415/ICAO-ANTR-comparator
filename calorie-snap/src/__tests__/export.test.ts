import { describe, it, expect, vi } from 'vitest';
import { exportToCSV, downloadCSV, formatDate, formatTime } from '../lib/export';
import type { HistoryEntry } from '../types';

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock document methods
const mockLink = {
  setAttribute: vi.fn(),
  click: vi.fn(),
  style: { visibility: '' }
};

Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => mockLink)
});

Object.defineProperty(document.body, 'appendChild', {
  value: vi.fn()
});

Object.defineProperty(document.body, 'removeChild', {
  value: vi.fn()
});

describe('export.ts', () => {
  const mockHistoryEntry: HistoryEntry = {
    id: '1',
    timestamp: 1640995200000, // 2022-01-01 00:00:00
    label: 'apple',
    displayName: 'Apple',
    grams: 150,
    servings: 1.5,
    kcal: 78,
    macros: {
      protein: 0.4,
      carbs: 20.6,
      fat: 0.2
    },
    thumbDataUrl: 'data:image/jpeg;base64,mock-data',
    confidence: 0.85
  };

  describe('exportToCSV', () => {
    it('should generate correct CSV format', () => {
      const entries = [mockHistoryEntry];
      const csv = exportToCSV(entries);

      const lines = csv.split('\n');
      expect(lines).toHaveLength(2); // Header + 1 data row

      // Check header
      expect(lines[0]).toBe('Date,Time,Food,Portion (g),Servings,Calories,Protein (g),Carbs (g),Fat (g),Confidence');

      // Check data row
      const dataRow = lines[1].split(',');
      expect(dataRow[0]).toBe('1/1/2022'); // Date
      expect(dataRow[1]).toBe('12:00:00 AM'); // Time
      expect(dataRow[2]).toBe('"Apple"'); // Food (quoted)
      expect(dataRow[3]).toBe('150'); // Portion
      expect(dataRow[4]).toBe('1.5'); // Servings
      expect(dataRow[5]).toBe('78'); // Calories
      expect(dataRow[6]).toBe('0.4'); // Protein
      expect(dataRow[7]).toBe('20.6'); // Carbs
      expect(dataRow[8]).toBe('0.2'); // Fat
      expect(dataRow[9]).toBe('85%'); // Confidence
    });

    it('should handle multiple entries', () => {
      const entries = [
        mockHistoryEntry,
        { ...mockHistoryEntry, id: '2', displayName: 'Banana', kcal: 105 }
      ];
      const csv = exportToCSV(entries);

      const lines = csv.split('\n');
      expect(lines).toHaveLength(3); // Header + 2 data rows
    });

    it('should handle empty entries array', () => {
      const csv = exportToCSV([]);
      const lines = csv.split('\n');
      expect(lines).toHaveLength(1); // Only header
      expect(lines[0]).toBe('Date,Time,Food,Portion (g),Servings,Calories,Protein (g),Carbs (g),Fat (g),Confidence');
    });

    it('should escape commas in food names', () => {
      const entryWithComma = {
        ...mockHistoryEntry,
        displayName: 'Apple, Red Delicious'
      };
      const csv = exportToCSV([entryWithComma]);
      const lines = csv.split('\n');
      const dataRow = lines[1];
      expect(dataRow).toContain('"Apple, Red Delicious"');
    });
  });

  describe('downloadCSV', () => {
    it('should create and trigger download', () => {
      const csvContent = 'test,csv,content';
      const filename = 'test.csv';

      downloadCSV(csvContent, filename);

      // Check that Blob was created with correct content
      expect(global.Blob).toHaveBeenCalledWith(
        [csvContent],
        { type: 'text/csv;charset=utf-8;' }
      );

      // Check that link was created and configured
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'mock-url');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', filename);
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should use default filename when not provided', () => {
      const csvContent = 'test,csv,content';

      downloadCSV(csvContent);

      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'calorie-history.csv');
    });
  });

  describe('formatDate', () => {
    it('should format timestamp correctly', () => {
      const timestamp = 1640995200000; // 2022-01-01 00:00:00
      const formatted = formatDate(timestamp);
      
      // The exact format may vary by locale, but should contain the date
      expect(formatted).toContain('2022');
      expect(formatted).toContain('Jan');
    });

    it('should handle different timestamps', () => {
      const timestamp = 1672531200000; // 2023-01-01 00:00:00
      const formatted = formatDate(timestamp);
      
      expect(formatted).toContain('2023');
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      const timestamp = 1640995200000; // 2022-01-01 00:00:00
      const formatted = formatTime(timestamp);
      
      // Should contain time information
      expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should handle different times', () => {
      const timestamp = 1640995200000 + (14 * 60 * 60 * 1000); // 2:00 PM
      const formatted = formatTime(timestamp);
      
      expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    });
  });
});