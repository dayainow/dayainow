import { DIFFICULTY_DEPTH, Difficulty, getBestMove, pickAiMove } from '../chessAI';
import { INITIAL_BOARD, getAllLegalMoves, getGameStatus, simulateMove } from '../chessEngine';
import { place } from '../testing';

const DIFFICULTIES = Object.keys(DIFFICULTY_DEPTH) as Difficulty[];
// 쉬움(1수)은 상대 응수를 안 보므로 상대의 메이트 위협은 못 막음
const LOOKAHEAD_DIFFICULTIES: Difficulty[] = ['normal', 'hard'];

describe('getBestMove', () => {
  it.each(DIFFICULTIES)('finds a mate in 1 on %s', difficulty => {
    const board = place({ '4,4': 'wK', '3,3': 'wP', '3,4': 'wP', '0,0': 'bR', '0,2': 'bK' });
    for (let i = 0; i < 5; i++) {
      const move = getBestMove(board, DIFFICULTY_DEPTH[difficulty])!;
      expect(getGameStatus('w', simulateMove(board, move))).toBe('checkmate');
    }
  });

  it('avoids a mate in 1 for white on normal and hard', () => {
    // 흑 킹이 자기 폰에 갇혀 있어서 백 룩이 맨 윗줄로 오면 메이트. 흑은 이를 막는 수를 둬야 함
    const board = place({ '0,4': 'bK', '1,3': 'bP', '1,4': 'bP', '2,0': 'bR', '4,1': 'wR', '4,4': 'wK' });
    expect(getGameStatus('b', simulateMove(board, { fromR: 4, fromC: 1, toR: 0, toC: 1 }))).toBe('checkmate');
    for (const difficulty of LOOKAHEAD_DIFFICULTIES) {
      // AI에 무작위 요소가 있으므로 여러 번 반복해서 우연히 통과하지 않게 함
      for (let i = 0; i < 30; i++) {
        const afterBlack = simulateMove(board, getBestMove(board, DIFFICULTY_DEPTH[difficulty])!);
        const whiteMates = getAllLegalMoves('w', afterBlack).some(
          m => getGameStatus('b', simulateMove(afterBlack, m)) === 'checkmate'
        );
        expect(whiteMates).toBe(false);
      }
    }
  });

  it('returns null when it has no legal moves', () => {
    expect(getBestMove(place({ '0,0': 'bK', '2,1': 'wQ', '4,4': 'wK' }), DIFFICULTY_DEPTH.hard)).toBeNull();
  });

  it('pickAiMove plays the best move when it does not blunder', () => {
    const board = place({ '4,4': 'wK', '3,3': 'wP', '3,4': 'wP', '0,0': 'bR', '0,2': 'bK' });
    const move = pickAiMove(board, { depth: 2, blunder: 0.5 }, () => 0.99)!;
    expect(getGameStatus('w', simulateMove(board, move))).toBe('checkmate');
  });

  it('pickAiMove blunders into a random legal move', () => {
    const board = place({ '4,4': 'wK', '3,3': 'wP', '3,4': 'wP', '0,0': 'bR', '0,2': 'bK' });
    const legal = getAllLegalMoves('b', board);
    // 실수 판정(0) → 목록의 첫 수
    expect(pickAiMove(board, { depth: 2, blunder: 0.5 }, () => 0)).toEqual(legal[0]);
  });

  it('only returns legal moves', () => {
    const board = simulateMove(INITIAL_BOARD, { fromR: 3, fromC: 2, toR: 2, toC: 2 });
    const legal = getAllLegalMoves('b', board);
    for (const difficulty of DIFFICULTIES) {
      const move = getBestMove(board, DIFFICULTY_DEPTH[difficulty]);
      expect(legal).toContainEqual(move);
    }
  });
});
