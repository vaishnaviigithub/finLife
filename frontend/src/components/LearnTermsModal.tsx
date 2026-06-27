import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { FINANCIAL_TERMS } from '@/src/data/financialTerms';
import TermQuiz from '@/src/components/TermQuiz';
import { useTermProgress } from '@/src/hooks/useTermProgress';
import { C, FONT, pixelShadow } from '@/src/ui/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type ViewMode = 'card' | 'list' | 'quiz';

export default function LearnTermsModal({ visible, onClose }: Props) {
  const {
    isLoaded,
    learnedTermIds,
    learnedSet,
    quizMilestoneSet,
    markLearned,
    markQuizMilestoneDone,
  } = useTermProgress();
  const [termIndex, setTermIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mode, setMode] = useState<ViewMode>('card');
  const [quizMilestone, setQuizMilestone] = useState<number | null>(null);

  useEffect(() => {
    if (!visible || !isLoaded) return;
    const firstUnlearned = FINANCIAL_TERMS.findIndex((term) => !learnedSet.has(term.id));
    setTermIndex(firstUnlearned >= 0 ? firstUnlearned : 0);
    setIsFlipped(false);
    setMode('card');
    // This should run when the modal opens, not each time a term is learned.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, visible]);

  useEffect(() => {
    if (!visible || !isLoaded) return;
    const learnedCount = learnedTermIds.length;
    if (learnedCount > 0 && learnedCount % 5 === 0 && !quizMilestoneSet.has(learnedCount)) {
      setQuizMilestone(learnedCount);
      setMode('quiz');
    }
  }, [isLoaded, learnedTermIds.length, quizMilestoneSet, visible]);

  const term = FINANCIAL_TERMS[termIndex];
  const progressText = `${learnedTermIds.length} / ${FINANCIAL_TERMS.length} terms learned`;
  const nearbyTerms = [-1, 0, 1].map((offset) => {
    const index = (termIndex + offset + FINANCIAL_TERMS.length) % FINANCIAL_TERMS.length;
    return { item: FINANCIAL_TERMS[index], index };
  });
  const quizTerms = useMemo(() => {
    if (!quizMilestone) return [];
    const recentIds = learnedTermIds.slice(-5);
    return recentIds
      .map((id) => FINANCIAL_TERMS.find((item) => item.id === id))
      .filter((item): item is (typeof FINANCIAL_TERMS)[number] => Boolean(item));
  }, [learnedTermIds, quizMilestone]);

  const revealTerm = () => {
    setIsFlipped(true);
    void markLearned(term.id);
  };

  const move = (delta: number) => {
    setTermIndex((current) => {
      const next = current + delta;
      if (next < 0) return FINANCIAL_TERMS.length - 1;
      if (next >= FINANCIAL_TERMS.length) return 0;
      return next;
    });
    setIsFlipped(false);
  };

  const finishQuiz = () => {
    if (quizMilestone) {
      void markQuizMilestoneDone(quizMilestone);
    }
    setQuizMilestone(null);
    setMode('card');
  };

  if (!term) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={() => {}} style={styles.modalHitbox}>
          <Animated.View entering={FadeInDown.duration(180)} style={styles.sheet}>
            <View style={styles.header}>
              <View>
                <Text style={styles.eyebrow}>LEARN A TERM</Text>
                <Text style={styles.progress}>{progressText}</Text>
              </View>
              <Pressable style={styles.iconButton} onPress={onClose} accessibilityLabel="Close learn a term">
                <MaterialCommunityIcons name="close" size={20} color={C.black} />
              </Pressable>
            </View>

            {mode === 'quiz' ? (
              <TermQuiz terms={quizTerms} onDone={finishQuiz} />
            ) : (
              <>
                <View style={styles.tabs}>
                  <Pressable style={[styles.tab, mode === 'card' && styles.tabActive]} onPress={() => setMode('card')}>
                    <Text style={[styles.tabText, mode === 'card' && styles.tabTextActive]}>CARD</Text>
                  </Pressable>
                  <Pressable style={[styles.tab, mode === 'list' && styles.tabActive]} onPress={() => setMode('list')}>
                    <Text style={[styles.tabText, mode === 'list' && styles.tabTextActive]}>LIST</Text>
                  </Pressable>
                </View>

                {mode === 'list' ? (
                  <ScrollView contentContainerStyle={styles.grid}>
                    {FINANCIAL_TERMS.map((item, index) => {
                      const learned = learnedSet.has(item.id);
                      return (
                        <Pressable
                          key={item.id}
                          style={[styles.termPill, learned && styles.termPillLearned]}
                          onPress={() => {
                            setTermIndex(index);
                            setIsFlipped(false);
                            setMode('card');
                          }}
                        >
                          <Text style={[styles.termPillCategory, learned && styles.termPillTextLearned]} numberOfLines={1}>
                            {item.category}
                          </Text>
                          <Text style={[styles.termPillText, learned && styles.termPillTextLearned]} numberOfLines={2}>
                            {learned ? '✓ ' : ''}{item.term}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ) : (
                  <>
                    <Pressable style={[styles.card, isFlipped && styles.cardBack]} onPress={isFlipped ? undefined : revealTerm}>
                      {!isFlipped ? (
                        <>
                          <Text style={styles.badge}>{term.category}</Text>
                          <Text style={styles.term}>{term.term}</Text>
                          <Text style={styles.tapHint}>TAP TO LEARN</Text>
                        </>
                      ) : (
                        <ScrollView contentContainerStyle={styles.cardScroll}>
                          <Text style={styles.backLabel}>DEFINITION</Text>
                          <Text style={styles.definition}>{term.definition}</Text>
                          <Text style={styles.backLabel}>REAL LIFE</Text>
                          <Text style={styles.example}>{term.example}</Text>
                        </ScrollView>
                      )}
                    </Pressable>

                    <View style={styles.nearbyRow}>
                      {nearbyTerms.map(({ item, index }) => {
                        const active = index === termIndex;
                        const learned = learnedSet.has(item.id);
                        return (
                          <Pressable
                            key={item.id}
                            style={[styles.miniCard, active && styles.miniCardActive, learned && styles.miniCardLearned]}
                            onPress={() => {
                              setTermIndex(index);
                              setIsFlipped(false);
                            }}
                          >
                            <Text style={[styles.miniCategory, active && styles.miniCategoryActive]} numberOfLines={1}>
                              {item.category}
                            </Text>
                            <Text style={[styles.miniTerm, active && styles.miniTermActive]} numberOfLines={2}>
                              {learned ? 'DONE: ' : ''}{item.term}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {!isFlipped ? (
                      <Pressable style={styles.learnBtn} onPress={revealTerm}>
                        <Text style={styles.learnBtnText}>LEARN</Text>
                      </Pressable>
                    ) : null}

                    <View style={styles.nav}>
                      <Pressable style={styles.navBtn} onPress={() => move(-1)} accessibilityLabel="Previous term">
                        <MaterialCommunityIcons name="chevron-left" size={26} color={C.black} />
                      </Pressable>
                      <Text style={styles.count}>{termIndex + 1} / {FINANCIAL_TERMS.length}</Text>
                      <Pressable style={styles.navBtn} onPress={() => move(1)} accessibilityLabel="Next term">
                        <MaterialCommunityIcons name="chevron-right" size={26} color={C.black} />
                      </Pressable>
                    </View>
                  </>
                )}
              </>
            )}
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    padding: 16,
  },
  modalHitbox: {
    width: '100%',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: '#1A1A1A',
    borderWidth: 4,
    borderColor: C.yellow,
    padding: 16,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  eyebrow: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 12,
    letterSpacing: 2,
  },
  progress: {
    fontFamily: FONT.body,
    color: '#BBB',
    fontSize: 17,
    marginTop: 3,
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.yellow,
    borderWidth: 3,
    borderColor: '#000',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#333',
    paddingVertical: 9,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: C.blue,
    borderColor: '#000',
  },
  tabText: {
    fontFamily: FONT.display,
    color: '#777',
    fontSize: 11,
    letterSpacing: 2,
  },
  tabTextActive: {
    color: C.black,
  },
  card: {
    minHeight: 300,
    backgroundColor: '#FFF',
    borderWidth: 4,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    transform: [{ rotateY: '0deg' }],
    ...pixelShadow(6),
  },
  cardBack: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    transform: [{ rotateY: '1deg' }],
  },
  badge: {
    fontFamily: FONT.display,
    color: C.black,
    backgroundColor: C.yellow,
    borderWidth: 3,
    borderColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 10,
    letterSpacing: 1,
    overflow: 'hidden',
  },
  term: {
    fontFamily: FONT.display,
    color: C.black,
    fontSize: 28,
    letterSpacing: 1,
    lineHeight: 36,
    textAlign: 'center',
    marginTop: 22,
  },
  tapHint: {
    fontFamily: FONT.display,
    color: '#777',
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 22,
  },
  cardScroll: {
    gap: 10,
  },
  backLabel: {
    fontFamily: FONT.display,
    color: C.red,
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 6,
  },
  definition: {
    fontFamily: FONT.body,
    color: C.black,
    fontSize: 21,
    lineHeight: 25,
  },
  example: {
    fontFamily: FONT.body,
    color: C.black,
    fontSize: 20,
    lineHeight: 24,
  },
  learnBtn: {
    backgroundColor: C.green,
    borderWidth: 4,
    borderColor: '#000',
    paddingVertical: 13,
    alignItems: 'center',
    ...pixelShadow(4),
  },
  learnBtnText: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 13,
    letterSpacing: 2,
  },
  nearbyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  miniCard: {
    flex: 1,
    minHeight: 66,
    backgroundColor: '#101010',
    borderWidth: 3,
    borderColor: '#333',
    padding: 8,
    justifyContent: 'center',
  },
  miniCardActive: {
    backgroundColor: C.yellow,
    borderColor: '#000',
  },
  miniCardLearned: {
    borderColor: C.green,
  },
  miniCategory: {
    fontFamily: FONT.display,
    color: '#777',
    fontSize: 7,
    letterSpacing: 1,
    marginBottom: 4,
  },
  miniCategoryActive: {
    color: '#5A4600',
  },
  miniTerm: {
    fontFamily: FONT.body,
    color: C.white,
    fontSize: 16,
    lineHeight: 18,
  },
  miniTermActive: {
    color: C.black,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 44,
    height: 38,
    backgroundColor: C.orange,
    borderWidth: 3,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontFamily: FONT.display,
    color: C.white,
    fontSize: 12,
    letterSpacing: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 8,
  },
  termPill: {
    width: '48%',
    borderWidth: 3,
    borderColor: '#333',
    backgroundColor: '#111',
    minHeight: 78,
    padding: 10,
    justifyContent: 'space-between',
  },
  termPillLearned: {
    backgroundColor: C.green,
    borderColor: '#000',
  },
  termPillText: {
    fontFamily: FONT.body,
    color: C.white,
    fontSize: 18,
    lineHeight: 20,
  },
  termPillCategory: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 7,
    letterSpacing: 1,
    marginBottom: 5,
  },
  termPillTextLearned: {
    color: C.black,
  },
});
