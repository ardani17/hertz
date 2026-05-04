'use client';

import { useCallback, useEffect, useState } from 'react';

export type ToolsLanguage = 'id' | 'en';

const STORAGE_KEY = 'horizon-tools-language';
const LANGUAGE_EVENT = 'horizon-tools-language-change';

function normalizeLanguage(value: string | null): ToolsLanguage {
  return value === 'en' ? 'en' : 'id';
}

export function useToolsLanguage() {
  const [language, setLanguageState] = useState<ToolsLanguage>('id');

  useEffect(() => {
    setLanguageState(normalizeLanguage(window.localStorage.getItem(STORAGE_KEY)));

    const handleStorage = () => {
      setLanguageState(normalizeLanguage(window.localStorage.getItem(STORAGE_KEY)));
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(LANGUAGE_EVENT, handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(LANGUAGE_EVENT, handleStorage);
    };
  }, []);

  const setLanguage = useCallback((nextLanguage: ToolsLanguage) => {
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    setLanguageState(nextLanguage);
    window.dispatchEvent(new Event(LANGUAGE_EVENT));
  }, []);

  return { language, setLanguage };
}
