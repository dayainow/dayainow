import { BOARD_SIZE, getAllValidMoves, simulateMove, Move } from './chessEngine';

// 기물별 가치 점수
const PIECE_VALUES: Record<string, number> = {
  'P': 10,
  'N': 30,
  'B': 30,
  'R': 50,
  'Q': 90,
  'K': 900
};

// 현재 보드의 점수를 평가 (흑(b)의 관점에서 평가: 높을수록 흑에게 유리)
const evaluateBoard = (board: (string | null)[][]): number => {
  let score = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece) {
        const color = piece.charAt(0);
        const type = piece.charAt(1);
        const value = PIECE_VALUES[type] || 0;
        
        if (color === 'b') {
          score += value;
        } else {
          score -= value;
        }
      }
    }
  }
  // 약간의 랜덤성을 부여하여 AI가 매번 똑같이 두지 않게 함 (0 ~ 1 사이 점수 흔들기)
  score += Math.random() * 2 - 1;
  return score;
};

// 간단한 Minimax 알고리즘 (Depth 2 정도로 얕게 탐색하여 모바일에서 지연 없게 함)
export const getBestMove = (board: (string | null)[][], depth: number = 2): Move | null => {
  const possibleMoves = getAllValidMoves('b', board);
  
  if (possibleMoves.length === 0) return null;

  let bestMove = possibleMoves[0];
  let bestScore = -Infinity;

  for (const move of possibleMoves) {
    const newBoard = simulateMove(board, move);
    // 상대방(백)의 차례를 시뮬레이션
    const score = minimax(newBoard, depth - 1, false, -Infinity, Infinity);
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
};

const minimax = (board: (string | null)[][], depth: number, isMaximizingPlayer: boolean, alpha: number, beta: number): number => {
  if (depth === 0) {
    return evaluateBoard(board);
  }

  if (isMaximizingPlayer) { // 흑(b)의 턴 (점수 극대화)
    const moves = getAllValidMoves('b', board);
    if (moves.length === 0) return evaluateBoard(board); // 이동 불가

    let maxEval = -Infinity;
    for (const move of moves) {
      const evalScore = minimax(simulateMove(board, move), depth - 1, false, alpha, beta);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break; // Alpha-Beta Pruning
    }
    return maxEval;
  } else { // 백(w)의 턴 (점수 최소화)
    const moves = getAllValidMoves('w', board);
    if (moves.length === 0) return evaluateBoard(board); 

    let minEval = Infinity;
    for (const move of moves) {
      const evalScore = minimax(simulateMove(board, move), depth - 1, true, alpha, beta);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break; // Alpha-Beta Pruning
    }
    return minEval;
  }
};
