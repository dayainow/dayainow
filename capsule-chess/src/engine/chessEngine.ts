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

export const findKing = (color: 'w' | 'b', board: (string | null)[][]): {r: number, c: number} | null => {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === color + 'K') return { r, c };
    }
  }
  return null;
};

// color 쪽 킹이 상대 기물에게 공격받고 있는지 (= 체크)
export const isInCheck = (color: 'w' | 'b', board: (string | null)[][]): boolean => {
  const king = findKing(color, board);
  if (!king) return false;
  const enemy = color === 'w' ? 'b' : 'w';
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.charAt(0) === enemy) {
        if (getValidMovesForPiece(r, c, board).some(m => m.r === king.r && m.c === king.c)) return true;
      }
    }
  }
  return false;
};

// 자기 킹을 체크 상태로 남기는 이동을 제외한 실제 둘 수 있는 이동
export const getLegalMovesForPiece = (r: number, c: number, board: (string | null)[][]): {r: number, c: number}[] => {
  const piece = board[r][c];
  if (!piece) return [];
  const color = piece.charAt(0) as 'w' | 'b';
  return getValidMovesForPiece(r, c, board).filter(m =>
    !isInCheck(color, simulateMove(board, { fromR: r, fromC: c, toR: m.r, toC: m.c }))
  );
};

// 모든 기물의 둘 수 있는 이동 반환
export const getAllLegalMoves = (color: 'w' | 'b', board: (string | null)[][]): Move[] => {
  const allMoves: Move[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.charAt(0) === color) {
        const moves = getLegalMovesForPiece(r, c, board);
        moves.forEach(m => {
          allMoves.push({ fromR: r, fromC: c, toR: m.r, toC: m.c });
        });
      }
    }
  }
  return allMoves;
};

export type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';

// 이제 둘 차례인 쪽(color) 기준의 판 상태
export const getGameStatus = (color: 'w' | 'b', board: (string | null)[][]): GameStatus => {
  const onlyKingsLeft = board.every(row => row.every(p => !p || p.charAt(1) === 'K'));
  if (onlyKingsLeft) return 'draw';

  const inCheck = isInCheck(color, board);
  if (getAllLegalMoves(color, board).length === 0) {
    return inCheck ? 'checkmate' : 'stalemate';
  }
  return inCheck ? 'check' : 'playing';
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
