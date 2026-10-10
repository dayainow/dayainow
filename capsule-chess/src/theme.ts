// 캡슐체스 "캡슐 리그" 디자인 색상. 기물 몬스터(design/creatures.mjs)와 같은 팔레트를 씀
export const palette = {
  bg: '#E4F3FF', // 하늘 배경
  bgDeep: '#CFE6FA',
  panelInner: '#E8F2FF', // 창 안쪽 밝은 테두리
  blue: '#58AEFF', // 블루 팀
  blueDark: '#2E86E8',
  blueLight: '#D6ECFF',
  red: '#FF6B6B', // 레드 팀
  redDark: '#D9404A',
  redLight: '#FFE0E0',
  sun: '#FFD23F', // 주요 버튼 · 왕관
  sunLight: '#FFF1B8',
  purple: '#B18CFF',
  hpGreen: '#4CD38A',
  mint: '#6FDDB7', // 캡슐 민트 (브랜드)
  mintLight: '#CFF3E4',
  mintDark: '#1F7A5C', // 밝은 배경 위 강조 글자
  butter: '#FFD23F',
  butterLight: '#FFF1B8',
  coralLight: '#FFC7CC',
  cream: '#FFFBF3',
  ink: '#2E2A3A',
  inkSoft: '#6E6878',
  line: '#D9E4EF',
  white: '#FFFFFF',
  danger: '#D9404A',
  star: '#F2B705',
};

// 진영 색상 ("블루"/"레드" 이름과 맞춤)
export const sideColors = {
  w: palette.blue,
  b: palette.red,
};
