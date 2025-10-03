import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { HistoryEntry } from '../types';

interface CalorieSnapDB extends DBSchema {
  history: {
    key: string;
    value: HistoryEntry;
    indexes: { 'by-timestamp': number };
  };
}

let db: IDBPDatabase<CalorieSnapDB> | null = null;

export async function initDB(): Promise<void> {
  if (db) {
    return;
  }

  try {
    db = await openDB<CalorieSnapDB>('calorie-snap-db', 1, {
      upgrade(db) {
        // Create history store
        const historyStore = db.createObjectStore('history', {
          keyPath: 'id',
        });
        
        // Create index for timestamp-based queries
        historyStore.createIndex('by-timestamp', 'timestamp');
      },
    });
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw new Error('Failed to initialize local storage');
  }
}

export async function saveHistoryEntry(entry: HistoryEntry): Promise<void> {
  if (!db) {
    await initDB();
  }

  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    await db.put('history', entry);
  } catch (error) {
    console.error('Failed to save history entry:', error);
    throw new Error('Failed to save entry to history');
  }
}

export async function getHistoryEntries(): Promise<HistoryEntry[]> {
  if (!db) {
    await initDB();
  }

  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const entries = await db.getAllFromIndex('history', 'by-timestamp');
    return entries.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Failed to get history entries:', error);
    throw new Error('Failed to load history');
  }
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  if (!db) {
    await initDB();
  }

  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    await db.delete('history', id);
  } catch (error) {
    console.error('Failed to delete history entry:', error);
    throw new Error('Failed to delete entry');
  }
}

export async function clearHistory(): Promise<void> {
  if (!db) {
    await initDB();
  }

  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    await db.clear('history');
  } catch (error) {
    console.error('Failed to clear history:', error);
    throw new Error('Failed to clear history');
  }
}

export async function searchHistory(query: string): Promise<HistoryEntry[]> {
  if (!db) {
    await initDB();
  }

  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const allEntries = await db.getAllFromIndex('history', 'by-timestamp');
    const normalizedQuery = query.toLowerCase().trim();
    
    return allEntries.filter(entry => 
      entry.label.toLowerCase().includes(normalizedQuery) ||
      entry.displayName.toLowerCase().includes(normalizedQuery)
    );
  } catch (error) {
    console.error('Failed to search history:', error);
    throw new Error('Failed to search history');
  }
}