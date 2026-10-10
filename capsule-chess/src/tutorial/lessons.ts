import { decodeBoard } from '../puzzles/codec';

type Square = { r: number; c: number };

// stars: 판 위의 ★을 모두 모으면 통과 (블루만 계속 둠)
// escape: 체크 상태에서 아무 합법 수나 두면 통과 (둘 수 있는 수는 모두 체크를 벗어나는 수)
// mate: 한 수 만에 체크메이트하면 통과
export type LessonKind = 'stars' | 'escape' | 'mate';

export type Lesson = {
  id: string; // 문구 키 (i18n tutorial.lessons[id])
  kind: LessonKind;
  board: (string | null)[][];
  stars: Square[];
};

// 보드 문자열: 위쪽 줄(레드 진영)부터 25칸. 대문자 = 블루, 소문자 = 레드, '.' = 빈칸
const lesson = (id: string, kind: LessonKind, encoded: string, stars: Square[] = []): Lesson => ({
  id,
  kind,
  board: decodeBoard(encoded),
  stars,
});

export const LESSONS: Lesson[] = [
  // 킹: (2,2) → (1,3) → (0,2) → (1,1), 한 칸씩
  lesson('king', 'stars', '............K............', [{ r: 1, c: 3 }, { r: 0, c: 2 }, { r: 1, c: 1 }]),
  // 룩: (4,0) → (0,0) → (0,4) → (4,4), 직선
  lesson('rook', 'stars', '....................R....', [{ r: 0, c: 0 }, { r: 0, c: 4 }, { r: 4, c: 4 }]),
  // 비숍: (4,2) → (2,0) → (0,2) → (2,4), 대각선 (같은 색 칸만)
  lesson('bishop', 'stars', '......................B..', [{ r: 2, c: 0 }, { r: 0, c: 2 }, { r: 2, c: 4 }]),
  // 퀸: (4,4) → (2,2) → (2,0) → (0,2), 직선 + 대각선
  lesson('queen', 'stars', '........................Q', [{ r: 2, c: 2 }, { r: 2, c: 0 }, { r: 0, c: 2 }]),
  // 나이트: (4,1) → (2,2) → (0,1) → (1,3), L자
  lesson('knight', 'stars', '.....................N...', [{ r: 2, c: 2 }, { r: 0, c: 1 }, { r: 1, c: 3 }]),
  // 폰: 한 칸 전진 (3,1)→(2,1), 대각선으로 레드 폰 잡기 →(1,2), 끝 줄 도착 →(0,2) 퀸 승급
  lesson('pawn', 'stars', '.......p........P........', [{ r: 2, c: 1 }, { r: 1, c: 2 }, { r: 0, c: 2 }]),
  // 체크 벗어나기: 레드 룩이 세로로 블루 킹을 공격. 피하기 / 비숍으로 막기 중 아무거나
  lesson('escape', 'escape', '..r.k...............B.K..'),
  // 체크메이트: 레드 킹이 자기 폰에 갇혀 있음. 룩을 맨 윗줄로
  lesson('mate', 'mate', '....k...pp..........R...K'),
];

export const getLesson = (id: string): Lesson | undefined => LESSONS.find(l => l.id === id);

export const nextLesson = (id: string): Lesson | undefined => LESSONS[LESSONS.findIndex(l => l.id === id) + 1];

// 레슨 목록·머리에 보여 줄 기물 몬스터
export const LESSON_PIECE: Record<string, string> = { king: 'wK', rook: 'wR', bishop: 'wB', queen: 'wQ', knight: 'wN', pawn: 'wP', escape: 'wK', mate: 'wQ' };
