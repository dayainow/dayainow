import { useEffect, useRef, useState } from 'react';
import { type Move, findKing, isInCheck, simulateMove } from '../engine/chessEngine';
import { findMatingMoves, forcesMate, isCheckmated, pickStubbornReply } from '../engine/mateSolver';
import { feedback } from '../feedback/feedback';
import { strings } from '../i18n';

type Board = (string | null)[][];
type Square = { r: number; c: number };

type Options = {
  board: Board; // 시작 판 (블루 차례)
  mateIn: number; // 블루가 둘 수 있는 수
  onSolved?: (attempts: number, hints: number) => void;
  onWrong?: (attempt: number) => void;
  onHint?: () => void;
};

const WRONG_RESET_MS = 900;
const REPLY_MS = 600;

// "N수 만에 메이트" 퍼즐 한 판의 상태 (오늘의 퍼즐과 퍼즐 도장이 함께 씀)
// 오답이면 잠깐 보여 준 뒤 처음부터, 정답이면 레드가 가장 끈질긴 수로 응수
export const usePuzzle = ({ board: start, mateIn, onSolved, onWrong, onHint }: Options) => {
  const [board, setBoard] = useState(start);
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [movesLeft, setMovesLeft] = useState(mateIn);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [attempts, setAttempts] = useState(1);
  const [hints, setHints] = useState(0);
  const [hintSquare, setHintSquare] = useState<Square | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const restart = () => {
    setBoard(start);
    setTurn('w');
    setMovesLeft(mateIn);
    setLastMove(null);
    setHintSquare(null);
  };

  // 예전에 이미 푼 퍼즐을 다시 열었을 때 결과만 보여 줌
  const restoreSolved = (savedAttempts: number, savedHints: number) => {
    setSolved(true);
    setAttempts(savedAttempts);
    setHints(savedHints);
  };

  // 힌트: 지금 움직여야 할 기물을 빛나게 (같은 위치에서 다시 눌러도 횟수는 한 번만)
  const showHint = () => {
    if (solved || turn !== 'w' || hintSquare) return;
    const [key] = findMatingMoves(board, 'w', movesLeft);
    if (!key) return;
    setHintSquare({ r: key.fromR, c: key.fromC });
    setHints(n => n + 1);
    setMessage(strings.daily.hintShown);
    onHint?.();
  };

  const handleMove = (move: Move) => {
    const after = simulateMove(board, move);
    setBoard(after);
    setLastMove(move);
    setTurn('b');
    setHintSquare(null);

    // 남은 수 안에 메이트를 강제하지 못하는 수면 오답: 잠깐 보여 준 뒤 처음부터
    if (!forcesMate(after, 'w', movesLeft)) {
      setMessage(strings.daily.wrong);
      later(feedback.wrong, 250);
      onWrong?.(attempts);
      later(() => {
        setAttempts(n => n + 1);
        restart();
      }, WRONG_RESET_MS);
      return;
    }

    setMessage(null);
    if (isCheckmated('b', after)) {
      later(feedback.win, 250);
      setSolved(true);
      onSolved?.(attempts, hints);
      return;
    }

    later(() => {
      const reply = pickStubbornReply(after, 'w', movesLeft);
      if (!reply) return;
      setBoard(simulateMove(after, reply));
      setLastMove(reply);
      setTurn('w');
      setMovesLeft(n => n - 1);
    }, REPLY_MS);
  };

  const checkedKing = isInCheck(turn, board) ? findKing(turn, board) : null;

  return {
    board,
    turn,
    movesLeft,
    lastMove,
    attempts,
    hints,
    hintSquare,
    message,
    setMessage,
    solved,
    checkedKing,
    canHint: !solved && turn === 'w' && !hintSquare,
    handleMove,
    showHint,
    restoreSolved,
  };
};
