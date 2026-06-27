import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Redirect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  SlideInDown,
  FadeIn,
} from 'react-native-reanimated';

import { CHAPTERS, getOrderedChapterScenarios, useGame } from '@/src/game/store';
import { Chapter, Scenario } from '@/src/game/types';
import { MIN_SCENARIOS } from '@/src/game/scoring';
import { C, FONT } from '@/src/ui/theme';
import { FL_GREEN } from '@/src/finlabs/storage';
import { finLabsRoadmapHref } from '@/src/finlabs/routes';
import { getFinLabsChapter } from '@/src/finlabs/chapters';
import { play } from '@/src/game/audio';
import PixelAvatar from '@/src/components/PixelAvatar';
import ArtifactImage from '@/src/components/ArtifactImage';
import LearnTermsButton from '@/src/components/LearnTermsButton';
import {
  ARTIFACTS,
  getChapterAccent,
  getChapterBackground,
  getComingSoonArtifact,
  getScenarioArtifact,
} from '@/src/game/artifacts';

const NODE_SIZE = 44;
const CANVAS_H_BASE = 250;

function getCanvasHeight(nodeCount: number) {
  return Math.max(CANVAS_H_BASE, 160 + nodeCount * 38);
}

function getVisibleScenarios(
  chapter: Chapter,
  isCurrent: boolean,
  completed: boolean,
  chapterId: string | null,
  chapterScenarioIds: string[],
  chapterProgress: Record<string, string[]>,
): Scenario[] {
  const byId = (ids: string[]) =>
    ids
      .map((id) => chapter.scenarios.find((s) => s.id === id))
      .filter((s): s is Scenario => !!s);

  if (completed && chapterProgress[chapter.id]?.length) {
    return byId(chapterProgress[chapter.id]);
  }
  if (isCurrent && chapterId === chapter.id && chapterScenarioIds.length > 0) {
    return byId(chapterScenarioIds);
  }
  return getOrderedChapterScenarios(chapter).slice(0, MIN_SCENARIOS);
}

function getNodePositions(count: number) {
  const top = 0.18;
  const bottom = 0.84;
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1);
    return {
      x: i % 2 === 0 ? 0.22 : 0.78,
      y: top + t * (bottom - top),
    };
  });
}

function bezier(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
) {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

function makeTrail(
  p0: { x: number; y: number },
  p2: { x: number; y: number },
  curvature = 0.14,
) {
  const mid = { x: (p0.x + p2.x) / 2, y: (p0.y + p2.y) / 2 };
  const dx = p2.x - p0.x;
  const dy = p2.y - p0.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / (len || 1);
  const ny = dx / (len || 1);
  const c = { x: mid.x + nx * curvature, y: mid.y + ny * curvature };
  const out: { x: number; y: number }[] = [];
  for (let i = 1; i <= 5; i++) {
    out.push(bezier(i / 6, p0, c, p2));
  }
  return out;
}

export default function Index() {
  const router = useRouter();
  const { state, startChapter, reset, hydrated, clearRecentlyAdded } = useGame();
  const { width } = useWindowDimensions();
  const canvasW = Math.min(width - 28, 400);
  const isCompactHeader = width < 380;

  const bob = useSharedValue(0);
  const blink = useSharedValue(1);
  const finLabsPulse = useSharedValue(1);
  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
    blink.value = withRepeat(
      withSequence(withTiming(0.35, { duration: 500 }), withTiming(1, { duration: 500 })),
      -1,
    );
    finLabsPulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [bob, blink, finLabsPulse]);

  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  const blinkStyle = useAnimatedStyle(() => ({ opacity: blink.value }));
  const finLabsPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: finLabsPulse.value }],
  }));

  const currentChapterIdx = useMemo(() => {
    const idx = CHAPTERS.findIndex((c) => !state.chaptersCompleted.includes(c.id));
    return idx === -1 ? CHAPTERS.length - 1 : idx;
  }, [state.chaptersCompleted]);

  const handlePlay = (ch: Chapter) => {
    play('coin');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    startChapter(ch.id);
    router.push('/play');
  };

  const handleReset = () => {
    play('bad');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    reset();
  };

  const handleFinLabs = (ch: Chapter) => {
    play('click');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(finLabsRoadmapHref(ch.id));
  };

  const handleReplayIntro = () => {
    play('click');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push({ pathname: '/intro', params: { replay: '1' } });
  };

  if (!hydrated) return null;

  if (!state.introCompleted) {
    return <Redirect href="/intro" />;
  }

  return (
    <View style={styles.root} testID="home-screen">
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={[styles.headerWrap, isCompactHeader && styles.headerWrapCompact]}>
          <View style={[styles.headerLeft, isCompactHeader && styles.headerLeftCompact]}>
            <Text
              style={[styles.titleSmallShadow, isCompactHeader && styles.titleSmallCompact]}
              numberOfLines={1}
            >
              FINLIFE
            </Text>
            <Text
              style={[styles.titleSmall, isCompactHeader && styles.titleSmallCompact]}
              numberOfLines={1}
            >
              FINLIFE
            </Text>
            <Text style={[styles.tagline, isCompactHeader && styles.taglineCompact]} numberOfLines={2}>
              {state.playerName ? `HI ${state.playerName.toUpperCase()} ▸ YOUR JOURNEY` : 'YOUR FINANCIAL LIFE, FAST-FORWARDED'}
            </Text>
          </View>
          <View style={[styles.headerRight, isCompactHeader && styles.headerRightCompact]}>
            <StatChip icon="cake-variant" label="AGE" value={`${state.age}`} color={C.yellow} />
            <LearnTermsButton />
            <StreakChip count={state.streakCount} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          testID="roadmap-scroll"
        >
          <Text style={styles.roadmapTitle}>YOUR LIFE ROADMAP</Text>

          {CHAPTERS.map((ch, chIdx) => {
            const completed = state.chaptersCompleted.includes(ch.id);
            const isCurrent = chIdx === currentChapterIdx;
            const isLocked = !completed && !isCurrent;
            const activeNodeIdx = isCurrent
              ? state.chapterId === ch.id
                ? Math.min(state.scenarioIndex, Math.max(state.chapterScenarioIds.length - 1, 0))
                : 0
              : -1;
            const visibleScenarios = getVisibleScenarios(
              ch,
              isCurrent,
              completed,
              state.chapterId,
              state.chapterScenarioIds,
              state.chapterProgress,
            );
            const recentlyAdded =
              isCurrent && state.chapterId === ch.id ? state.recentlyAddedScenarioIds : [];

            return (
              <ChapterSection
                key={ch.id}
                chapter={ch}
                visibleScenarios={visibleScenarios}
                recentlyAddedIds={recentlyAdded}
                onAnimationDone={clearRecentlyAdded}
                completed={completed}
                isCurrent={isCurrent}
                isLocked={isLocked}
                activeNodeIdx={activeNodeIdx}
                bobStyle={bobStyle}
                blinkStyle={blinkStyle}
                finLabsPulseStyle={finLabsPulseStyle}
                hasFinLabs={!!getFinLabsChapter(ch.id)}
                canvasW={canvasW}
                onPlay={() => !isLocked && handlePlay(ch)}
                onFinLabs={() => handleFinLabs(ch)}
              />
            );
          })}

          <ComingSoon />

          <Pressable
            onPress={handleReplayIntro}
            testID="replay-intro-button"
            style={({ pressed }) => [
              styles.introBtn,
              pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] },
            ]}
          >
            <MaterialCommunityIcons name="play-circle-outline" size={14} color={C.yellow} />
            <Text style={styles.introBtnText}>REPLAY INTRO</Text>
          </Pressable>

          <Pressable
            onPress={handleReset}
            testID="reset-button"
            style={({ pressed }) => [
              styles.resetBtn,
              pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] },
            ]}
          >
            <MaterialCommunityIcons name="restart" size={14} color={C.white} />
            <Text style={styles.resetText}>NEW GAME (RESET)</Text>
          </Pressable>

          <Text style={styles.footer}>
            FINLIFE v1 — Made for the generation that grew up on smartphones but was never taught money.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ChapterSection({
  chapter,
  visibleScenarios,
  recentlyAddedIds,
  onAnimationDone,
  completed,
  isCurrent,
  isLocked,
  activeNodeIdx,
  bobStyle,
  blinkStyle,
  finLabsPulseStyle,
  hasFinLabs,
  canvasW,
  onPlay,
  onFinLabs,
}: {
  chapter: Chapter;
  visibleScenarios: Scenario[];
  recentlyAddedIds: string[];
  onAnimationDone: () => void;
  completed: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  activeNodeIdx: number;
  bobStyle: any;
  blinkStyle: any;
  finLabsPulseStyle: any;
  hasFinLabs: boolean;
  canvasW: number;
  onPlay: () => void;
  onFinLabs: () => void;
}) {
  const canvasH = getCanvasHeight(visibleScenarios.length);

  useEffect(() => {
    if (recentlyAddedIds.length === 0) return;
    play('coin');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    const timer = setTimeout(onAnimationDone, 1200);
    return () => clearTimeout(timer);
  }, [recentlyAddedIds, onAnimationDone]);

  const nodePositions = useMemo(
    () => getNodePositions(visibleScenarios.length),
    [visibleScenarios.length],
  );

  const trailDots = useMemo(() => {
    const dots: { x: number; y: number }[] = [];
    for (let i = 0; i < nodePositions.length - 1; i += 1) {
      dots.push(...makeTrail(nodePositions[i], nodePositions[i + 1], i % 2 === 0 ? 0.1 : -0.1));
    }
    return dots;
  }, [nodePositions]);

  const bgKey = getChapterBackground(chapter.id);
  const accentKey = getChapterAccent(chapter.id);

  return (
    <View style={styles.chapterCard} testID={`chapter-section-${chapter.id}`}>
      <View style={styles.chapterHeader}>
        <View style={styles.chapterHeaderLeft}>
          <ArtifactImage source={ARTIFACTS[accentKey]} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={styles.chapterHeaderTitle}>
              {chapter.index}. {chapter.title}
            </Text>
            <Text style={styles.chapterHeaderSub}>
              {chapter.landscape.name} · {chapter.ageRange}
            </Text>
          </View>
        </View>
        <View style={styles.chapterActionsCol}>
          <Pressable
            disabled={isLocked}
            onPress={onPlay}
            style={({ pressed }) => [
              styles.chapterAction,
              completed && styles.chapterActionDone,
              isLocked && styles.chapterActionLocked,
              isCurrent && !completed && styles.chapterActionActive,
              pressed && !isLocked && { opacity: 0.85 },
            ]}
          >
            {completed ? (
              <>
                <MaterialCommunityIcons name="trophy" size={13} color="#000" />
                <Text style={styles.chapterActionText}>DONE</Text>
              </>
            ) : isLocked ? (
              <>
                <MaterialCommunityIcons name="lock" size={13} color="#888" />
                <Text style={[styles.chapterActionText, { color: '#888' }]}>LOCKED</Text>
              </>
            ) : (
              <Animated.View style={[styles.playRow, blinkStyle]}>
                <Text style={styles.chapterActionText}>▶ PLAY</Text>
              </Animated.View>
            )}
          </Pressable>

          {completed && hasFinLabs ? (
            <Pressable
              onPress={onFinLabs}
              testID={`finlabs-btn-${chapter.id}`}
              style={({ pressed }) => [
                styles.finLabsBtn,
                pressed && { opacity: 0.85, transform: [{ translateX: 1 }, { translateY: 1 }] },
              ]}
            >
              <Animated.View style={[styles.finLabsInner, finLabsPulseStyle]}>
                <Text style={styles.finLabsEmoji}>🧪</Text>
                <Text style={styles.finLabsBtnText}>FIN LABS</Text>
                <View style={styles.finLabsSpark} />
              </Animated.View>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={[styles.canvas, { width: canvasW, height: canvasH }]}>
        <ImageBackground
          source={ARTIFACTS[bgKey]}
          style={StyleSheet.absoluteFillObject}
          imageStyle={styles.canvasImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.55)']}
            style={StyleSheet.absoluteFillObject}
          />

          {isLocked ? <View style={styles.lockedOverlay} /> : null}

          {trailDots.map((p, i) => (
            <View
              key={i}
              style={[
                styles.trailDot,
                {
                  left: p.x * canvasW - 3,
                  top: p.y * canvasH - 3,
                  backgroundColor: isLocked ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.7)',
                },
              ]}
            />
          ))}

          {visibleScenarios.map((sc, i) => {
            const pos = nodePositions[i];
            const left = pos.x * canvasW - NODE_SIZE / 2;
            const top = pos.y * canvasH - NODE_SIZE / 2;
            const nodeCompleted = completed || (isCurrent && i < activeNodeIdx);
            const nodeCurrent = isCurrent && i === activeNodeIdx;
            const artifactKey = getScenarioArtifact(sc.id);
            const isNewlyAdded = recentlyAddedIds.includes(sc.id);
            const isBonus = i >= MIN_SCENARIOS;

            const NodeWrapper = isNewlyAdded ? Animated.View : View;
            const wrapperProps = isNewlyAdded
              ? {
                  entering: SlideInDown.duration(700)
                    .springify()
                    .damping(14)
                    .stiffness(90),
                }
              : {};

            return (
              <NodeWrapper
                key={sc.id}
                {...wrapperProps}
                style={{ position: 'absolute', left, top, alignItems: 'center' }}
              >
                {isNewlyAdded ? (
                  <Animated.View
                    entering={FadeIn.duration(400).delay(200)}
                    style={styles.newNodeGlow}
                  />
                ) : null}
                <Pressable
                  testID={`node-${chapter.id}-${i}`}
                  disabled={isLocked}
                  onPress={onPlay}
                  style={({ pressed }) => [
                    styles.node,
                    nodeCompleted && styles.nodeDone,
                    nodeCurrent && styles.nodeCurrent,
                    isLocked && styles.nodeLocked,
                    isBonus && !nodeCompleted && styles.nodeBonus,
                    isNewlyAdded && styles.nodeNew,
                    pressed && !isLocked && { transform: [{ scale: 0.94 }] },
                  ]}
                >
                  {isLocked ? (
                    <MaterialCommunityIcons name="lock" size={16} color="#666" />
                  ) : (
                    <ArtifactImage
                      source={ARTIFACTS[artifactKey]}
                      size={nodeCompleted || nodeCurrent ? 34 : 30}
                      opacity={nodeCurrent ? 1 : 0.92}
                    />
                  )}
                  {nodeCompleted && !isLocked ? (
                    <View style={styles.nodeCheck}>
                      <MaterialCommunityIcons name="check-bold" size={10} color="#000" />
                    </View>
                  ) : null}
                </Pressable>

                {nodeCurrent ? (
                  <Animated.View
                    style={[
                      styles.avatarOnNode,
                      bobStyle,
                      pos.x < 0.5
                        ? { left: NODE_SIZE + 4, top: 6 }
                        : { right: NODE_SIZE + 4, top: 6 },
                    ]}
                    testID="roadmap-avatar"
                  >
                    <View style={styles.avatarBadge}>
                      <PixelAvatar size={30} />
                    </View>
                  </Animated.View>
                ) : null}

                <View
                  style={[
                    styles.nodeLabel,
                    pos.x < 0.5 ? { left: NODE_SIZE + 4 } : { right: NODE_SIZE + 4 },
                    pos.x < 0.5 ? { alignItems: 'flex-start' } : { alignItems: 'flex-end' },
                  ]}
                >
                  <Text style={styles.nodeLabelText} numberOfLines={2}>
                    {sc.title}
                  </Text>
                  <Text style={styles.nodeLabelAge}>AGE {sc.age}</Text>
                  {isBonus && !nodeCompleted ? (
                    <Text style={styles.nodeBonusTag}>EXTRA</Text>
                  ) : null}
                </View>
              </NodeWrapper>
            );
          })}
        </ImageBackground>
      </View>
    </View>
  );
}

function StreakChip({ count }: { count: number }) {
  return (
    <View style={[styles.statChip, { borderColor: C.orange }]} testID="streak-chip">
      <Text style={styles.streakEmoji}>🔥</Text>
      <Text style={styles.streakCount}>{count}</Text>
    </View>
  );
}

function StatChip({
  icon,
  label,
  value,
  color,
  artifact,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  color: string;
  artifact?: keyof typeof ARTIFACTS;
}) {
  return (
    <View style={[styles.statChip, { borderColor: color }]}>
      <View style={[styles.statChipIcon, { backgroundColor: color }]}>
        {artifact ? (
          <ArtifactImage source={ARTIFACTS[artifact]} size={14} />
        ) : (
          <MaterialCommunityIcons name={icon} size={12} color="#000" />
        )}
      </View>
      <View>
        <Text style={[styles.statChipLabel, { color }]}>{label}</Text>
        <Text style={styles.statChipValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function ComingSoon() {
  const items = [
    { num: 5, title: 'MID-LIFE', sub: 'Family, EMIs, gold', age: '30-39' },
    { num: 6, title: 'CRISIS', sub: 'Cancer diagnosis', age: '40-49' },
    { num: 7, title: 'RETIREMENT', sub: 'Corpus & legacy', age: '60+' },
  ];
  return (
    <View style={styles.csWrap} testID="coming-soon">
      <Text style={styles.csTitle}>COMING SOON</Text>
      {items.map((it, i) => (
        <View key={it.num} style={styles.csRow}>
          <View style={styles.csBadge}>
            <ArtifactImage source={ARTIFACTS[getComingSoonArtifact(i)]} size={28} opacity={0.45} />
            <MaterialCommunityIcons name="lock" size={12} color="#666" style={styles.csLock} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.csName}>
              {it.num} · {it.title}
            </Text>
            <Text style={styles.csSub}>
              {it.sub} · AGE {it.age}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function fmtShort(n: number) {
  if (n >= 10000000) return `Rs ${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `Rs ${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `Rs ${(n / 1000).toFixed(1)}K`;
  return `Rs ${Math.round(n)}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#000',
    borderBottomWidth: 4,
    borderBottomColor: C.yellow,
    gap: 10,
  },
  headerWrapCompact: {
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  headerLeft: { flex: 1, minWidth: 0, position: 'relative' },
  headerLeftCompact: {
    flex: 0,
    width: 96,
    paddingTop: 2,
  },
  titleSmall: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 24,
    letterSpacing: 2,
  },
  titleSmallCompact: {
    fontSize: 17,
    letterSpacing: 2,
    lineHeight: 20,
  },
  titleSmallShadow: {
    position: 'absolute',
    fontFamily: FONT.display,
    color: C.red,
    fontSize: 24,
    letterSpacing: 2,
    transform: [{ translateX: 2 }, { translateY: 2 }],
  },
  tagline: {
    fontFamily: FONT.body,
    color: '#888',
    fontSize: 13,
    marginTop: 4,
  },
  taglineCompact: {
    fontSize: 11,
    lineHeight: 13,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
  },
  headerRightCompact: {
    flex: 1,
    rowGap: 6,
    columnGap: 6,
    paddingTop: 0,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#000',
    borderWidth: 2,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  statChipIcon: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakCount: {
    fontFamily: FONT.display,
    color: C.orange,
    fontSize: 13,
    fontWeight: 'bold',
  },
  statChipLabel: {
    fontFamily: FONT.display,
    fontSize: 7,
    letterSpacing: 1,
  },
  statChipValue: {
    fontFamily: FONT.display,
    color: C.white,
    fontSize: 11,
    marginTop: 1,
  },
  scroll: { paddingBottom: 30, paddingHorizontal: 14 },
  roadmapTitle: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 12,
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 12,
  },
  chapterCard: {
    marginBottom: 18,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 400,
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  chapterHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chapterHeaderTitle: {
    fontFamily: FONT.display,
    color: C.white,
    fontSize: 13,
    letterSpacing: 1,
  },
  chapterHeaderSub: {
    fontFamily: FONT.body,
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  chapterActionsCol: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 6,
    minWidth: 76,
  },
  chapterAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 2,
    borderColor: C.yellow,
    backgroundColor: '#111',
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 72,
  },
  finLabsBtn: {
    borderWidth: 2,
    borderColor: FL_GREEN,
    backgroundColor: '#0a1a12',
    paddingHorizontal: 4,
    paddingVertical: 4,
    minWidth: 72,
    overflow: 'hidden',
  },
  finLabsInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  finLabsEmoji: {
    fontSize: 11,
  },
  finLabsSpark: {
    width: 6,
    height: 6,
    backgroundColor: FL_GREEN,
    borderRadius: 1,
    opacity: 0.85,
  },
  finLabsBtnText: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 7,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  chapterActionDone: {
    backgroundColor: C.green,
    borderColor: '#000',
  },
  chapterActionLocked: {
    borderColor: '#444',
    backgroundColor: '#0a0a0a',
  },
  chapterActionActive: {
    backgroundColor: C.yellow,
  },
  playRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapterActionText: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 9,
    letterSpacing: 1,
  },
  canvas: {
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: '#222',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  canvasImage: {
    opacity: 0.92,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  trailDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  nodeCurrent: {
    borderColor: C.yellow,
    borderWidth: 3,
    backgroundColor: '#FFF',
    transform: [{ scale: 1.08 }],
  },
  nodeDone: {
    borderColor: C.green,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  nodeLocked: {
    backgroundColor: 'rgba(40,40,40,0.8)',
    borderColor: '#555',
  },
  nodeBonus: {
    borderColor: C.orange,
    borderStyle: 'dashed' as const,
  },
  nodeNew: {
    borderColor: C.red,
    borderWidth: 3,
    shadowColor: C.red,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  newNodeGlow: {
    position: 'absolute',
    width: NODE_SIZE + 20,
    height: NODE_SIZE + 20,
    borderRadius: (NODE_SIZE + 20) / 2,
    backgroundColor: 'rgba(255, 60, 60, 0.25)',
    top: -10,
    left: -10,
    zIndex: -1,
  },
  nodeBonusTag: {
    fontFamily: FONT.display,
    color: C.orange,
    fontSize: 6,
    letterSpacing: 1,
    marginTop: 1,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  nodeCheck: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.green,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOnNode: {
    position: 'absolute',
    zIndex: 10,
  },
  avatarBadge: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 2,
    borderColor: C.yellow,
    borderRadius: 8,
    padding: 2,
  },
  nodeLabel: {
    position: 'absolute',
    top: NODE_SIZE / 2 - 10,
    maxWidth: 110,
  },
  nodeLabelText: {
    fontFamily: FONT.display,
    color: '#FFF',
    fontSize: 7,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  nodeLabelAge: {
    fontFamily: FONT.body,
    color: C.yellow,
    fontSize: 10,
    marginTop: 1,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  csWrap: {
    marginTop: 4,
    backgroundColor: '#0E0E0E',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  csTitle: {
    fontFamily: FONT.display,
    color: '#888',
    fontSize: 10,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 4,
  },
  csRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    padding: 8,
  },
  csBadge: {
    width: 40,
    height: 40,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  csLock: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  csName: {
    fontFamily: FONT.display,
    color: '#999',
    fontSize: 11,
    letterSpacing: 1,
  },
  csSub: {
    fontFamily: FONT.body,
    color: '#666',
    fontSize: 13,
  },
  introBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 10,
    borderWidth: 3,
    borderColor: C.yellow,
    backgroundColor: '#111',
  },
  introBtnText: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 11,
    letterSpacing: 2,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 10,
    borderWidth: 3,
    borderColor: C.red,
    backgroundColor: '#000',
  },
  resetText: {
    fontFamily: FONT.display,
    color: C.white,
    fontSize: 11,
    letterSpacing: 2,
  },
  footer: {
    fontFamily: FONT.body,
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 4,
    lineHeight: 17,
  },
});
