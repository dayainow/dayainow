// 배틀 화면의 전력 게이지: 남아 있는 기물의 점수 합 (킹 제외)
export const PIECE_POWER: Record<string, number> = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };

export const powerOf = (board: (string | null)[][], side: 'w' | 'b'): number =>
  board.flat().reduce((sum, piece) => (piece && piece[0] === side ? sum + (PIECE_POWER[piece[1]] ?? 0) : sum), 0);
