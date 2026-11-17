import { buildStageBoard, getStage } from '../../campaign/stages';
import { getAllLegalMoves, isInCheck, simulateMove } from '../../engine/chessEngine';
import { place } from '../../engine/testing';
import { captureGuideMove, firstGuideMove, suggestedBlueMove } from '../guide';

describe('first battle guide', () => {
  it('suggests the centre pawn step on the first stage', () => {
    expect(firstGuideMove(buildStageBoard(getStage(1)!))).toEqual({ fromR: 3, fromC: 2, toR: 2, toC: 2 });
  });

  it('offers a capture right after that step', () => {
    const after = simulateMove(buildStageBoard(getStage(1)!), { fromR: 3, fromC: 2, toR: 2, toC: 2 });
    const capture = captureGuideMove(after);
    expect(capture).not.toBeNull();
    expect(after[capture!.toR][capture!.toC]?.[0]).toBe('b');
  });

  it('prefers the most valuable target, taken by the cheapest piece', () => {
    const board = place({ '4,4': 'wK', '0,0': 'bK', '3,1': 'wP', '4,0': 'wQ', '2,0': 'bR', '3,0': 'bP' });
    expect(captureGuideMove(board)).toEqual({ fromR: 3, fromC: 1, toR: 2, toC: 0 });
  });

  it('returns null when nothing can be captured', () => {
    expect(captureGuideMove(buildStageBoard(getStage(1)!))).toBeNull();
  });
});

describe('on-demand blue hints', () => {
  it('suggests a legal move without changing any stage board', () => {
    for (let id = 1; id <= 20; id++) {
      const board = buildStageBoard(getStage(id)!);
      const before = JSON.stringify(board);
      expect(getAllLegalMoves('w', board)).toContainEqual(suggestedBlueMove(board));
      expect(JSON.stringify(board)).toBe(before);
    }
  });
  it('helps escape check instead of suggesting an illegal capture', () => {
    const board = place({ '4,4': 'wK', '0,0': 'bK', '0,4': 'bR', '3,0': 'wR' });
    expect(isInCheck('w', board)).toBe(true);
    const move = suggestedBlueMove(board)!;
    expect(getAllLegalMoves('w', board)).toContainEqual(move);
    expect(isInCheck('w', simulateMove(board, move))).toBe(false);
  });
  it('returns no hint for checkmate', () => {
    const board = place({ '4,4': 'wK', '2,2': 'bK', '3,3': 'bQ' });
    expect(suggestedBlueMove(board)).toBeNull();
  });
});
