import { en } from '../en';
import { ja } from '../ja';
import { ko } from '../ko';

const loadStringsFor = (languageCode: string | null) => {
  let strings;
  jest.isolateModules(() => {
    jest.doMock('expo-localization', () => ({ getLocales: () => [{ languageCode }] }));
    strings = require('../index').strings;
  });
  return strings;
};

// 모든 문구가 빈 문자열이 아닌지 (번역 누락 방지)
const collectStrings = (value: unknown): string[] =>
  typeof value === 'string' ? [value] : Object.values(value as object).flatMap(collectStrings);

// 다시 불러온 사전은 함수 인스턴스가 달라서, 문자열 전체와 함수 결과로 비교
const sameDictionary = (actual: any, expected: typeof ko) => {
  expect(JSON.stringify(actual)).toBe(JSON.stringify(expected));
  expect(actual.daily.title(7)).toBe(expected.daily.title(7));
};

describe('i18n', () => {
  it('uses Korean for Korean devices', () => {
    sameDictionary(loadStringsFor('ko'), ko);
  });

  it('uses Japanese for Japanese devices', () => {
    sameDictionary(loadStringsFor('ja'), ja);
  });

  it.each(['en', 'de', null])('falls back to English for %s', code => {
    sameDictionary(loadStringsFor(code), en);
  });

  it('has no empty strings in any language', () => {
    for (const dictionary of [ko, en, ja]) {
      expect(collectStrings(dictionary).every(s => s.trim().length > 0)).toBe(true);
    }
  });

  // 한국어 원본에서 그대로 복사해 두고 번역을 잊은 곳이 없는지 (한글이 섞이면 안 됨)
  it('has no leftover Korean in the English and Japanese texts', () => {
    for (const dictionary of [en, ja]) {
      expect(collectStrings(dictionary).filter(s => /[가-힣]/.test(s))).toEqual([]);
    }
  });
});
