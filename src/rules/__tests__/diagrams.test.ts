import { PIECE_ORDER, pieceDiagram } from '../diagrams';

const key = (list: { r: number; c: number }[]) => list.map(sq => `${sq.r}${sq.c}`).sort();

describe('pieceDiagram', () => {
  it('shows every piece type once', () => {
    expect(PIECE_ORDER).toHaveLength(6);
    expect(new Set(PIECE_ORDER).size).toBe(6);
  });

  it('puts long-range pieces in the middle with their full reach', () => {
    expect(pieceDiagram('K').moves).toHaveLength(8);
    expect(pieceDiagram('R').moves).toHaveLength(8);
    expect(pieceDiagram('B').moves).toHaveLength(8);
    expect(pieceDiagram('Q').moves).toHaveLength(16);
    expect(pieceDiagram('N').moves).toHaveLength(8);
  });

  it('shows the pawn stepping one square and capturing diagonally', () => {
    const pawn = pieceDiagram('P');
    expect(key(pawn.moves)).toEqual(['22']);
    expect(key(pawn.captures)).toEqual(['21', '23']);
  });
});
