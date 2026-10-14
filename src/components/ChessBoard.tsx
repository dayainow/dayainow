import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { type Move, BOARD_SIZE, getGameStatus, getLegalMovesForPiece } from '../engine/chessEngine';
import { feedback } from '../feedback/feedback';
import { moveFeedbackKind } from '../feedback/moveKind';
import { strings } from '../i18n';
import { palette } from '../theme';
import { Text } from '../ui/Text';
import { PieceImage } from '../ui/PieceImage';
import { currentBoardTheme } from '../ui/boardThemes';
import { fonts } from '../ui/fonts';

const MAX_BOARD_SIZE = 400;
const BORDER = 4;
const LIFT = 5; // 아래 테두리를 더 두껍게 해서 판이 살짝 떠 보이게
const SLIDE_MS = 180;
const LAND_MS = 140;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';
const BREATH_MS = 1700; // 기물이 숨 쉬듯 살짝 오르내리는 주기의 절반
const BURST_MS = 520; // 잡을 때 반짝이가 터지는 시간
const STAMP_HOLD_MS = 750; // "체크!" 도장이 머무는 시간 (체크메이트는 계속)
const SPARKS = 8;

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
  hint?: Square | null; // 퍼즐 힌트: 움직일 기물을 빛나게
  pointer?: Square | null; // 첫 배틀 가이드: 이 칸을 손가락으로 가리키며 빛나게
  onSelect?: (square: Square | null) => void; // 기물을 고르거나 선택을 풀 때 (가이드가 다음 칸을 가리키도록)
};

// 이동 연출에 필요한 정보: 움직인 기물(승급 전 모습), 잡힌 기물
type Slide = { move: Move; mover: string; captured: string | null };
// 판 위에 쾅 찍히는 도장 (체크 / 체크메이트)
type Stamp = { text: string; key: number; final: boolean };

// 탭으로 기물 선택 → 이동. 남는 공간에 맞춰 크기가 정해짐 (최대 400)
export function ChessBoard({ board, sideToMove, interactive, lastMove, checkedKing, onMove, markers = [], hint = null, pointer = null, onSelect }: Props) {
  const [selected, setSelected] = useState<Square | null>(null);
  const [targets, setTargets] = useState<Square[]>([]);
  const [size, setSize] = useState(MAX_BOARD_SIZE);
  // 판 영역이 판보다 쓸데없이 커지지 않게 (남는 공간은 화면 위아래로 고르게 나눔)
  const [maxArea, setMaxArea] = useState<number | undefined>(undefined);
  const [slide, setSlide] = useState<Slide | null>(null);
  const progress = useRef(new Animated.Value(1)).current;
  const landing = useRef(new Animated.Value(0)).current;
  const prevBoard = useRef(board);
  const prevMove = useRef(lastMove);
  const slideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const bounce = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(1)).current;
  const [burstAt, setBurstAt] = useState<Square | null>(null);
  const stampAnim = useRef(new Animated.Value(0)).current;
  const [stamp, setStamp] = useState<Stamp | null>(null);
  const effectTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const theme = currentBoardTheme();
  const cellSize = (size - BORDER * 2) / BOARD_SIZE;
  const pieceSize = Math.round(cellSize * 0.92);

  const clearSelection = () => {
    setSelected(null);
    setTargets([]);
  };

  // 판이 바뀌면(상대가 두거나 다시 시작) 선택 해제
  useEffect(clearSelection, [board]);
  useEffect(() => onSelect?.(selected), [selected]);

  // 가이드 손가락이 콕콕 누르듯 위아래로 움직임
  useEffect(() => {
    if (!pointer) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(bounce, { toValue: 0, duration: 380, easing: Easing.in(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pointer?.r, pointer?.c]);
  useEffect(
    () => () => {
      clearTimeout(slideTimer.current);
      effectTimers.current.forEach(clearTimeout);
    },
    []
  );

  // 판 위의 몬스터들이 살아 있는 것처럼 번갈아 살짝 숨 쉬기
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: BREATH_MS, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(breath, { toValue: 0, duration: BREATH_MS, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE_DRIVER }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const later = (fn: () => void, ms: number) => {
    effectTimers.current.push(setTimeout(fn, ms));
  };

  // 잡기: 도착 칸에서 반짝이가 팡
  const playBurst = (square: Square) => {
    setBurstAt(square);
    burst.setValue(0);
    Animated.timing(burst, { toValue: 1, duration: BURST_MS, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }).start(
      ({ finished }) => finished && setBurstAt(null)
    );
  };

  // 체크·체크메이트 도장: 크게 찍혔다가 제자리로. 체크는 잠시 뒤 사라지고 체크메이트는 남음
  const playStamp = (next: Stamp) => {
    setStamp(next);
    stampAnim.setValue(0);
    Animated.spring(stampAnim, { toValue: 1, friction: 5, tension: 140, useNativeDriver: USE_NATIVE_DRIVER }).start();
    if (!next.final) later(() => setStamp(s => (s?.key === next.key ? null : s)), STAMP_HOLD_MS);
  };

  // 새 수가 들어오면 이전 판 기준으로 미끄러지는 연출 시작 (그리기 전에 처리해서 깜빡임 없음)
  useLayoutEffect(() => {
    if (lastMove && lastMove !== prevMove.current) {
      const mover = prevBoard.current[lastMove.fromR][lastMove.fromC];
      // 출발 칸에 있던 기물이 실제로 떠났을 때만 새 수로 봄 (무르기로 예전 판이 돌아올 때는 연출 없이 바로 표시)
      if (mover && !board[lastMove.fromR][lastMove.fromC] && board[lastMove.toR][lastMove.toC]) {
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

        // 착지하는 순간에 맞춰 잡기 반짝이와 체크 도장
        const square = { r: lastMove.toR, c: lastMove.toC };
        if (captured) later(() => playBurst(square), SLIDE_MS * 0.8);
        if (checkedKing) {
          const victim = board[checkedKing.r][checkedKing.c]?.[0] as 'w' | 'b' | undefined;
          const mate = !!victim && getGameStatus(victim, board) === 'checkmate';
          later(() => playStamp({ text: mate ? strings.result.checkmate : strings.check, key: Date.now(), final: mate }), SLIDE_MS + 60);
        }
      }
    } else if (!lastMove) {
      setSlide(null);
      setStamp(null);
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
      style={[styles.area, { maxHeight: maxArea }]}
      onLayout={e => {
        const { width, height } = e.nativeEvent.layout;
        const widest = Math.min(MAX_BOARD_SIZE, width - 32);
        setMaxArea(widest + LIFT);
        setSize(Math.floor(Math.min(widest, height - LIFT)));
      }}
    >
      <View style={[styles.board, { width: size, height: size + LIFT }]}>
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
              const isHint = (hint?.r === r && hint?.c === c) || (pointer?.r === r && pointer?.c === c);

              return (
                <TouchableOpacity
                  key={`cell-${r}-${c}`}
                  activeOpacity={0.7}
                  onPress={() => handlePress(r, c)}
                  style={[
                    styles.cell,
                    { backgroundColor: isLight ? theme.light : theme.dark },
                    isLastMove && styles.lastMoveCell,
                    isCheckedKing && styles.checkCell,
                    isSelected && styles.selectedCell,
                    isHint && styles.hintCell,
                  ]}
                >
                  {hasMarker &&
                    (piece ? (
                      <Text style={[styles.markerBadge, { fontSize: cellSize * 0.28 }]}>★</Text>
                    ) : (
                      <Text style={[styles.marker, { fontSize: cellSize * 0.5 }]}>★</Text>
                    ))}
                  {/* 갈 수 있는 칸은 점, 잡을 수 있는 칸은 빨간 고리 */}
                  {at({ r, c }, targets) && <View style={piece ? styles.targetRing : styles.targetDot} />}
                  {piece && (
                    <Animated.View
                      style={[
                        styles.piece,
                        {
                          transform: [
                            {
                              translateY: breath.interpolate({
                                inputRange: [0, 1],
                                outputRange: isLight ? [0, -cellSize * 0.035] : [-cellSize * 0.035, 0],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <PieceImage piece={piece} size={pieceSize} style={[isSelected && styles.lifted, hiddenBySlide && styles.hidden]} />
                    </Animated.View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {pointer && (
          <Animated.View
            style={[
              styles.pointer,
              {
                left: pointer.c * cellSize + cellSize * 0.4,
                top: pointer.r * cellSize + cellSize * 0.42,
                transform: [{ translateY: bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -cellSize * 0.12] }) }],
              },
            ]}
          >
            <Text style={{ fontSize: cellSize * 0.5 }}>👆</Text>
          </Animated.View>
        )}

        {burstAt && (
          <View style={[styles.burst, { width: cellSize, height: cellSize, left: burstAt.c * cellSize, top: burstAt.r * cellSize }]}>
            <Animated.View
              style={[
                styles.burstRing,
                {
                  width: cellSize * 0.9,
                  height: cellSize * 0.9,
                  borderRadius: cellSize,
                  opacity: burst.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }),
                  transform: [{ scale: burst.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.5] }) }],
                },
              ]}
            />
            {Array.from({ length: SPARKS }, (_, i) => {
              const angle = (i / SPARKS) * Math.PI * 2;
              const reach = cellSize * 0.75;
              return (
                <Animated.Text
                  key={i}
                  style={[
                    styles.spark,
                    {
                      fontSize: cellSize * (i % 2 ? 0.22 : 0.3),
                      color: i % 3 === 0 ? palette.white : palette.sun,
                      opacity: burst.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1, 0] }),
                      transform: [
                        { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * reach] }) },
                        { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * reach] }) },
                      ],
                    },
                  ]}
                >
                  ✦
                </Animated.Text>
              );
            })}
          </View>
        )}

        {stamp && (
          <View style={styles.stampLayer}>
            <Animated.View
              style={{
                opacity: stampAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
                transform: [{ rotate: '-8deg' }, { scale: stampAnim.interpolate({ inputRange: [0, 1], outputRange: [1.8, 1] }) }],
              }}
            >
              <View style={[styles.stamp, stamp.final && styles.stampFinal]}>
                <Text style={[styles.stampText, stamp.final && styles.stampTextFinal, { fontSize: Math.round(size * (stamp.final ? 0.085 : 0.1)) }]}>{stamp.text}</Text>
              </View>
            </Animated.View>
          </View>
        )}

        {slide && (
          <>
            {slide.captured && (
              <Animated.View
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
                <PieceImage piece={slide.captured} size={pieceSize} />
              </Animated.View>
            )}
            <Animated.View
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
              <PieceImage piece={slide.mover} size={pieceSize} />
            </Animated.View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
  // 잉크색 굵은 외곽선 + 두꺼운 아래 테두리 (장난감 판처럼)
  board: { borderWidth: BORDER, borderBottomWidth: BORDER + LIFT, borderColor: palette.ink, borderRadius: 18, overflow: 'hidden', backgroundColor: palette.white },
  row: { flex: 1, flexDirection: 'row' },
  cell: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  lastMoveCell: { backgroundColor: palette.sunLight },
  checkCell: { backgroundColor: palette.coralLight },
  selectedCell: { backgroundColor: palette.sun },
  hintCell: { borderWidth: 4, borderColor: palette.star, backgroundColor: palette.butterLight },
  targetDot: { position: 'absolute', width: 18, height: 18, backgroundColor: 'rgba(46, 42, 58, 0.25)', borderRadius: 9, zIndex: 1 },
  targetRing: { position: 'absolute', top: 3, left: 3, right: 3, bottom: 3, borderWidth: 4, borderColor: palette.red, borderRadius: 999, zIndex: 3 },
  marker: { position: 'absolute', color: palette.star },
  markerBadge: { position: 'absolute', top: 2, right: 4, color: palette.star, zIndex: 3 },
  piece: { zIndex: 2 },
  // 고른 기물은 살짝 들려 보이게
  lifted: { transform: [{ scale: 1.12 }, { translateY: -4 }] },
  hidden: { opacity: 0 },
  floating: { position: 'absolute', justifyContent: 'center', alignItems: 'center', zIndex: 10, pointerEvents: 'none' },
  pointer: { position: 'absolute', zIndex: 20, pointerEvents: 'none' },
  burst: { position: 'absolute', alignItems: 'center', justifyContent: 'center', zIndex: 15, pointerEvents: 'none' },
  burstRing: { position: 'absolute', borderWidth: 4, borderColor: palette.sun },
  spark: { position: 'absolute', fontFamily: fonts.number },
  stampLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 25, pointerEvents: 'none' },
  stamp: { backgroundColor: palette.red, borderWidth: 4, borderBottomWidth: 7, borderColor: palette.ink, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 4 },
  stampFinal: { backgroundColor: palette.sun },
  stampText: { color: palette.white, fontFamily: fonts.body },
  stampTextFinal: { color: palette.ink },
});
