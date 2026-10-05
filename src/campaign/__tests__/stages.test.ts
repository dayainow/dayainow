import { INITIAL_BOARD, getGameStatus } from '../../engine/chessEngine';
import { MAX_STARS, STAGES, buildStageBoard, clearedStageCount, getStage, isStageUnlocked, nextStageId, starsFor } from '../stages';

describe('campaign stages', () => {
  it('has 20 stages numbered 1..20 with stronger AI in later capsules', () => {
    expect(STAGES.map(s => s.id)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    expect(MAX_STARS).toBe(60);
    const depths = STAGES.map(s => s.ai.depth);
    expect(depths).toEqual([...depths].sort((a, b) => a - b));
  });

  it('keeps mistake rates between 0 and 1 and goals growing over time', () => {
    for (const stage of STAGES) {
      expect(stage.ai.blunder ?? 0).toBeGreaterThanOrEqual(0);
      expect(stage.ai.blunder ?? 0).toBeLessThan(1);
    }
    const pars = STAGES.map(s => s.par);
    expect(pars).toEqual([...pars].sort((a, b) => a - b));
  });

  it('ends every capsule with the full starting position', () => {
    for (const stage of STAGES.filter(s => s.id % 5 === 0)) {
      expect(buildStageBoard(stage)).toEqual(INITIAL_BOARD);
    }
  });

  it('removes only red pieces and keeps both kings', () => {
    for (const stage of STAGES) {
      const board = buildStageBoard(stage);
      const blue = board.flat().filter(p => p?.startsWith('w'));
      expect(blue).toHaveLength(10);
      expect(board.flat()).toContain('bK');
      expect(getGameStatus('w', board)).toBe('playing');
    }
  });

  it('awards stars by moves used', () => {
    const stage = getStage(1)!;
    expect(starsFor(stage, stage.par)).toBe(3);
    expect(starsFor(stage, stage.par + 1)).toBe(2);
    expect(starsFor(stage, stage.par + 6)).toBe(2);
    expect(starsFor(stage, stage.par + 7)).toBe(1);
  });

  it('points "continue" at the first unlocked stage not yet cleared', () => {
    expect(nextStageId({})).toBe(1);
    expect(nextStageId({ 1: 3, 2: 1 })).toBe(3);
    expect(clearedStageCount({ 1: 3, 2: 1 })).toBe(2);
    const all = Object.fromEntries(STAGES.map(s => [s.id, 1]));
    expect(nextStageId(all)).toBeNull();
    expect(clearedStageCount(all)).toBe(20);
  });

  it('unlocks a stage after the previous one is cleared', () => {
    expect(isStageUnlocked({}, 1)).toBe(true);
    expect(isStageUnlocked({}, 2)).toBe(false);
    expect(isStageUnlocked({ 1: 1 }, 2)).toBe(true);
    expect(isStageUnlocked({ 1: 3 }, 3)).toBe(false);
  });
});
