import { en } from '../en';
import { ko } from '../ko';
import { dictionaries, resolveLanguage } from '../index';

// 모든 문구가 빈 문자열이 아닌지 (번역 누락 방지)
const collectStrings = (value: unknown): string[] =>
  typeof value === 'string' ? [value] : Object.values(value as object).flatMap(collectStrings);

describe('i18n', () => {
  it('uses Korean for Korean devices', () => {
    expect(dictionaries[resolveLanguage('system', 'ko')]).toBe(ko);
  });

  it('honors a manually selected language ahead of the device language', () => {
    expect(dictionaries[resolveLanguage('en', 'ko')]).toBe(en);
    expect(dictionaries[resolveLanguage('ko', 'en')]).toBe(ko);
  });

  it.each(['en', 'ja', 'de', null])('uses English for %s', code => {
    expect(dictionaries[resolveLanguage('system', code)]).toBe(en);
  });

  it('has no empty strings in any language', () => {
    for (const dictionary of Object.values(dictionaries)) {
      expect(collectStrings(dictionary).every(s => s.trim().length > 0)).toBe(true);
    }
  });

  // 한국어 원본에서 그대로 복사해 두고 번역을 잊은 곳이 없는지 (한글이 섞이면 안 됨)
  it('has no leftover Korean in the English text', () => {
    expect(collectStrings(en).filter(s => /[가-힣]/.test(s))).toEqual([]);
  });
});
