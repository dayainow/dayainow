import { useLocales } from 'expo-localization';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { refreshDailyReminder } from '../notifications';
import { getCachedSettings, loadSettings, updateSettings } from '../storage/settings';
import { dictionaries, type Language, type LanguagePreference, resolveLanguage } from './index';

type LanguageContextValue = {
  language: Language;
  preference: LanguagePreference;
  setPreference: (next: LanguagePreference) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [deviceLocale] = useLocales();
  const [preference, setPreference] = useState<LanguagePreference | null>(null);

  useEffect(() => {
    let active = true;
    loadSettings().then(settings => {
      if (active) setPreference(settings.language);
    });
    return () => { active = false; };
  }, []);

  const language = resolveLanguage(preference ?? 'system', deviceLocale?.languageCode);
  const loaded = preference !== null;

  useEffect(() => {
    if (loaded && getCachedSettings().reminderEnabled) void refreshDailyReminder(dictionaries[language].notification);
  }, [language, loaded]);

  if (preference === null) return null;

  const savePreference = async (next: LanguagePreference) => {
    const saved = await updateSettings({ language: next });
    setPreference(saved.language);
  };

  return (
    <LanguageContext.Provider value={{ language, preference, setPreference: savePreference }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const value = useContext(LanguageContext);
  if (value === null) throw new Error('LanguageProvider is missing');
  return value;
};

export const useStrings = () => dictionaries[useLanguage().language];
