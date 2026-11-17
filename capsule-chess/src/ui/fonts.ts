import type { Language } from '../i18n';

export const bodyFont = (language: Language) => language === 'ko' ? 'Jua_400Regular' : 'Fredoka_600SemiBold';

export const fonts = {
  // 숫자·영문 강조 (전력 수치, VS)
  number: 'Fredoka_700Bold',
};
