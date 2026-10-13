import { getLocales } from 'expo-localization';
import { en } from './en';
import { ja } from './ja';
import { ko, Strings } from './ko';

// 기기 언어가 한국어면 한국어, 일본어면 일본어, 그 외에는 모두 영어
const languageCode = getLocales()[0]?.languageCode;

export const isKorean = languageCode === 'ko';
export const isJapanese = languageCode === 'ja';

export const strings: Strings = isKorean ? ko : isJapanese ? ja : en;
