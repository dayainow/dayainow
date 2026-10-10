import { getLocales } from 'expo-localization';
import { en } from './en';
import { ko, Strings } from './ko';

// 기기 언어가 한국어면 한국어, 그 외에는 모두 영어
const languageCode = getLocales()[0]?.languageCode;

export const isKorean = languageCode === 'ko';

export const strings: Strings = isKorean ? ko : en;
