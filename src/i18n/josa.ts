// 받침 유무에 따라 조사 고르기: josa('나이트', '을', '를') → '를'
export const josa = (word: string, withFinal: string, withoutFinal: string): string => {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return withFinal;
  return code % 28 === 0 ? withoutFinal : withFinal;
};
