import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import LabHeader from '@/src/components/finlabs/LabHeader';
import { LabPrimaryBtn } from '@/src/components/finlabs/LabUI';
import StallScene from '@/src/components/finlabs/StallScene';
import StallTill, { DEFAULT_TILL } from '@/src/components/finlabs/StallTill';
import DialogBox from '@/src/components/DialogBox';
import { FL_BG, FL_GREEN, setLabDone } from '@/src/finlabs/storage';
import { finLabsRoadmapHref } from '@/src/finlabs/routes';
import { C, FONT } from '@/src/ui/theme';
import { play } from '@/src/game/audio';

type RoundDef = {
  customerSays: string;
  itemLabel: string;
  itemCost: number;
  paid: number;
  correctChange: number;
  hintOnWrong: string;
};

const TUTORIAL: RoundDef = {
  customerSays: 'One samosa please! Here\'s Rs 20.',
  itemLabel: 'SAMOSA',
  itemCost: 12,
  paid: 20,
  correctChange: 8,
  hintOnWrong: 'Rs 20 − Rs 12 = Rs 8',
};

const REAL_ROUNDS: RoundDef[] = [
  {
    customerSays: 'One samosa please! Here\'s Rs 20.',
    itemLabel: 'SAMOSA',
    itemCost: 12,
    paid: 20,
    correctChange: 8,
    hintOnWrong: 'Rs 20 − Rs 12 = Rs 8',
  },
  {
    customerSays: 'Two juices please! Here\'s Rs 50.',
    itemLabel: '2 JUICES',
    itemCost: 30,
    paid: 50,
    correctChange: 20,
    hintOnWrong: 'Rs 50 − Rs 30 = Rs 20',
  },
  {
    customerSays: 'Biscuits and chai please! Here\'s Rs 25.',
    itemLabel: 'SNACK SET',
    itemCost: 15,
    paid: 25,
    correctChange: 10,
    hintOnWrong: 'Rs 8 + Rs 7 = Rs 15 · Rs 25 − Rs 15 = Rs 10',
  },
  {
    customerSays: 'Three sandwiches! We pooled Rs 70.',
    itemLabel: '3 SANDWICH',
    itemCost: 66,
    paid: 70,
    correctChange: 4,
    hintOnWrong: 'Rs 22 × 3 = Rs 66 · Rs 70 − Rs 66 = Rs 4',
  },
];

function getScoreTag(score: number) {
  if (score >= 4) return 'CHANGE MASTER 🏆';
  if (score >= 3) return 'SHARP COUNTER ✅';
  if (score >= 2) return 'GETTING THERE 💪';
  return 'KEEP PRACTISING 🔄';
}

function parseInput(raw: string): number | null {
  const n = parseInt(raw.replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

type Props = {
  chapterId: string;
};

export default function ChangeMakerLab({ chapterId }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<'story' | 'tutorial' | 'rounds' | 'final'>('story');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [typedChange, setTypedChange] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [flashGreen, setFlashGreen] = useState(false);
  const [tutorialPassed, setTutorialPassed] = useState(false);
  const shakeSv = useSharedValue(0);

  const isTutorial = phase === 'tutorial';
  const roundDef = isTutorial ? TUTORIAL : REAL_ROUNDS[round];
  const pickedTotal = selected.reduce((a, b) => a + b, 0);
  const needed = roundDef.correctChange;
  const typedNum = parseInput(typedChange);
  const canGive = typedNum === needed && pickedTotal === needed;

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeSv.value }],
  }));

  const triggerShake = useCallback(() => {
    shakeSv.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, [shakeSv]);

  const resetRoundInputs = () => {
    setTypedChange('');
    setSelected([]);
    setHint(null);
  };

  const tapDenom = (value: number) => {
    play('click');
    const nextTotal = pickedTotal + value;
    if (nextTotal > needed) {
      play('bad');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      triggerShake();
      setHint(roundDef.hintOnWrong);
      setSelected([]);
      return;
    }
    setSelected((s) => [...s, value]);
    setHint(null);
  };

  const giveChange = () => {
    if (typedNum !== needed) {
      play('bad');
      setHint(roundDef.hintOnWrong);
      return;
    }
    if (pickedTotal !== needed) {
      play('bad');
      setHint(`Coins = Rs ${pickedTotal}. Need exactly Rs ${needed}.`);
      return;
    }

    play('coin');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setFlashGreen(true);

    if (isTutorial) {
      setTutorialPassed(true);
      setTimeout(() => {
        setFlashGreen(false);
        resetRoundInputs();
      }, 700);
      return;
    }

    setScore((s) => s + 1);
    setTimeout(() => {
      setFlashGreen(false);
      resetRoundInputs();
      if (round >= REAL_ROUNDS.length - 1) {
        setPhase('final');
      } else {
        setRound((r) => r + 1);
      }
    }, 700);
  };

  const handleTryAgain = () => {
    play('click');
    setRound(0);
    setScore(0);
    resetRoundInputs();
    setPhase('rounds');
  };

  const handleContinue = async () => {
    play('win');
    await setLabDone(chapterId, 2);
    router.replace(finLabsRoadmapHref(chapterId));
  };

  // ── STORY INTRO ──
  if (phase === 'story') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <LabHeader title="CHANGE MAKER" subtitle="Aunty's summer stall" onBack={() => router.replace(finLabsRoadmapHref(chapterId))} />
        <ScrollView contentContainerStyle={styles.storyScroll}>
          <View style={styles.storyHero}>
            <Text style={styles.storyHeroEmoji}>☀️🥟</Text>
            <Text style={styles.storyHeroTitle}>SUMMER AT THE STALL</Text>
          </View>
          <DialogBox
            speaker="THE DEAL"
            text="School is out. Aunty next door runs a samosa stall and promised you Rs 50 for every hour you help during summer vacation. First job: give the right change — fast and accurate."
          />
          <View style={styles.storyBullets}>
            <Text style={styles.bullet}>① Customer pays more than the item</Text>
            <Text style={styles.bullet}>② Type the change on the register</Text>
            <Text style={styles.bullet}>③ Pick coins from the drawer to match</Text>
            <Text style={styles.bullet}>④ Hand it over — earn Aunty's trust</Text>
          </View>
          <LabPrimaryBtn
            label="OPEN THE STALL ▶"
            onPress={() => {
              play('click');
              setPhase('tutorial');
            }}
          />
        </ScrollView>
      </View>
    );
  }

  // ── FINAL ──
  if (phase === 'final') {
    const earned = score * 12;
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.finalScroll}>
          <Animated.View entering={FadeIn.duration(400)}>
            <Text style={styles.finalEmoji}>🌅🔔</Text>
            <Text style={styles.finalTitle}>SHIFT COMPLETE</Text>
            <Text style={styles.scoreDisplay}>{score} / 4 CUSTOMERS</Text>
            <View style={styles.earnBox}>
              <Text style={styles.earnLabel}>PRACTICE EARNINGS</Text>
              <Text style={styles.earnValue}>Rs {earned}</Text>
              <Text style={styles.earnSub}>Aunty pays Rs 50/hr · you handled {score} orders cleanly</Text>
            </View>
            <View style={styles.tagBox}>
              <Text style={styles.tagText}>{getScoreTag(score)}</Text>
            </View>
            <View style={styles.conceptCard}>
              <Text style={styles.conceptLabel}>MAKING CHANGE</Text>
              <Text style={styles.conceptText}>
                Real stall work is subtraction plus counting. Get the maths right and the coins right —
                that is how you earn trust and money.
              </Text>
            </View>
            {score < 3 ? (
              <Pressable onPress={handleTryAgain} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
                <Text style={styles.secondaryBtnText}>TRY AGAIN</Text>
              </Pressable>
            ) : null}
            <LabPrimaryBtn label="CONTINUE ▶" onPress={handleContinue} />
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // ── TUTORIAL COMPLETE ──
  if (phase === 'tutorial' && tutorialPassed) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.storyScroll}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={styles.successBox}>
              <Text style={styles.successEmoji}>✓</Text>
              <Text style={styles.successTitle}>FIRST CUSTOMER SERVED</Text>
              <Text style={styles.successText}>
                Rs 20 paid − Rs 12 samosa = Rs 8 change. You typed 8 and handed Rs 5 + Rs 1 + Rs 1 + Rs 1. Aunty
                nodded. Now serve four real customers.
              </Text>
            </View>
            <LabPrimaryBtn
              label="START THE SHIFT ▶"
              onPress={() => {
                resetRoundInputs();
                setTutorialPassed(false);
                setRound(0);
                setPhase('rounds');
              }}
            />
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // ── ACTIVE STALL ──
  const roundLabel = isTutorial ? 'PRACTICE CUSTOMER' : `CUSTOMER ${round + 1} / 4`;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <View style={styles.stallHeader}>
        <Pressable onPress={() => router.replace(finLabsRoadmapHref(chapterId))} style={styles.backChip}>
          <Text style={styles.backChipText}>◀</Text>
        </Pressable>
        <View style={styles.stallHeaderCenter}>
          <Text style={styles.stallHeaderTitle}>CHANGE MAKER</Text>
          <Text style={styles.stallHeaderSub}>{roundLabel} · Rs 50/HR JOB</Text>
        </View>
        {!isTutorial ? (
          <View style={styles.scoreChip}>
            <Text style={styles.scoreChipText}>{score}✓</Text>
          </View>
        ) : (
          <View style={styles.scoreChip}>
            <Text style={styles.scoreChipText}>TRY</Text>
          </View>
        )}
      </View>

      <StallScene
        customerLine={roundDef.customerSays}
        itemLabel={roundDef.itemLabel}
        itemCost={roundDef.itemCost}
        paid={roundDef.paid}
      />

      <StallTill
        typedChange={typedChange}
        onChangeText={(t) => {
          setTypedChange(t);
          setHint(null);
        }}
        needed={needed}
        pickedTotal={pickedTotal}
        selected={selected}
        stacks={DEFAULT_TILL}
        onTapCoin={tapDenom}
        onRemoveCoin={(i) => {
          play('tick');
          setSelected((s) => s.filter((_, j) => j !== i));
        }}
        onClear={resetRoundInputs}
        onGive={giveChange}
        canGive={canGive}
        flashGreen={flashGreen}
        shakeStyle={shakeStyle}
        hint={hint}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: FL_BG },
  storyScroll: { padding: 14, paddingBottom: 32 },
  storyHero: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  storyHeroEmoji: { fontSize: 48 },
  storyHeroTitle: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 14,
    letterSpacing: 2,
    marginTop: 8,
  },
  storyBullets: {
    borderWidth: 2,
    borderColor: '#333',
    padding: 12,
    gap: 6,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#111',
  },
  bullet: {
    fontFamily: FONT.body,
    color: '#bbb',
    fontSize: 16,
  },
  stallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5D4037',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 3,
    borderBottomColor: '#3E2723',
    gap: 8,
  },
  backChip: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderColor: '#FFE082',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChipText: {
    fontFamily: FONT.display,
    color: '#FFE082',
    fontSize: 12,
  },
  stallHeaderCenter: { flex: 1 },
  stallHeaderTitle: {
    fontFamily: FONT.display,
    color: '#FFE082',
    fontSize: 10,
    letterSpacing: 1,
  },
  stallHeaderSub: {
    fontFamily: FONT.body,
    color: '#BCAAA4',
    fontSize: 12,
    marginTop: 1,
  },
  scoreChip: {
    backgroundColor: FL_GREEN,
    borderWidth: 2,
    borderColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scoreChipText: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 10,
  },
  successBox: {
    borderWidth: 4,
    borderColor: C.green,
    backgroundColor: '#111',
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  successEmoji: {
    fontFamily: FONT.display,
    color: C.green,
    fontSize: 32,
    marginBottom: 8,
  },
  successTitle: {
    fontFamily: FONT.display,
    color: C.green,
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 10,
  },
  successText: {
    fontFamily: FONT.body,
    color: C.white,
    fontSize: 18,
    lineHeight: 22,
    textAlign: 'center',
  },
  secondaryBtn: {
    borderWidth: 2,
    borderColor: C.yellow,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryBtnText: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 10,
  },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }] },
  finalScroll: { padding: 14, paddingTop: 30, paddingBottom: 40 },
  finalEmoji: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 8,
  },
  finalTitle: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 16,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },
  scoreDisplay: {
    fontFamily: FONT.display,
    color: C.white,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 12,
  },
  earnBox: {
    borderWidth: 3,
    borderColor: FL_GREEN,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#0a1a12',
  },
  earnLabel: {
    fontFamily: FONT.display,
    color: '#888',
    fontSize: 8,
    letterSpacing: 2,
  },
  earnValue: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 32,
    marginTop: 4,
  },
  earnSub: {
    fontFamily: FONT.body,
    color: '#888',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  tagBox: {
    borderWidth: 2,
    borderColor: C.yellow,
    backgroundColor: '#1a1a00',
    padding: 12,
    marginBottom: 12,
  },
  tagText: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 10,
    textAlign: 'center',
  },
  conceptCard: {
    borderWidth: 2,
    borderColor: '#444',
    backgroundColor: '#0a0a0a',
    padding: 14,
    marginBottom: 12,
  },
  conceptLabel: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 8,
  },
  conceptText: {
    fontFamily: FONT.body,
    color: '#ccc',
    fontSize: 18,
    lineHeight: 22,
  },
});
