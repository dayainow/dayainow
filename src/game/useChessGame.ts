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

// 무르기를 위해 매 수 직전의 상태를 저장
export type Snapshot = { board: Board; turn: Side; status: GameStatus; lastMove: Move | null; blueMoves: number };

// 무르기로 돌아갈 기록 위치. AI 대전에서는 내 차례(블루)가 될 때까지 거슬러 올라감 (AI 수 + 내 수)
export const undoTargetIndex = (history: Snapshot[], vsAi: boolean): number | null => {
  if (history.length === 0) return null;
  let i = history.length - 1;
  if (vsAi) while (i > 0 && history[i].turn !== 'w') i--;
  return i;
};

// 한 판의 상태 관리. ai가 있으면 레드(b)는 AI가 둠
export const useChessGame = ({ initialBoard = INITIAL_BOARD, ai }: { initialBoard?: Board; ai: AiPolicy | null }) => {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [turn, setTurn] = useState<Side>('w');
  const [status, setStatus] = useState<GameStatus>(() => getGameStatus('w', initialBoard));
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [blueMoves, setBlueMoves] = useState(0);
  // 결과 모달 내용. 다시 시작해도 모달이 닫히는 동안 내용이 바뀌지 않도록 초기화하지 않음
  const [result, setResult] = useState<GameResult | null>(null);
  const [history, setHistory] = useState<Snapshot[]>([]);

  const isGameOver = isFinished(status);
  const checkedKing = status === 'check' || status === 'checkmate' ? findKing(turn, board) : null;
  const canPlayerMove = !isGameOver && (ai === null || turn === 'w');
  const canUndo = !isGameOver && history.length > 0;

  const move = (m: Move) => {
    setHistory(h => [...h, { board, turn, status, lastMove, blueMoves }]);
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

  const undo = () => {
    const index = undoTargetIndex(history, ai !== null);
    if (index === null || isGameOver) return;
    const snapshot = history[index];
    setBoard(snapshot.board);
    setTurn(snapshot.turn);
    setStatus(snapshot.status);
    setLastMove(snapshot.lastMove);
    setBlueMoves(snapshot.blueMoves);
    setHistory(history.slice(0, index));
  };

  const reset = (nextBoard: Board = initialBoard) => {
    setBoard(nextBoard);
    setTurn('w');
    setStatus(getGameStatus('w', nextBoard));
    setLastMove(null);
    setBlueMoves(0);
    setHistory([]);
  };

  return { board, turn, status, lastMove, checkedKing, isGameOver, canPlayerMove, canUndo, blueMoves, result, move, undo, reset };
};
