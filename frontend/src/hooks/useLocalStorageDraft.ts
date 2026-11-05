import { useState, useEffect } from 'react';

export function useLocalStorageDraft<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignora erro de JSON e fallback para valor padrão
    }
    return initialValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignora falhas em ambientes restritos
    }
  }, [key, value]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(key);
      setValue(initialValue);
    } catch {
      // Ignora
    }
  };

  return [value, setValue, clearDraft];
}
