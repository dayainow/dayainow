import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Modal } from 'react-native';
import { BOARD_SIZE, INITIAL_BOARD, PIECE_SYMBOLS, getValidMovesForPiece } from './chessEngine';
import { getBestMove } from './chessAI';

export default function App() {
  const [board, setBoard] = useState<(string | null)[][]>(INITIAL_BOARD);
  const [currentTurn, setCurrentTurn] = useState<'w' | 'b'>('w');
  const [selectedSquare, setSelectedSquare] = useState<{r: number, c: number} | null>(null);
  const [validMoves, setValidMoves] = useState<{r: number, c: number}[]>([]);
  const [winner, setWinner] = useState<'w' | 'b' | null>(null);
  const [gameMode, setGameMode] = useState<'pvp' | 'pve'>('pve'); // 기본: 혼자 연습(AI 대전)

  // AI 턴 감지
  useEffect(() => {
    if (gameMode === 'pve' && currentTurn === 'b' && !winner) {
      // AI가 즉시 두면 어색하므로 약간의 딜레이 추가
      const timer = setTimeout(() => {
        const bestMove = getBestMove(board, 2); // 탐색 깊이 2
        if (bestMove) {
          executeMove(bestMove.fromR, bestMove.fromC, bestMove.toR, bestMove.toC);
        } else {
          // AI가 둘 곳이 없으면 (체크메이트 당함) 백 승리
          setWinner('w');
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, gameMode, winner]);

  const handleSquarePress = (r: number, c: number) => {
    if (winner) return; // 게임 끝남
    // PVE 모드이고 AI 턴(b)일 때는 유저 터치 방지
    if (gameMode === 'pve' && currentTurn === 'b') return;

    const clickedPiece = board[r][c];
    
    // 1. 선택된 기물이 없을 때
    if (!selectedSquare) {
      if (clickedPiece && clickedPiece.charAt(0) === currentTurn) {
        setSelectedSquare({r, c});
        setValidMoves(getValidMovesForPiece(r, c, board));
      }
      return;
    }

    // 2. 이미 선택된 상태일 때
    const isSameSquare = selectedSquare.r === r && selectedSquare.c === c;
    const isOwnPiece = clickedPiece && clickedPiece.charAt(0) === currentTurn;
    const isValidMove = validMoves.some(m => m.r === r && m.c === c);

    if (isSameSquare) {
      setSelectedSquare(null);
      setValidMoves([]);
    } else if (isOwnPiece) {
      setSelectedSquare({r, c});
      setValidMoves(getValidMovesForPiece(r, c, board));
    } else if (isValidMove) {
      executeMove(selectedSquare.r, selectedSquare.c, r, c);
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const executeMove = (fromR: number, fromC: number, toR: number, toC: number) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[fromR][fromC]!;
    const targetPiece = newBoard[toR][toC];

    newBoard[toR][toC] = piece;
    newBoard[fromR][fromC] = null;

    if (piece.charAt(1) === 'P') {
      if ((currentTurn === 'w' && toR === 0) || (currentTurn === 'b' && toR === BOARD_SIZE - 1)) {
        newBoard[toR][toC] = currentTurn + 'Q';
      }
    }

    setBoard(newBoard);
    setSelectedSquare(null);
    setValidMoves([]);

    if (targetPiece && targetPiece.charAt(1) === 'K') {
      setWinner(currentTurn);
    } else {
      setCurrentTurn(currentTurn === 'w' ? 'b' : 'w');
    }
  };

  const resetGame = () => {
    setBoard(INITIAL_BOARD);
    setCurrentTurn('w');
    setSelectedSquare(null);
    setValidMoves([]);
    setWinner(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>TINY CHESS</Text>
        <Text style={styles.subtitle}>스낵처럼 즐기는 3분 뇌지컬</Text>
        
        {/* 모드 선택 토글 */}
        <View style={styles.modeToggle}>
          <TouchableOpacity 
            style={[styles.modeBtn, gameMode === 'pve' && styles.modeBtnActive]}
            onPress={() => { setGameMode('pve'); resetGame(); }}
          >
            <Text style={[styles.modeText, gameMode === 'pve' && styles.modeTextActive]}>AI와 연습</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeBtn, gameMode === 'pvp' && styles.modeBtnActive]}
            onPress={() => { setGameMode('pvp'); resetGame(); }}
          >
            <Text style={[styles.modeText, gameMode === 'pvp' && styles.modeTextActive]}>2인 대전(기기공유)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.turnIndicator}>
          <Text style={styles.turnText}>
            현재 턴: <Text style={{color: currentTurn === 'w' ? '#3B82F6' : '#EF4444', fontWeight: 'bold'}}>
              {currentTurn === 'w' ? '블루' : '레드'}
            </Text>
          </Text>
        </View>
      </View>

      <View style={styles.boardContainer}>
        {board.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map((piece, colIndex) => {
              const isLight = (rowIndex + colIndex) % 2 === 0;
              const isSelected = selectedSquare?.r === rowIndex && selectedSquare?.c === colIndex;
              const isHighlight = validMoves.some(m => m.r === rowIndex && m.c === colIndex);
              
              return (
                <TouchableOpacity 
                  key={`cell-${rowIndex}-${colIndex}`} 
                  activeOpacity={0.7}
                  onPress={() => handleSquarePress(rowIndex, colIndex)}
                  style={[
                    styles.cell, 
                    isLight ? styles.lightCell : styles.darkCell,
                    isSelected && styles.selectedCell
                  ]}
                >
                  {isHighlight && <View style={styles.highlightDot} />}
                  <Text style={[styles.piece, piece?.startsWith('w') ? styles.whitePiece : styles.blackPiece]}>
                    {piece ? PIECE_SYMBOLS[piece] : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={resetGame}>
          <Text style={styles.buttonText}>게임 초기화</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={winner !== null} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalEmoji}>🎉</Text>
            <Text style={styles.modalTitle}>게임 종료!</Text>
            <Text style={[styles.modalWinner, { color: winner === 'w' ? '#3B82F6' : '#EF4444' }]}>
              {winner === 'w' ? '블루(White)' : '레드(Black)'} 승리
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={resetGame}>
              <Text style={styles.modalButtonText}>다시 하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 40 },
  header: { alignItems: 'center', marginTop: 10 },
  title: { fontSize: 32, fontWeight: '900', color: '#4ADE80', letterSpacing: 2 },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 5 },
  modeToggle: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 20, marginTop: 15, padding: 4 },
  modeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  modeBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  modeText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  modeTextActive: { color: '#374151' },
  turnIndicator: { marginTop: 15, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  turnText: { fontSize: 16, color: '#374151' },
  boardContainer: { width: 340, height: 340, borderWidth: 4, borderColor: '#4ADE80', borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' },
  row: { flex: 1, flexDirection: 'row' },
  cell: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  lightCell: { backgroundColor: '#F0FDF4' },
  darkCell: { backgroundColor: '#BBF7D0' },
  selectedCell: { backgroundColor: '#FEF08A' },
  highlightDot: { position: 'absolute', width: 16, height: 16, backgroundColor: 'rgba(74, 222, 128, 0.6)', borderRadius: 8, zIndex: 1 },
  piece: { fontSize: 42, zIndex: 2 },
  whitePiece: { color: '#3B82F6' },
  blackPiece: { color: '#EF4444' },
  footer: { marginBottom: 20 },
  button: { backgroundColor: '#9CA3AF', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 30 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 30, borderRadius: 20, alignItems: 'center', width: 280, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
  modalEmoji: { fontSize: 50, marginBottom: 10 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#374151', marginBottom: 5 },
  modalWinner: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  modalButton: { backgroundColor: '#4ADE80', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 20 },
  modalButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
