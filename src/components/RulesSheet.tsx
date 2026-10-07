import { router, usePathname } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { INITIAL_BOARD } from '../engine/chessEngine';
import { strings } from '../i18n';
import { PIECE_ORDER, type PieceType, pieceDiagram } from '../rules/diagrams';
import { palette, sideColors } from '../theme';
import { MiniBoard } from './MiniBoard';
import { RuleList } from './RuleList';

type Tab = 'basics' | 'pieces';

const MAX_WIDTH = 520;
const PADDING = 20;
const GRID_GAP = 12;
const SHEET_BORDER = 3;

// 기물 이름은 튜토리얼 레슨 제목을 그대로 씀
const PIECE_NAME: Record<PieceType, keyof typeof strings.tutorial.lessons> = {
  K: 'king',
  Q: 'queen',
  R: 'rook',
  B: 'bishop',
  N: 'knight',
  P: 'pawn',
};
const DIAGRAMS = PIECE_ORDER.map(type => ({ type, ...pieceDiagram(type) }));

type Props = { visible: boolean; onClose: () => void };

// 어느 화면에서든 ? 버튼으로 여는 규칙 안내 (아래에서 올라오는 시트)
export function RulesSheet({ visible, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('basics');
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    rise.setValue(0);
    Animated.spring(rise, { toValue: 1, friction: 9, tension: 70, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [visible]);

  const sheetWidth = Math.min(width, MAX_WIDTH);
  const cardWidth = Math.floor((sheetWidth - SHEET_BORDER * 2 - PADDING * 2 - GRID_GAP) / 2);
  const startBoardSize = Math.min(190, sheetWidth - 120);
  const onLearnScreen = pathname.startsWith('/learn');

  const goLearn = () => {
    onClose();
    router.push('/learn');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={strings.rules.close} />
        <Animated.View
          style={[
            styles.sheet,
            { width: sheetWidth, paddingBottom: Math.max(insets.bottom, 12) },
            { transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }] },
          ]}
        >
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Image source={require('../../assets/mascot/happy.png')} style={styles.mascot} />
            <Text style={styles.title}>{strings.rules.title}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityLabel={strings.rules.close} hitSlop={8}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            {(['basics', 'pieces'] as const).map(key => (
              <TouchableOpacity key={key} style={[styles.tab, tab === key && styles.tabActive]} onPress={() => setTab(key)}>
                <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
                  {key === 'basics' ? strings.rules.tabBasics : strings.rules.tabPieces}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {tab === 'basics' ? (
              <>
                <View style={styles.boardCard}>
                  <MiniBoard board={INITIAL_BOARD} size={startBoardSize} />
                  <Text style={styles.caption}>{strings.rules.boardCaption}</Text>
                </View>

                <Text style={styles.sectionTitle}>{strings.rules.diffTitle}</Text>
                <View style={styles.card}>
                  <RuleList items={strings.rules.diffs} />
                </View>

                <Text style={styles.sectionTitle}>{strings.rules.outcomeTitle}</Text>
                <View style={styles.card}>
                  <RuleList items={strings.rules.outcomes} />
                </View>
              </>
            ) : (
              <>
                <View style={styles.legend}>
                  <View style={styles.legendItem}>
                    <View style={styles.legendDot} />
                    <Text style={styles.legendText}>{strings.rules.legendMove}</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={styles.legendRing} />
                    <Text style={styles.legendText}>{strings.rules.legendCapture}</Text>
                  </View>
                </View>

                <View style={styles.grid}>
                  {DIAGRAMS.map(d => (
                    <View key={d.type} style={[styles.pieceCard, { width: cardWidth }]}>
                      <MiniBoard board={d.board} size={cardWidth - 20} moves={d.moves} captures={d.captures} focus={d.from} />
                      <Text style={styles.pieceName}>{strings.tutorial.lessons[PIECE_NAME[d.type]].title}</Text>
                      <Text style={styles.pieceMove}>{strings.rules.pieces[d.type]}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {!onLearnScreen && (
              <TouchableOpacity style={styles.cta} onPress={goLearn}>
                <Text style={styles.ctaText}>🎓 {strings.rules.learnCta} ›</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(58, 52, 69, 0.5)', justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { height: '88%', backgroundColor: palette.mintMist, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: SHEET_BORDER, borderBottomWidth: 0, borderColor: palette.ink, overflow: 'hidden' },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: palette.line, marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: PADDING, paddingTop: 8, paddingBottom: 12 },
  mascot: { width: 44, height: 44 },
  title: { flex: 1, fontSize: 21, fontWeight: '900', color: palette.ink },
  closeButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: palette.ink, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 15, fontWeight: '900', color: palette.ink },
  tabs: { flexDirection: 'row', marginHorizontal: PADDING, padding: 4, borderRadius: 22, borderWidth: 2, borderColor: palette.ink, backgroundColor: palette.white },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 18 },
  tabActive: { backgroundColor: palette.butter },
  tabText: { fontSize: 15, fontWeight: '800', color: palette.inkSoft },
  tabTextActive: { color: palette.ink, fontWeight: '900' },
  scroll: { flex: 1 },
  content: { padding: PADDING, paddingTop: 16, gap: 10 },
  boardCard: { alignItems: 'center', gap: 10, backgroundColor: palette.white, borderRadius: 20, borderWidth: 2, borderColor: palette.ink, paddingVertical: 18 },
  caption: { fontSize: 14, fontWeight: '800', color: palette.ink },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: palette.mintDark, marginTop: 8, marginLeft: 4 },
  card: { backgroundColor: palette.white, borderRadius: 20, borderWidth: 2, borderColor: palette.ink, padding: 16 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginBottom: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: palette.mintDark, opacity: 0.55 },
  legendRing: { width: 16, height: 16, borderRadius: 8, borderWidth: 2.5, borderColor: sideColors.b },
  legendText: { fontSize: 13, fontWeight: '700', color: palette.inkSoft },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  pieceCard: { alignItems: 'center', backgroundColor: palette.white, borderRadius: 18, borderWidth: 2, borderColor: palette.ink, paddingTop: 10, paddingBottom: 12, paddingHorizontal: 8 },
  pieceName: { fontSize: 16, fontWeight: '900', color: palette.ink, marginTop: 8 },
  pieceMove: { fontSize: 12, color: palette.inkSoft, textAlign: 'center', marginTop: 2, lineHeight: 16 },
  cta: { alignItems: 'center', backgroundColor: palette.butter, borderWidth: 2, borderColor: palette.ink, borderRadius: 22, paddingVertical: 13, marginTop: 10 },
  ctaText: { fontSize: 16, fontWeight: '900', color: palette.ink },
});
