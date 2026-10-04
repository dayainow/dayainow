export type MoveFeedback = 'move' | 'capture' | 'check';

// 한 수에 어떤 소리·진동을 줄지: 체크가 가장 중요하고, 그다음 잡기
export const moveFeedbackKind = ({ captured, givesCheck }: { captured: boolean; givesCheck: boolean }): MoveFeedback =>
  givesCheck ? 'check' : captured ? 'capture' : 'move';
