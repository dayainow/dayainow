import { CAPSULES, earnedBadges, newBadge, opponentFor, stageInCapsule } from '../league';
import { STAGES, getStage } from '../stages';
import { powerOf } from '../../game/material';
import { INITIAL_BOARD } from '../../engine/chessEngine';
import { josa } from '../../i18n/josa';

const clearCapsule = (id: number, campaign: Record<string, number> = {}) => {
  STAGES.filter(s => s.world === id).forEach(s => (campaign[s.id] = 1));
  return campaign;
};

describe('capsule league', () => {
  it('has one badge per capsule and a master at every fifth stage', () => {
    expect(CAPSULES).toHaveLength(Math.max(...STAGES.map(s => s.world)));
    expect(STAGES.filter(s => opponentFor(s).isMaster).map(s => s.id)).toEqual([5, 10, 15, 20]);
    expect(STAGES.filter(s => opponentFor(s).isMaster).every(s => opponentFor(s).avatar === 'bK')).toBe(true);
    expect(stageInCapsule(getStage(7)!)).toBe(2);
  });

  it('awards a badge only when all five stages of a capsule are cleared', () => {
    const almost = clearCapsule(1);
    delete almost[5];
    expect(earnedBadges(almost)).toEqual([]);
    expect(newBadge(almost, { ...almost, 5: 2 })).toBe(1);
    expect(newBadge(clearCapsule(1), { ...clearCapsule(1), 5: 3 })).toBeNull();
    expect(earnedBadges(clearCapsule(2, clearCapsule(1)))).toEqual([1, 2]);
  });
});

describe('powerOf', () => {
  it('counts every piece except the king', () => {
    expect(powerOf(INITIAL_BOARD, 'w')).toBe(5 + 3 + 3 + 9 + 5);
    expect(powerOf(INITIAL_BOARD, 'b')).toBe(25);
  });
});

describe('josa', () => {
  it('picks the particle by the final consonant', () => {
    expect(josa('나이트', '을', '를')).toBe('를');
    expect(josa('폰', '을', '를')).toBe('을');
    expect(josa('새싹 배지', '을', '를')).toBe('를');
  });
});
