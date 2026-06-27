import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { CHAPTERS, useGame } from '@/src/game/store';
import Hud from '@/src/components/Hud';
import DialogBox from '@/src/components/DialogBox';
import ChoiceButton from '@/src/components/ChoiceButton';
import PixelScene from '@/src/components/PixelScene';
import TimeAcceleration from '@/src/components/TimeAcceleration';
import StreakTermModal from '@/src/components/StreakTermModal';
import { C, FONT } from '@/src/ui/theme';
import { Choice, Scenario } from '@/src/game/types';
import { buildAccelEvents, AccelEvent } from '@/src/game/accelEvents';
import { play } from '@/src/game/audio';
import ArtifactImage from '@/src/components/ArtifactImage';
import { ARTIFACTS } from '@/src/game/artifacts';
import { pickTerm } from '@/src/game/streaks';
import PrimerScreen from '@/src/components/PrimerScreen';

const COLORS = [C.green, C.blue, C.yellow, C.orange];

type Phase = 'primer' | 'situation_decision' | 'consequence' | 'lesson';

export default function Play() {
  const router = useRouter();
  const { state, applyChoice, completeChapter, completeStreakTerm, markTermsSeen } = useGame();

  const chapter = useMemo(
    () => CHAPTERS.find((c) => c.id === state.chapterId) ?? null,
    [state.chapterId],
  );

  const scenario: Scenario | undefined = chapter?.scenarios[state.scenarioIndex];

  // Compute the unseen primer terms for the current scenario (terms already
  // shown in earlier scenarios are filtered out automatically).
  const unseenTerms = useMemo(() => {
    if (!scenario?.terms || scenario.terms.length === 0) return [];
    const seen = new Set(state.termsSeen);
    return scenario.terms.filter((t) => !seen.has(t.name));
  }, [scenario, state.termsSeen]);

  const [phase, setPhase] = useState<Phase>(
    unseenTerms.length > 0 ? 'primer' : 'situation_decision',
  );

  // Safety: if phase is 'primer' but there are no unseen terms to show, fall
  // through to the situation/decision immediately.
  React.useEffect(() => {
    if (phase === 'primer' && unseenTerms.length === 0) {
      setPhase('situation_decision');
    }
  }, [phase, unseenTerms.length]);
  const [accelEvents, setAccelEvents] = useState<AccelEvent[]>([]);
  const [lastChoice, setLastChoice] = useState<Choice | null>(null);
  const [isLast, setIsLast] = useState(false);
  const [streakModalVisible, setStreakModalVisible] = useState(false);
  const [completedChapterId, setCompletedChapterId] = useState<string | null>(null);

  const streakTerm = useMemo(
    () => pickTerm(state.termsLearned, state.chaptersCompleted.length),
    [state.termsLearned, state.chaptersCompleted.length],
  );

  const finishChapter = (ch: NonNullable<typeof chapter>) => {
    setCompletedChapterId(ch.id);
    setStreakModalVisible(true);
  };

  const handleStreakComplete = () => {
    const chapterId = completedChapterId;
    if (chapterId) {
      const ch = CHAPTERS.find((c) => c.id === chapterId);
      if (ch) completeChapter(ch);
    }
    completeStreakTerm(streakTerm.id);
    setStreakModalVisible(false);
    setCompletedChapterId(null);
    if (chapterId) {
      router.replace({ pathname: '/summary', params: { chapter: chapterId } });
    }
  };

  const streakModal = (
    <StreakTermModal
      visible={streakModalVisible}
      term={streakTerm}
      onComplete={handleStreakComplete}
    />
  );

  // Render consequence phase BEFORE any guards so it always shows
  if (phase === 'consequence' && accelEvents.length > 0) {
    return (
      <>
        <View style={styles.root} testID="play-screen">
          <TimeAcceleration
            events={accelEvents}
            onDone={() => {
              setPhase('lesson');
            }}
          />
        </View>
        {streakModal}
      </>
    );
  }

  if (phase === 'lesson' && lastChoice) {
    return (
      <>
        <LessonScreen
          choice={lastChoice}
          onContinue={() => {
            if (isLast && chapter) {
              finishChapter(chapter);
            } else {
              // Next scenario: if it has unseen primer terms, show primer first.
              const nextScenario = chapter?.scenarios[state.scenarioIndex];
              const seen = new Set(state.termsSeen);
              const nextUnseen = nextScenario?.terms?.filter((t) => !seen.has(t.name)) ?? [];
              setPhase(nextUnseen.length > 0 ? 'primer' : 'situation_decision');
              setLastChoice(null);
              setAccelEvents([]);
            }
          }}
        />
        {streakModal}
      </>
    );
  }

  if (!chapter) {
    return (
      <>
        <SafeAreaView style={styles.empty} edges={['top', 'bottom']}>
          <Text style={styles.emptyText}>NO CHAPTER SELECTED</Text>
          <Pressable
            testID="empty-back-btn"
            style={styles.emptyBtn}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.emptyHint}>◀ BACK TO MENU</Text>
          </Pressable>
        </SafeAreaView>
        {streakModal}
      </>
    );
  }

  if (!scenario) {
    return (
      <>
        <SafeAreaView style={styles.empty} edges={['top', 'bottom']}>
          <Text style={styles.emptyText}>CHAPTER COMPLETE</Text>
          <Pressable
            testID="empty-summary-btn"
            style={styles.emptyBtn}
            onPress={() => {
              finishChapter(chapter);
            }}
          >
            <Text style={styles.emptyHint}>▶ SEE SUMMARY</Text>
          </Pressable>
        </SafeAreaView>
        {streakModal}
      </>
    );
  }

  // CONCEPT PRIMER — shown before SITUATION whenever the scenario introduces
  // financial terms the player has not seen yet.
  if (phase === 'primer' && unseenTerms.length > 0) {
    return (
      <>
        <PrimerScreen
          terms={unseenTerms}
          onContinue={() => {
            markTermsSeen(unseenTerms.map((t) => t.name));
            setPhase('situation_decision');
          }}
        />
        {streakModal}
      </>
    );
  }

  const onChoose = (choice: Choice) => {
    play('click');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

    const prev = {
      age: state.age,
      cash: state.cash,
      savings: state.savings,
      debt: state.debt,
      happiness: state.happiness,
      knowledge: state.knowledge,
    };

    // Compute projected NEXT state mirroring the reducer's logic
    const yrs = scenario.advanceYears;
    const clamp = (n: number) => Math.max(0, Math.min(100, n));
    let cashAfter = Math.max(0, prev.cash + (choice.delta.cash ?? 0));
    let savingsAfter = Math.max(0, prev.savings + (choice.delta.savings ?? 0));
    let debtAfter = Math.max(0, prev.debt + (choice.delta.debt ?? 0));
    for (let i = 0; i < yrs; i++) {
      savingsAfter = Math.round(savingsAfter * 1.08);
      debtAfter = Math.round(debtAfter * 1.04);
    }
    const ageAfter = prev.age + yrs;
    let happyAfter = clamp(prev.happiness + (choice.delta.happiness ?? 0));
    let knowAfter = clamp(prev.knowledge + (choice.delta.knowledge ?? 0));
    if (choice.futureAge && choice.futureDelta && ageAfter >= choice.futureAge) {
      cashAfter = Math.max(0, cashAfter + (choice.futureDelta.cash ?? 0));
      savingsAfter = Math.max(0, savingsAfter + (choice.futureDelta.savings ?? 0));
      debtAfter = Math.max(0, debtAfter + (choice.futureDelta.debt ?? 0));
      happyAfter = clamp(happyAfter + (choice.futureDelta.happiness ?? 0));
      knowAfter = clamp(knowAfter + (choice.futureDelta.knowledge ?? 0));
    }
    const next = {
      age: ageAfter,
      cash: cashAfter,
      savings: savingsAfter,
      debt: debtAfter,
      happiness: happyAfter,
      knowledge: knowAfter,
    };

    const events = buildAccelEvents(prev, next, choice, scenario);
    const last = state.scenarioIndex + 1 >= chapter.scenarios.length;

    setAccelEvents(events);
    setLastChoice(choice);
    setIsLast(last);
    applyChoice(choice, scenario);
    setPhase('consequence');
  };

  return (
    <>
      <View style={styles.root} testID="play-screen">
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <Hud
            age={state.age}
            cash={state.cash}
            savings={state.savings}
            debt={state.debt}
            happiness={state.happiness}
          />

          {/* 4-Beat structure indicator */}
          <BeatIndicator phase={phase} testID="beat-indicator" />

          {/* Chapter strip */}
          <View style={styles.chapterStrip}>
            <View style={styles.chapterBadge}>
              <Text style={styles.chapterBadgeText}>{chapter.index}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.chapterTitle}>{chapter.title}</Text>
              <Text style={styles.chapterSub}>
                SCENARIO {state.scenarioIndex + 1} / {chapter.scenarios.length}
              </Text>
            </View>
            <MaterialCommunityIcons name="map-marker-radius" size={20} color={C.yellow} />
          </View>

          <Animated.View
            key={scenario.id}
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(150)}
            style={styles.sceneBox}
          >
            <PixelScene scene={scenario.scene} age={state.age} scenarioId={scenario.id} />
          </Animated.View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.bottom}
            showsVerticalScrollIndicator={false}
          >
            {/* Beat 1: SITUATION header */}
            <BeatHeader
              num="①"
              label="THE SITUATION"
              color={C.yellow}
              testID="beat-situation-header"
            />
            <DialogBox speaker={scenario.title} text={scenario.prompt} />

            {/* Beat 2: DECISION header */}
            <BeatHeader
              num="②"
              label="YOUR DECISION"
              color={C.green}
              testID="beat-decision-header"
              style={{ marginTop: 8 }}
            />
            <View style={styles.choices} testID="choices-list">
              {scenario.choices.map((c, i) => (
                <ChoiceButton
                  key={c.id}
                  label={c.label}
                  hint={c.hint}
                  color={COLORS[i % COLORS.length]}
                  onPress={() => onChoose(c)}
                  testID={`choice-${c.id}`}
                />
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
      {streakModal}
    </>
  );
}

function BeatIndicator({ phase, testID }: { phase: Phase; testID?: string }) {
  const beats: { num: string; label: string; key: Phase | 'consequence' | 'lesson' }[] = [
    { num: '①', label: 'SITUATION', key: 'situation_decision' },
    { num: '②', label: 'DECISION', key: 'situation_decision' },
    { num: '③', label: 'CONSEQUENCE', key: 'consequence' },
    { num: '④', label: 'LESSON', key: 'lesson' },
  ];
  return (
    <View style={beatStyles.wrap} testID={testID}>
      {beats.map((b, i) => {
        const active = b.key === phase;
        return (
          <React.Fragment key={i}>
            <View style={[beatStyles.beat, active && beatStyles.beatActive]}>
              <Text style={[beatStyles.beatNum, active && beatStyles.beatNumActive]}>{b.num}</Text>
              <Text style={[beatStyles.beatLabel, active && beatStyles.beatLabelActive]} numberOfLines={1}>
                {b.label}
              </Text>
            </View>
            {i < beats.length - 1 ? <View style={beatStyles.beatConn} /> : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function BeatHeader({
  num,
  label,
  color,
  testID,
  style,
}: {
  num: string;
  label: string;
  color: string;
  testID?: string;
  style?: object;
}) {
  return (
    <View style={[beatStyles.headerWrap, style]} testID={testID}>
      <View style={[beatStyles.headerBadge, { backgroundColor: color }]}>
        <Text style={beatStyles.headerNum}>{num}</Text>
      </View>
      <Text style={[beatStyles.headerLabel, { color }]}>{label}</Text>
      <View style={[beatStyles.headerLine, { backgroundColor: color }]} />
    </View>
  );
}

function LessonScreen({
  choice,
  onContinue,
}: {
  choice: Choice;
  onContinue: () => void;
}) {
  return (
    <View style={lessonStyles.root} testID="lesson-screen">
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <BeatIndicator phase="lesson" />
        <ScrollView contentContainerStyle={lessonStyles.scroll}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={lessonStyles.tagWrap}>
              <View style={lessonStyles.tag}>
                <Text style={lessonStyles.tagText}>CONCEPT</Text>
              </View>
              <Text style={lessonStyles.concept}>{choice.concept.toUpperCase()}</Text>
            </View>
            <View style={lessonStyles.card} testID="lesson-card">
              <ArtifactImage source={ARTIFACTS.book} size={56} containerStyle={lessonStyles.iconWrap} />
              <Text style={lessonStyles.eyebrow}>④ THE LESSON</Text>
              <Text style={lessonStyles.lessonText}>{choice.lesson}</Text>
            </View>
          </Animated.View>

          <Pressable
            testID="lesson-continue-btn"
            onPress={() => {
              play('coin');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              onContinue();
            }}
            style={({ pressed }) => [
              lessonStyles.continue,
              pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] },
            ]}
          >
            <Text style={lessonStyles.continueText}>▶ CONTINUE LIFE</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const beatStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#000',
    borderBottomWidth: 2,
    borderBottomColor: '#222',
  },
  beat: {
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    flex: 1,
  },
  beatActive: {},
  beatNum: {
    fontFamily: FONT.display,
    color: '#555',
    fontSize: 14,
  },
  beatNumActive: {
    color: C.yellow,
  },
  beatLabel: {
    fontFamily: FONT.display,
    color: '#555',
    fontSize: 8,
    letterSpacing: 1,
    marginTop: 2,
  },
  beatLabelActive: {
    color: C.yellow,
  },
  beatConn: {
    height: 2,
    flex: 0.4,
    backgroundColor: '#333',
  },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  headerBadge: {
    width: 28,
    height: 28,
    borderWidth: 3,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerNum: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 14,
  },
  headerLabel: {
    fontFamily: FONT.display,
    fontSize: 11,
    letterSpacing: 2,
  },
  headerLine: {
    flex: 1,
    height: 3,
  },
});

const lessonStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 18, paddingTop: 30, paddingBottom: 30 },
  tagWrap: { alignItems: 'center', marginBottom: 12 },
  tag: {
    backgroundColor: C.yellow,
    borderWidth: 3,
    borderColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 10,
    letterSpacing: 2,
  },
  concept: {
    fontFamily: FONT.display,
    color: C.white,
    fontSize: 22,
    letterSpacing: 2,
    marginTop: 10,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFF',
    borderWidth: 4,
    borderColor: '#000',
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  iconWrap: {
    alignSelf: 'center',
  },
  eyebrow: {
    fontFamily: FONT.display,
    color: C.red,
    fontSize: 10,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 6,
  },
  lessonText: {
    fontFamily: FONT.body,
    color: '#000',
    fontSize: 22,
    lineHeight: 26,
    textAlign: 'center',
    marginTop: 14,
  },
  continue: {
    backgroundColor: C.green,
    borderWidth: 4,
    borderColor: '#000',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 26,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  continueText: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 14,
    letterSpacing: 2,
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  chapterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 10,
    borderBottomWidth: 3,
    borderBottomColor: C.yellow,
  },
  chapterBadge: {
    width: 28,
    height: 28,
    backgroundColor: C.red,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterBadgeText: {
    fontFamily: FONT.display,
    color: C.white,
    fontSize: 14,
  },
  chapterTitle: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 12,
    letterSpacing: 1,
  },
  chapterSub: {
    fontFamily: FONT.body,
    color: '#888',
    fontSize: 13,
  },
  sceneBox: {
    height: 200,
  },
  bottom: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  choices: {
    gap: 14,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, padding: 24 },
  emptyText: { fontFamily: FONT.display, color: C.white, fontSize: 18, letterSpacing: 2 },
  emptyBtn: {
    marginTop: 18,
    backgroundColor: '#000',
    borderWidth: 4,
    borderColor: C.yellow,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  emptyHint: { fontFamily: FONT.display, color: C.yellow, fontSize: 13, letterSpacing: 2 },
});
