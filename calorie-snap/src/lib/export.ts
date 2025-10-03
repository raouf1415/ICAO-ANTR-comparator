import { HistoryEntry } from '../types';

export function exportToCSV(entries: HistoryEntry[]): string {
  const headers = [
    'Date',
    'Time',
    'Food',
    'Portion (g)',
    'Servings',
    'Calories',
    'Protein (g)',
    'Carbs (g)',
    'Fat (g)',
    'Confidence'
  ];

  const rows = entries.map(entry => {
    const date = new Date(entry.timestamp);
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      `"${entry.displayName}"`,
      entry.grams.toString(),
      entry.servings.toString(),
      entry.kcal.toString(),
      entry.macros.protein.toString(),
      entry.macros.carbs.toString(),
      entry.macros.fat.toString(),
      `${Math.round(entry.confidence * 100)}%`
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  return csvContent;
}

export function downloadCSV(csvContent: string, filename: string = 'calorie-history.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}