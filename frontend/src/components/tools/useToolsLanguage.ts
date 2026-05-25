'use client';

import { useCallback, useEffect, useState } from 'react';

export type ToolsLanguage = 'id' | 'en';

const STORAGE_KEY = 'hertz-tools-language';
const LEGACY_STORAGE_KEY = 'horizon-tools-language';
const LANGUAGE_EVENT = 'hertz-tools-language-change';
const LEGACY_LANGUAGE_EVENT = 'horizon-tools-language-change';

function normalizeLanguage(value: string | null): ToolsLanguage {
  return value === 'en' ? 'en' : 'id';
}

export function useToolsLanguage() {
  const [language, setLanguageState] = useState<ToolsLanguage>('id');

  useEffect(() => {
    const readLanguage = () => {
      const current = window.localStorage.getItem(STORAGE_KEY);
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (current === null && legacy !== null) {
        window.localStorage.setItem(STORAGE_KEY, legacy);
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        return legacy;
      }
      return current;
    };

    setLanguageState(normalizeLanguage(readLanguage()));

    const handleStorage = () => {
      setLanguageState(normalizeLanguage(readLanguage()));
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(LANGUAGE_EVENT, handleStorage);
    window.addEventListener(LEGACY_LANGUAGE_EVENT, handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(LANGUAGE_EVENT, handleStorage);
      window.removeEventListener(LEGACY_LANGUAGE_EVENT, handleStorage);
    };
  }, []);

  const setLanguage = useCallback((nextLanguage: ToolsLanguage) => {
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    setLanguageState(nextLanguage);
    window.dispatchEvent(new Event(LANGUAGE_EVENT));
  }, []);

  return { language, setLanguage };
}
