import { buildStageBoard, getStage } from '../../campaign/stages';
import { simulateMove } from '../../engine/chessEngine';
import { place } from '../../engine/testing';
import { captureGuideMove, firstGuideMove } from '../guide';

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
