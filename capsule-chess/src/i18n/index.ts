import { en } from './en';
import { ko } from './ko';

export type { Strings } from './ko';

export const dictionaries = { en, ko };
export type Language = keyof typeof dictionaries;
export type LanguagePreference = Language | 'system';

export const isLanguagePreference = (value: unknown): value is LanguagePreference =>
  value === 'system' || value === 'ko' || value === 'en';

export const resolveLanguage = (preference: LanguagePreference, deviceLanguage?: string | null): Language =>
  preference === 'system' ? (deviceLanguage === 'ko' ? 'ko' : 'en') : preference;
