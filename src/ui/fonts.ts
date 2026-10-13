import { isJapanese, isKorean } from '../i18n';

// 한국어는 주아, 일본어는 모치이 팝 원, 영어는 Fredoka (모두 OFL 무료 글꼴). 파일은 app/_layout.tsx에서 불러옴
export const fonts = {
  body: isKorean ? 'Jua_400Regular' : isJapanese ? 'MochiyPopOne_400Regular' : 'Fredoka_600SemiBold',
  // 숫자·영문 강조 (전력 수치, VS)
  number: 'Fredoka_700Bold',
};
