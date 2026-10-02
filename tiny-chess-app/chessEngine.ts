export const BOARD_SIZE = 5;

export const INITIAL_BOARD: (string | null)[][] = [
  ['bR', 'bN', 'bB', 'bQ', 'bK'],
  ['bP', 'bP', 'bP', 'bP', 'bP'],
  [null, null, null, null, null],
  ['wP', 'wP', 'wP', 'wP', 'wP'],
  ['wR', 'wN', 'wB', 'wQ', 'wK'],
];

export const PIECE_SYMBOLS: Record<string, string> = {
  'wR': '♖', 'wN': '♘', 'wB': '♗', 'wQ': '♕', 'wK': '♔', 'wP': '♙',
  'bR': '♜', 'bN': '♞', 'bB': '♝', 'bQ': '♛', 'bK': '♚', 'bP': '♟'
};

export type Move = {
  fromR: number;
  fromC: number;
  toR: number;
  toC: number;
  score?: number; // AI 평가용
};

export const getValidMovesForPiece = (r: number, c: number, currentBoard: (string | null)[][]): {r: number, c: number}[] => {
  const piece = currentBoard[r][c];
  if (!piece) return [];
  
  const color = piece.charAt(0);
  const type = piece.charAt(1);
  const moves: {r: number, c: number}[] = [];

  const addIfValid = (nr: number, nc: number) => {
    if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
      const target = currentBoard[nr][nc];
      if (!target || target.charAt(0) !== color) {
        moves.push({ r: nr, c: nc });
        return target === null; 
      }
    }
    return false;
  };

  const addLine = (dr: number, dc: number) => {
    let nr = r + dr, nc = c + dc;
    while (addIfValid(nr, nc)) {
      nr += dr;
      nc += dc;
    }
  };

  if (type === 'P') { 
    const dir = color === 'w' ? -1 : 1;
    if (r + dir >= 0 && r + dir < BOARD_SIZE && !currentBoard[r + dir][c]) {
      moves.push({ r: r + dir, c });
    }
    for (let dc of [-1, 1]) {
      const nr = r + dir, nc = c + dc;
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
        const target = currentBoard[nr][nc];
        if (target && target.charAt(0) !== color) {
          moves.push({ r: nr, c: nc });
        }
      }
    }
  } else if (type === 'R') { 
    addLine(-1, 0); addLine(1, 0); addLine(0, -1); addLine(0, 1);
  } else if (type === 'B') { 
    addLine(-1, -1); addLine(-1, 1); addLine(1, -1); addLine(1, 1);
  } else if (type === 'Q') { 
    addLine(-1, 0); addLine(1, 0); addLine(0, -1); addLine(0, 1);
    addLine(-1, -1); addLine(-1, 1); addLine(1, -1); addLine(1, 1);
  } else if (type === 'K') { 
    const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
    dirs.forEach(([dr, dc]) => addIfValid(r + dr, c + dc));
  } else if (type === 'N') { 
    const dirs = [[-2,-1],[-2,1],[2,-1],[2,1],[-1,-2],[-1,2],[1,-2],[1,2]];
    dirs.forEach(([dr, dc]) => addIfValid(r + dr, c + dc));
  }

  return moves;
};

// 모든 기물의 가능한 이동 반환
export const getAllValidMoves = (color: 'w' | 'b', board: (string | null)[][]): Move[] => {
  const allMoves: Move[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.charAt(0) === color) {
        const moves = getValidMovesForPiece(r, c, board);
        moves.forEach(m => {
          allMoves.push({ fromR: r, fromC: c, toR: m.r, toC: m.c });
        });
      }
    }
  }
  return allMoves;
};

// 가상의 보드에서 이동을 시뮬레이션
export const simulateMove = (board: (string | null)[][], move: Move): (string | null)[][] => {
  const newBoard = board.map(row => [...row]);
  const piece = newBoard[move.fromR][move.fromC]!;
  
  newBoard[move.toR][move.toC] = piece;
  newBoard[move.fromR][move.fromC] = null;

  // 폰 승급
  if (piece.charAt(1) === 'P') {
    const color = piece.charAt(0);
    if ((color === 'w' && move.toR === 0) || (color === 'b' && move.toR === BOARD_SIZE - 1)) {
      newBoard[move.toR][move.toC] = color + 'Q';
    }
  }
  return newBoard;
};
