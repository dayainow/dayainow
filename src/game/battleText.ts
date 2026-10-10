import { strings } from '../i18n';
import type { BattleEvent } from './commentary';

const sideName = (side: 'w' | 'b') => strings.side[side];
const other = (side: 'w' | 'b') => sideName(side === 'w' ? 'b' : 'w');

// 대사 상황 → 화면 문구. opponent가 있으면 첫 대사에 상대 이름을 넣음
export const battleText = (event: BattleEvent, vsAi: boolean, opponent?: string): string => {
  const b = strings.battle;
  const p = strings.pieces;
  switch (event.kind) {
    case 'start':
      return opponent ? b.startVs(opponent) : b.start;
    case 'promote':
      return b.promote(sideName(event.side));
    case 'capture':
      return b.capture(sideName(event.side), p[event.mover], other(event.side), p[event.captured], event.check);
    case 'check':
      return b.check(sideName(event.side), p[event.mover], other(event.side));
    case 'move':
      if (!vsAi) return b.movePvp(sideName(event.side), p[event.mover], other(event.side));
      return event.side === 'w' ? b.moveThinking(p[event.mover]) : b.moveYourTurn(p[event.mover]);
    case 'win':
      return b.win;
    case 'lose':
      return b.lose;
    case 'pvpWin':
      return b.pvpWin(sideName(event.side));
    case 'stalemate':
      return b.stalemate;
    case 'draw':
      return b.draw;
  }
};
