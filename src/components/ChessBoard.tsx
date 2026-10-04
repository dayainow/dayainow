import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { type Move, BOARD_SIZE, PIECE_SYMBOLS, getLegalMovesForPiece } from '../engine/chessEngine';
import { feedback } from '../feedback/feedback';
import { moveFeedbackKind } from '../feedback/moveKind';
import { palette, sideColors } from '../theme';

const MAX_BOARD_SIZE = 340;
const BORDER = 4;
const SLIDE_MS = 180;
const LAND_MS = 140;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

type Square = { r: number; c: number };
type Board = (string | null)[][];

type Props = {
  board: Board;
  sideToMove: 'w' | 'b';
  interactive: boolean;
  lastMove: Move | null;
  checkedKing: Square | null;
  onMove: (move: Move) => void;
  markers?: Square[]; // 튜토리얼 ★ 표시
};

// 이동 연출에 필요한 정보: 움직인 기물(승급 전 모습), 잡힌 기물
type Slide = { move: Move; mover: string; captured: string | null };

const pieceColor = (piece: string) => sideColors[piece.charAt(0) as 'w' | 'b'];

// 탭으로 기물 선택 → 이동. 남는 공간에 맞춰 크기가 정해짐 (최대 340)
export function ChessBoard({ board, sideToMove, interactive, lastMove, checkedKing, onMove, markers = [] }: Props) {
  const [selected, setSelected] = useState<Square | null>(null);
  const [targets, setTargets] = useState<Square[]>([]);
  const [size, setSize] = useState(MAX_BOARD_SIZE);
  const [slide, setSlide] = useState<Slide | null>(null);
  const progress = useRef(new Animated.Value(1)).current;
  const landing = useRef(new Animated.Value(0)).current;
  const prevBoard = useRef(board);
  const prevMove = useRef(lastMove);
  const slideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const cellSize = (size - BORDER * 2) / BOARD_SIZE;
  const pieceSize = Math.round(cellSize * 0.63);

  const clearSelection = () => {
    setSelected(null);
    setTargets([]);
  };

  // 판이 바뀌면(상대가 두거나 다시 시작) 선택 해제
  useEffect(clearSelection, [board]);
  useEffect(() => () => clearTimeout(slideTimer.current), []);

  // 새 수가 들어오면 이전 판 기준으로 미끄러지는 연출 시작 (그리기 전에 처리해서 깜빡임 없음)
  useLayoutEffect(() => {
    if (lastMove && lastMove !== prevMove.current) {
      const mover = prevBoard.current[lastMove.fromR][lastMove.fromC] ?? board[lastMove.toR][lastMove.toC];
      if (mover) {
        const captured = prevBoard.current[lastMove.toR][lastMove.toC];
        setSlide({ move: lastMove, mover, captured });
        feedback.move(moveFeedbackKind({ captured: !!captured, givesCheck: !!checkedKing }));
        progress.setValue(0);
        landing.setValue(0);
        Animated.sequence([
          Animated.timing(progress, { toValue: 1, duration: SLIDE_MS, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE_DRIVER }),
          Animated.timing(landing, { toValue: 1, duration: LAND_MS, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
        ]).start(({ finished }) => finished && setSlide(null));
        // 애니메이션 프레임이 멈춘 환경(백그라운드 탭 등)에서도 기물이 숨은 채로 남지 않도록 안전장치
        clearTimeout(slideTimer.current);
        slideTimer.current = setTimeout(() => setSlide(null), SLIDE_MS + LAND_MS + 250);
      }
    } else if (!lastMove) {
      setSlide(null);
    }
    prevMove.current = lastMove;
    prevBoard.current = board;
  }, [board, lastMove]);

  const handlePress = (r: number, c: number) => {
    if (!interactive) return;
    const piece = board[r][c];

    if (selected && selected.r === r && selected.c === c) {
      clearSelection();
    } else if (piece && piece.charAt(0) === sideToMove) {
      setSelected({ r, c });
      setTargets(getLegalMovesForPiece(r, c, board));
      feedback.select();
    } else if (selected && targets.some(t => t.r === r && t.c === c)) {
      onMove({ fromR: selected.r, fromC: selected.c, toR: r, toC: c });
      clearSelection();
    } else {
      clearSelection();
    }
  };

  const at = (sq: Square, list: Square[]) => list.some(t => t.r === sq.r && t.c === sq.c);

  return (
    <View
      style={styles.area}
      onLayout={e => {
        const { width, height } = e.nativeEvent.layout;
        setSize(Math.floor(Math.min(MAX_BOARD_SIZE, width - 32, height)));
      }}
    >
      <View style={[styles.board, { width: size, height: size }]}>
        {board.map((row, r) => (
          <View key={`row-${r}`} style={styles.row}>
            {row.map((piece, c) => {
              const isLight = (r + c) % 2 === 0;
              const isSelected = selected?.r === r && selected?.c === c;
              const isLastMove =
                !!lastMove &&
                ((lastMove.fromR === r && lastMove.fromC === c) || (lastMove.toR === r && lastMove.toC === c));
              const isCheckedKing = checkedKing?.r === r && checkedKing?.c === c;
              // 연출 중에는 도착 칸의 기물을 숨기고 위에 떠 있는 기물로 보여 줌
              const hiddenBySlide = !!slide && slide.move.toR === r && slide.move.toC === c;
              const hasMarker = at({ r, c }, markers);

              return (
                <TouchableOpacity
                  key={`cell-${r}-${c}`}
                  activeOpacity={0.7}
                  onPress={() => handlePress(r, c)}
                  style={[
                    styles.cell,
                    isLight ? styles.lightCell : styles.darkCell,
                    isLastMove && styles.lastMoveCell,
                    isCheckedKing && styles.checkCell,
                    isSelected && styles.selectedCell,
                  ]}
                >
                  {hasMarker &&
                    (piece ? (
                      <Text style={[styles.markerBadge, { fontSize: cellSize * 0.28 }]}>★</Text>
                    ) : (
                      <Text style={[styles.marker, { fontSize: cellSize * 0.5 }]}>★</Text>
                    ))}
                  {at({ r, c }, targets) && <View style={styles.targetDot} />}
                  <Text
                    style={[
                      styles.piece,
                      { fontSize: pieceSize, color: piece ? pieceColor(piece) : undefined },
                      isSelected && styles.lifted,
                      hiddenBySlide && styles.hidden,
                    ]}
                  >
                    {piece ? PIECE_SYMBOLS[piece] : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {slide && (
          <>
            {slide.captured && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.floating,
                  {
                    width: cellSize,
                    height: cellSize,
                    left: slide.move.toC * cellSize,
                    top: slide.move.toR * cellSize,
                    opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                    transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] }) }],
                  },
                ]}
              >
                <Text style={[styles.piece, { fontSize: pieceSize, color: pieceColor(slide.captured) }]}>
                  {PIECE_SYMBOLS[slide.captured]}
                </Text>
              </Animated.View>
            )}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.floating,
                {
                  width: cellSize,
                  height: cellSize,
                  left: 0,
                  top: 0,
                  transform: [
                    { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [slide.move.fromC * cellSize, slide.move.toC * cellSize] }) },
                    { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [slide.move.fromR * cellSize, slide.move.toR * cellSize] }) },
                    // 착지할 때 살짝 통통
                    { scale: landing.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.15, 1] }) },
                  ],
                },
              ]}
            >
              <Text style={[styles.piece, { fontSize: pieceSize, color: pieceColor(slide.mover) }]}>
                {PIECE_SYMBOLS[slide.mover]}
              </Text>
            </Animated.View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
  // 아이콘처럼 잉크색 굵은 외곽선
  board: { borderWidth: BORDER, borderColor: palette.ink, borderRadius: 14, overflow: 'hidden', backgroundColor: palette.white },
  row: { flex: 1, flexDirection: 'row' },
  cell: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  lightCell: { backgroundColor: palette.cream },
  darkCell: { backgroundColor: palette.mintLight },
  lastMoveCell: { backgroundColor: palette.butterLight },
  checkCell: { backgroundColor: palette.coralLight },
  selectedCell: { backgroundColor: palette.butter },
  targetDot: { position: 'absolute', width: 16, height: 16, backgroundColor: 'rgba(58, 52, 69, 0.22)', borderRadius: 8, zIndex: 1 },
  marker: { position: 'absolute', color: palette.star },
  markerBadge: { position: 'absolute', top: 2, right: 4, color: palette.star, zIndex: 3 },
  piece: { zIndex: 2 },
  // 고른 기물은 살짝 들려 보이게
  lifted: { transform: [{ scale: 1.15 }, { translateY: -2 }] },
  hidden: { opacity: 0 },
  floating: { position: 'absolute', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
});
