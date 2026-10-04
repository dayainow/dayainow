import { useEffect, useState } from 'react';
import { type AiPolicy, pickAiMove } from '../engine/chessAI';
import { type GameStatus, type Move, INITIAL_BOARD, findKing, getGameStatus, simulateMove } from '../engine/chessEngine';

type Board = (string | null)[][];
type Side = 'w' | 'b';

export type GameResult = {
  status: GameStatus;
  winner: Side | null;
  blueMoves: number; // 블루(사용자)가 둔 수
};

const isFinished = (status: GameStatus) => status === 'checkmate' || status === 'stalemate' || status === 'draw';

// 한 판의 상태 관리. ai가 있으면 레드(b)는 AI가 둠
export const useChessGame = ({ initialBoard = INITIAL_BOARD, ai }: { initialBoard?: Board; ai: AiPolicy | null }) => {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [turn, setTurn] = useState<Side>('w');
  const [status, setStatus] = useState<GameStatus>(() => getGameStatus('w', initialBoard));
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [blueMoves, setBlueMoves] = useState(0);
  // 결과 모달 내용. 다시 시작해도 모달이 닫히는 동안 내용이 바뀌지 않도록 초기화하지 않음
  const [result, setResult] = useState<GameResult | null>(null);

  const isGameOver = isFinished(status);
  const checkedKing = status === 'check' || status === 'checkmate' ? findKing(turn, board) : null;
  const canPlayerMove = !isGameOver && (ai === null || turn === 'w');

  const move = (m: Move) => {
    const nextBoard = simulateMove(board, m);
    const nextTurn: Side = turn === 'w' ? 'b' : 'w';
    const nextStatus = getGameStatus(nextTurn, nextBoard);
    const nextBlueMoves = turn === 'w' ? blueMoves + 1 : blueMoves;

    setBoard(nextBoard);
    setTurn(nextTurn);
    setStatus(nextStatus);
    setLastMove(m);
    setBlueMoves(nextBlueMoves);
    if (isFinished(nextStatus)) {
      // 체크메이트면 방금 둔 쪽이 승리
      setResult({ status: nextStatus, winner: nextStatus === 'checkmate' ? turn : null, blueMoves: nextBlueMoves });
    }
  };

  // AI 차례면 약간 뜸을 들인 뒤 둠
  useEffect(() => {
    if (ai === null || turn !== 'b' || isGameOver) return;
    const timer = setTimeout(() => {
      const best = pickAiMove(board, ai);
      if (best) move(best);
    }, 600);
    return () => clearTimeout(timer);
  }, [board, turn, ai?.depth, ai?.blunder, isGameOver]);

  const reset = (nextBoard: Board = initialBoard) => {
    setBoard(nextBoard);
    setTurn('w');
    setStatus(getGameStatus('w', nextBoard));
    setLastMove(null);
    setBlueMoves(0);
  };

  return { board, turn, status, lastMove, checkedKing, isGameOver, canPlayerMove, blueMoves, result, move, reset };
};
