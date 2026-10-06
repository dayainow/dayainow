import { type Move, BOARD_SIZE, getAllLegalMoves, isInCheck, simulateMove } from './chessEngine';

// 기물별 가치 점수
const PIECE_VALUES: Record<string, number> = {
  'P': 10,
  'N': 30,
  'B': 30,
  'R': 50,
  'Q': 90,
  'K': 900
};

// 체크메이트 점수: 기물 점수 합보다 충분히 크게
const MATE_SCORE = 100000;

export type Difficulty = 'easy' | 'normal' | 'hard';

// 난이도별 탐색 깊이 (흑/백 합쳐서 몇 수 앞까지 읽는지)
export const DIFFICULTY_DEPTH: Record<Difficulty, number> = {
  easy: 1,   // 지금 당장 잡을 수 있는 기물만 봄
  normal: 2, // 내 수 + 상대의 바로 다음 수까지
  hard: 4,   // 서로 두 번씩 주고받는 것까지
};

// 비싼 기물을 잡는 수부터 탐색하면 Alpha-Beta 가지치기가 잘 됨
const orderMoves = (board: (string | null)[][], moves: Move[]): Move[] => {
  const captureValue = (m: Move) => {
    const target = board[m.toR][m.toC];
    return target ? PIECE_VALUES[target.charAt(1)] : 0;
  };
  return moves.sort((a, b) => captureValue(b) - captureValue(a));
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

// Minimax + Alpha-Beta (5x5 보드라 Depth 4까지도 모바일에서 지연 없음)
export const getBestMove = (board: (string | null)[][], depth: number = DIFFICULTY_DEPTH.normal): Move | null => {
  const possibleMoves = orderMoves(board, getAllLegalMoves('b', board));

  if (possibleMoves.length === 0) return null;

  let bestMove = possibleMoves[0];
  let bestScore = -Infinity;

  for (const move of possibleMoves) {
    const newBoard = simulateMove(board, move);
    // 상대방(백)의 차례를 시뮬레이션 (지금까지 최고 점수보다 못한 수는 일찍 잘라냄)
    const score = minimax(newBoard, depth - 1, false, bestScore, Infinity);
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
};

// AI 성향: 탐색 깊이 + 가끔 실수하는 확률 (깊이만으로는 단계가 너무 크게 나뉘어서 난이도를 세밀하게 조절)
export type AiPolicy = { depth: number; blunder?: number };

// blunder 확률로 아무 합법 수나 둠 (사람처럼 가끔 실수), 아니면 최선의 수
export const pickAiMove = (
  board: (string | null)[][],
  { depth, blunder = 0 }: AiPolicy,
  random: () => number = Math.random
): Move | null => {
  if (blunder > 0 && random() < blunder) {
    const moves = getAllLegalMoves('b', board);
    return moves.length > 0 ? moves[Math.floor(random() * moves.length)] : null;
  }
  return getBestMove(board, depth);
};

const minimax = (board: (string | null)[][], depth: number, isMaximizingPlayer: boolean, alpha: number, beta: number): number => {
  if (depth === 0) {
    // 수읽기 끝에서도 체크메이트는 확인 (체크일 때만 비싼 합법 수 검사)
    const toMove = isMaximizingPlayer ? 'b' : 'w';
    if (isInCheck(toMove, board) && getAllLegalMoves(toMove, board).length === 0) {
      return isMaximizingPlayer ? -MATE_SCORE : MATE_SCORE;
    }
    return evaluateBoard(board);
  }

  if (isMaximizingPlayer) { // 흑(b)의 턴 (점수 극대화)
    const moves = orderMoves(board, getAllLegalMoves('b', board));
    // 둘 곳이 없으면: 체크면 흑 패배(체크메이트), 아니면 무승부(스테일메이트)
    // depth를 더해서 더 빨리 끝나는 메이트를 더 크게 평가
    if (moves.length === 0) return isInCheck('b', board) ? -(MATE_SCORE + depth) : 0;

    let maxEval = -Infinity;
    for (const move of moves) {
      const evalScore = minimax(simulateMove(board, move), depth - 1, false, alpha, beta);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break; // Alpha-Beta Pruning
    }
    return maxEval;
  } else { // 백(w)의 턴 (점수 최소화)
    const moves = orderMoves(board, getAllLegalMoves('w', board));
    if (moves.length === 0) return isInCheck('w', board) ? MATE_SCORE + depth : 0;

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
