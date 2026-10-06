import type { GameStatus, Move } from '../engine/chessEngine';

export type Mood = 'normal' | 'happy' | 'surprised' | 'thinking' | 'sad';

// 말풍선 대사 종류 (실제 문구는 i18n strings.mascot)
export type MascotLine =
  | 'start'
  | 'yourTurn'
  | 'thinking'
  | 'goodCapture'
  | 'gotCaptured'
  | 'giveCheck'
  | 'inCheck'
  | 'win'
  | 'lose'
  | 'draw'
  | 'pvpTurn'
  | 'pvpCheck'
  | 'pvpCapture'
  | 'pvpWin';

export type ReactionInput = {
  vsAi: boolean; // AI 대전이면 사용자는 블루(w)
  turn: 'w' | 'b'; // 지금 둘 차례
  status: GameStatus;
  lastMove: Move | null;
  lastCaptured: string | null;
  winner: 'w' | 'b' | null;
  isGameOver: boolean;
};

// 판 상황 → 마스코트 표정과 대사. 우선순위: 게임 끝 > 체크 > 잡기 > 차례
export const mascotReaction = (s: ReactionInput): { mood: Mood; line: MascotLine } => {
  if (s.isGameOver) {
    if (!s.winner) return { mood: 'thinking', line: 'draw' };
    if (!s.vsAi) return { mood: 'happy', line: 'pvpWin' };
    return s.winner === 'w' ? { mood: 'happy', line: 'win' } : { mood: 'sad', line: 'lose' };
  }

  const justMoved = s.turn === 'w' ? 'b' : 'w';

  if (!s.vsAi) {
    if (s.status === 'check') return { mood: 'surprised', line: 'pvpCheck' };
    if (s.lastMove && s.lastCaptured) return { mood: 'happy', line: 'pvpCapture' };
    return { mood: 'normal', line: 'pvpTurn' };
  }

  if (s.status === 'check') return s.turn === 'b' ? { mood: 'happy', line: 'giveCheck' } : { mood: 'surprised', line: 'inCheck' };
  if (s.lastMove && s.lastCaptured) {
    return justMoved === 'w' ? { mood: 'happy', line: 'goodCapture' } : { mood: 'surprised', line: 'gotCaptured' };
  }
  if (s.turn === 'b') return { mood: 'thinking', line: 'thinking' };
  return { mood: 'normal', line: s.lastMove ? 'yourTurn' : 'start' };
};

// 같은 상황에서도 매번 같은 말만 하지 않도록 수 번호로 대사 고르기 (렌더링마다 바뀌지 않게 결정적으로)
export const pickVariant = <T,>(options: T[], seed: number): T => options[Math.abs(seed) % options.length];
