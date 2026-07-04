import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@hymn_favorites';

// Module-level store — shared across all hook instances
let _favorites: Set<string> = new Set();
let _loaded = false;
let _listeners: Array<(f: Set<string>) => void> = [];

function notify() {
  const snapshot = new Set(_favorites);
  _listeners.forEach(l => l(snapshot));
}

async function load() {
  if (_loaded) return;
  _loaded = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) _favorites = new Set(JSON.parse(raw) as string[]);
  } catch {}
  notify();
}

function persist() {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([..._favorites])).catch(() => {});
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set(_favorites));

  useEffect(() => {
    const listener = (f: Set<string>) => setFavorites(f);
    _listeners.push(listener);
    load(); // no-op after first call
    return () => { _listeners = _listeners.filter(l => l !== listener); };
  }, []);

  const toggleFavorite = useCallback((hymnId: string) => {
    if (_favorites.has(hymnId)) {
      _favorites.delete(hymnId);
    } else {
      _favorites.add(hymnId);
    }
    persist();
    notify();
  }, []);

  const isFavorite = useCallback((hymnId: string) => favorites.has(hymnId), [favorites]);

  return { favorites, isFavorite, toggleFavorite };
}
