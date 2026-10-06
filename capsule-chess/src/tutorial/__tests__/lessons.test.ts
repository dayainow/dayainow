import { getAllLegalMoves, getLegalMovesForPiece, isInCheck, simulateMove } from '../../engine/chessEngine';
import { canForceMate } from '../../engine/mateSolver';
import { LESSONS, getLesson, nextLesson } from '../lessons';

type Board = (string | null)[][];
type Square = { r: number; c: number };

// 블루만 계속 둘 때 ★을 모두 모을 수 있는지 (너비 우선 탐색, 최대 깊이 제한)
const canCollectAllStars = (board: Board, stars: Square[], maxMoves: number): boolean => {
  const key = (b: Board, left: Square[]) => JSON.stringify(b) + JSON.stringify(left);
  let frontier: [Board, Square[]][] = [[board, stars]];
  const seen = new Set([key(board, stars)]);
  for (let depth = 0; depth < maxMoves; depth++) {
    const next: [Board, Square[]][] = [];
    for (const [b, left] of frontier) {
      for (const move of getAllLegalMoves('w', b)) {
        const after = simulateMove(b, move);
        const remaining = left.filter(s => !(s.r === move.toR && s.c === move.toC));
        if (remaining.length === 0) return true;
        const k = key(after, remaining);
        if (!seen.has(k)) {
          seen.add(k);
          next.push([after, remaining]);
        }
      }
    }
    frontier = next;
  }
  return false;
};

describe('tutorial lessons', () => {
  it('has unique ids in order, ending with check and mate', () => {
    expect(LESSONS.map(l => l.id)).toEqual(['king', 'rook', 'bishop', 'queen', 'knight', 'pawn', 'escape', 'mate']);
    expect(getLesson('rook')?.kind).toBe('stars');
    expect(nextLesson('king')?.id).toBe('rook');
    expect(nextLesson('mate')).toBeUndefined();
  });

  it.each(LESSONS.filter(l => l.kind === 'stars').map(l => [l.id, l] as const))(
    '%s: every star can be collected in as many moves as there are stars',
    (_id, lesson) => {
      // 별이 빈칸이거나 잡을 수 있는 레드 기물 위에 있어야 함
      for (const s of lesson.stars) expect(lesson.board[s.r][s.c]?.startsWith('w') ?? false).toBe(false);
      expect(canCollectAllStars(lesson.board, lesson.stars, lesson.stars.length)).toBe(true);
    }
  );

  it('pawn lesson only steps one square forward at the start', () => {
    const pawn = getLesson('pawn')!;
    expect(getLegalMovesForPiece(3, 1, pawn.board)).toEqual([{ r: 2, c: 1 }]);
  });

  it('escape lesson starts in check with several ways out', () => {
    const { board } = getLesson('escape')!;
    expect(isInCheck('w', board)).toBe(true);
    const moves = getAllLegalMoves('w', board);
    expect(moves.length).toBeGreaterThan(2);
    expect(moves.every(m => !isInCheck('w', simulateMove(board, m)))).toBe(true);
  });

  it('mate lesson is a mate in 1', () => {
    expect(canForceMate(getLesson('mate')!.board, 'w', 1)).toBe(true);
  });
});
