import { INITIAL_BOARD, simulateMove } from '../chessEngine';
import { canForceMate, findMatingMoves, forcesMate, isCheckmated, pickStubbornReply } from '../mateSolver';
import { place } from '../testing';

// 레드 킹이 자기 폰에 갇혀 있어 블루 룩이 맨 윗줄로 오면 메이트
const MATE_IN_1 = place({ '4,0': 'wR', '4,4': 'wK', '1,3': 'bP', '1,4': 'bP', '0,4': 'bK' });

describe('mateSolver', () => {
  it('finds a mate in 1 and its only key move', () => {
    expect(canForceMate(MATE_IN_1, 'w', 1)).toBe(true);
    expect(findMatingMoves(MATE_IN_1, 'w', 1)).toEqual([{ fromR: 4, fromC: 0, toR: 0, toC: 0 }]);
  });

  it('detects the resulting checkmate', () => {
    const after = simulateMove(MATE_IN_1, { fromR: 4, fromC: 0, toR: 0, toC: 0 });
    expect(isCheckmated('b', after)).toBe(true);
    expect(forcesMate(after, 'w', 1)).toBe(true);
  });

  it('rejects a move that does not mate', () => {
    const after = simulateMove(MATE_IN_1, { fromR: 4, fromC: 0, toR: 3, toC: 0 });
    expect(forcesMate(after, 'w', 1)).toBe(false);
  });

  it('finds no forced mate from the starting position', () => {
    expect(canForceMate(INITIAL_BOARD, 'w', 2)).toBe(false);
  });

  it('does not count stalemate as a mate', () => {
    // 레드 킹이 둘 곳이 없지만 체크는 아님
    const stalemate = place({ '0,0': 'bK', '2,1': 'wQ', '4,4': 'wK' });
    expect(isCheckmated('b', stalemate)).toBe(false);
    expect(forcesMate(stalemate, 'w', 2)).toBe(false);
  });

  it('picks a legal defensive reply', () => {
    const board = place({ '4,0': 'wR', '4,4': 'wK', '2,2': 'bN', '1,4': 'bP', '0,4': 'bK' });
    const reply = pickStubbornReply(board, 'w', 2);
    expect(reply).not.toBeNull();
    expect(board[reply!.fromR][reply!.fromC]?.charAt(0)).toBe('b');
  });
});
