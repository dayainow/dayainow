import { moveFeedbackKind } from '../moveKind';

describe('moveFeedbackKind', () => {
  it('prefers check over capture over a plain move', () => {
    expect(moveFeedbackKind({ captured: true, givesCheck: true })).toBe('check');
    expect(moveFeedbackKind({ captured: true, givesCheck: false })).toBe('capture');
    expect(moveFeedbackKind({ captured: false, givesCheck: false })).toBe('move');
  });
});
