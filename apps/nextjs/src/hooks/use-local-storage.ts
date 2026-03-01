"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * useLocalStorage — Persist state to localStorage with SSR safety.
 *
 * Usage:
 *   const [theme, setTheme] = useLocalStorage("theme", "system");
 *   const [sidebar, setSidebar] = useLocalStorage("sidebar-collapsed", false);
 *
 * Values are JSON-serialized automatically.
 * Falls back to initialValue on SSR or when localStorage is unavailable.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Read from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch {
      // localStorage unavailable or JSON parse failed — use initial value
    }
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(nextValue));
        } catch {
          // localStorage full or unavailable
        }
        return nextValue;
      });
    },
    [key],
  );

  return [storedValue, setValue];
}
