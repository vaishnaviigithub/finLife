import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';

import { useGame } from '@/src/game/store';
import { C, FONT } from '@/src/ui/theme';
import { play } from '@/src/game/audio';
import PixelAvatar from '@/src/components/PixelAvatar';
import ArtifactImage from '@/src/components/ArtifactImage';
import { ARTIFACTS, LIFE_STAGE_ARTIFACTS } from '@/src/game/artifacts';

const TOTAL_BEATS = 7;

// =============================================================
// Main orchestrator
// =============================================================
export default function Intro() {
  const router = useRouter();
  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const { completeIntro, state } = useGame();
  const isReplay = replay === '1' && !!state.playerName;
  const [beat, setBeat] = useState(0);
  const [askSkip, setAskSkip] = useState(false);

  const finishIntro = () => {
    play('win');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTimeout(() => router.replace('/'), 50);
  };

  const next = () => {
    if (beat >= TOTAL_BEATS - 1) return;
    if (isReplay && beat === TOTAL_BEATS - 2) {
      finishIntro();
      return;
    }
    play('whoosh');
    Haptics.selectionAsync().catch(() => {});
    setBeat((b) => b + 1);
  };

  const handleSkip = () => {
    play('click');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setAskSkip(true);
  };

  const confirmSkip = () => {
    setAskSkip(false);
    play('whoosh');
    if (isReplay) {
      finishIntro();
      return;
    }
    setBeat(TOTAL_BEATS - 1); // jump to name entry
  };

  const handleStart = (rawName: string) => {
    const name = rawName.trim() || 'Player';
    play('win');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    completeIntro(name);
    setTimeout(() => router.replace('/'), 50);
  };

  return (
    <View style={styles.root} testID="intro-screen">
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.stage}>
          {beat === 0 && <Beat1 onTap={next} />}
          {beat === 1 && <Beat2 onTap={next} />}
          {beat === 2 && <Beat3 onTap={next} />}
          {beat === 3 && <Beat4 onTap={next} />}
          {beat === 4 && <Beat5 onTap={next} />}
          {beat === 5 && <Beat6 onTap={next} />}
          {beat === 6 && <Beat7 onStart={handleStart} />}
        </View>

        {/* Skip button — top right */}
        {!isReplay && beat < TOTAL_BEATS - 1 ? (
          <Pressable
            testID="intro-skip-btn"
            onPress={handleSkip}
            style={({ pressed }) => [
              styles.skipBtn,
              { opacity: pressed ? 0.8 : 0.45 },
            ]}
          >
            <Text style={styles.skipText}>SKIP INTRO ▸</Text>
          </Pressable>
        ) : null}

        {/* Progress dots — bottom centre */}
        <View style={styles.dots} testID="intro-dots">
          {Array.from({ length: TOTAL_BEATS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === beat && styles.dotActive,
                i < beat && styles.dotPast,
              ]}
            />
          ))}
        </View>
      </SafeAreaView>

      <SkipConfirmModal
        visible={askSkip}
        onConfirm={confirmSkip}
        onCancel={() => setAskSkip(false)}
      />
    </View>
  );
}

// =============================================================
// Skip confirm modal
// =============================================================
function SkipConfirmModal({
  visible,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={modalStyles.backdrop}>
        <Animated.View entering={FadeInDown.duration(220)} style={modalStyles.sheet}>
          <Text style={modalStyles.title}>SKIP THE INTRO?</Text>
          <Text style={modalStyles.body}>
            You can still enter your name on the next screen.
          </Text>
          <Pressable
            testID="skip-confirm-yes"
            onPress={onConfirm}
            style={({ pressed }) => [
              modalStyles.btnPrimary,
              pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] },
            ]}
          >
            <Text style={modalStyles.btnPrimaryText}>YES, GO TO THE GAME</Text>
          </Pressable>
          <Pressable
            testID="skip-confirm-no"
            onPress={onCancel}
            style={({ pressed }) => [
              modalStyles.btnGhost,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={modalStyles.btnGhostText}>NO, KEEP WATCHING</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

// =============================================================
// BEAT 1 — THE HOOK
// =============================================================
function Beat1({ onTap }: { onTap: () => void }) {
  const [phase, setPhase] = useState(0);
  // phases: 0 = silence/rupees rising, 1 = line1, 2 = line2, 3 = shatter, 4 = ready

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1800);
    const t2 = setTimeout(() => setPhase(2), 3400);
    const t3 = setTimeout(() => setPhase(3), 5400);
    const t4 = setTimeout(() => setPhase(4), 6400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <Pressable
      testID="beat-1-hook"
      onPress={phase >= 4 ? onTap : undefined}
      style={[styles.beatRoot, { backgroundColor: '#0A0E27' }]}
    >
      {/* Floating ₹ symbols */}
      {phase < 3 ? <FloatingRupees /> : null}

      {/* Stars in the background */}
      <Stars />

      {/* Text lines */}
      <View style={styles.centerCol}>
        {phase >= 1 && phase < 3 ? (
          <Animated.View entering={FadeIn.duration(700)}>
            <Text style={beat1Styles.line1}>EVERYONE EARNS MONEY.</Text>
          </Animated.View>
        ) : null}
        {phase >= 2 && phase < 3 ? (
          <Animated.View entering={FadeInUp.duration(700)}>
            <Text style={beat1Styles.line2}>
              Almost nobody is taught{'\n'}what to do with it.
            </Text>
          </Animated.View>
        ) : null}
      </View>

      {/* Shatter + reveal */}
      {phase >= 3 ? <ShatterReveal /> : null}

      {/* Tap to continue */}
      {phase >= 4 ? <TapToContinue /> : null}
    </Pressable>
  );
}

function FloatingRupees() {
  return (
    <>
      <RisingRupee left="20%" delay={0} size={28} color={C.yellow} duration={3800} />
      <RisingRupee left="55%" delay={400} size={44} color="#FFD93D" duration={3600} />
      <RisingRupee left="80%" delay={250} size={22} color={C.yellow} duration={3900} />
      <RisingRupee left="35%" delay={900} size={36} color="#FFE066" duration={3500} />
      <RisingRupee left="68%" delay={1200} size={26} color={C.yellow} duration={3600} />
    </>
  );
}

function RisingRupee({
  left,
  delay,
  size,
  color,
  duration,
}: {
  left: string;
  delay: number;
  size: number;
  color: string;
  duration: number;
}) {
  const y = useSharedValue(0);
  const r = useSharedValue(0);
  const o = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(delay, withTiming(-600, { duration, easing: Easing.out(Easing.quad) }));
    r.value = withDelay(
      delay,
      withRepeat(withTiming(360, { duration: 1800, easing: Easing.linear }), -1),
    );
    o.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(1, { duration: duration - 800 }),
        withTiming(0, { duration: 400 }),
      ),
    );
  }, [y, r, o, delay, duration]);

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { rotate: `${r.value}deg` }],
    opacity: o.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: left as any,
          bottom: -40,
        },
        aStyle,
      ]}
      pointerEvents="none"
    >
      <Text
        style={{
          fontFamily: FONT.display,
          fontSize: size,
          color,
          textShadowColor: color,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 16,
        }}
      >
        ₹
      </Text>
    </Animated.View>
  );
}

function Stars() {
  const positions = useMemo(
    () =>
      Array.from({ length: 22 }).map(() => ({
        left: Math.random() * 360,
        top: Math.random() * 700,
        size: 1 + Math.random() * 2,
      })),
    [],
  );
  return (
    <>
      {positions.map((p, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            backgroundColor: '#FFF',
            opacity: 0.5,
          }}
          pointerEvents="none"
        />
      ))}
    </>
  );
}

function PulseText({ text }: { text: string }) {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(
      withSequence(withTiming(0.3, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1,
    );
  }, [o]);
  const s = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <View style={tapHintStyles.pill}>
      <Animated.Text style={[tapHintStyles.text, s]}>{text}</Animated.Text>
    </View>
  );
}

function TapToContinue() {
  return (
    <View style={tapHintStyles.wrap}>
      <PulseText text="▸ TAP TO CONTINUE" />
    </View>
  );
}

function ShatterReveal() {
  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={beat1Styles.revealWrap}
      pointerEvents="none"
    >
      {/* Glass shards animate outward */}
      {Array.from({ length: 8 }).map((_, i) => (
        <Shard key={i} index={i} />
      ))}
      {/* Reveal pixel world */}
      <Animated.View
        entering={FadeIn.delay(300).duration(700)}
        style={beat1Styles.revealInner}
      >
        <LinearGradient
          colors={['rgba(255,155,71,0.35)', 'rgba(232,93,4,0.55)', 'rgba(139,0,0,0.75)']}
          style={StyleSheet.absoluteFillObject}
        />
        <ArtifactImage
          source={ARTIFACTS.kidsPlaying}
          width={280}
          height={200}
          containerStyle={{ position: 'absolute', bottom: 20, alignSelf: 'center', left: 20 }}
        />
        {/* avatar peeking */}
        <View style={beat1Styles.avatarPeek}>
          <PixelAvatar age={10} pixelSize={6} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function Shard({ index }: { index: number }) {
  const dirs = [
    { x: -180, y: -120 },
    { x: 180, y: -120 },
    { x: -180, y: 120 },
    { x: 180, y: 120 },
    { x: 0, y: -200 },
    { x: 0, y: 200 },
    { x: -240, y: 0 },
    { x: 240, y: 0 },
  ];
  const d = dirs[index % dirs.length];
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const o = useSharedValue(1);

  useEffect(() => {
    x.value = withTiming(d.x, { duration: 800, easing: Easing.out(Easing.cubic) });
    y.value = withTiming(d.y, { duration: 800, easing: Easing.out(Easing.cubic) });
    o.value = withTiming(0, { duration: 800 });
  }, [x, y, o, d]);

  const s = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { rotate: `${index * 45}deg` }],
    opacity: o.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: '50%',
          top: '40%',
          width: 32,
          height: 32,
          marginLeft: -16,
          marginTop: -16,
          backgroundColor: 'rgba(255,255,255,0.85)',
          borderWidth: 2,
          borderColor: '#FFF',
        },
        s,
      ]}
    />
  );
}

// =============================================================
// BEAT 2 — WHAT IS PERSONAL FINANCE?
// =============================================================
const PF_ITEMS = [
  { emoji: '💰', label: 'EARNING' },
  { emoji: '🛒', label: 'SPENDING' },
  { emoji: '🐷', label: 'SAVING' },
  { emoji: '📈', label: 'INVESTING' },
  { emoji: '🛡️', label: 'PROTECTING' },
  { emoji: '📋', label: 'PLANNING' },
];

function Beat2({ onTap }: { onTap: () => void }) {
  const [tvIdx, setTvIdx] = useState(0);
  const [allShown, setAllShown] = useState(false);
  const [showFinal, setShowFinal] = useState(false);

  useEffect(() => {
    if (tvIdx < PF_ITEMS.length - 1) {
      play('click');
      const t = setTimeout(() => setTvIdx((v) => v + 1), 1500);
      return () => clearTimeout(t);
    } else {
      const t1 = setTimeout(() => setAllShown(true), 900);
      const t2 = setTimeout(() => setShowFinal(true), 1700);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [tvIdx]);

  return (
    <Pressable
      testID="beat-2-pf"
      onPress={showFinal ? onTap : undefined}
      style={[styles.beatRoot, { backgroundColor: '#FF9B47' }]}
    >
      <LinearGradient
        colors={['#FFB66B', '#E67E22', '#8B4513']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Living room ground */}
      <View style={beat2Styles.ground} />

      <View style={beat2Styles.content}>
        {/* Avatar asks — sits directly above the TV */}
        <View style={beat2Styles.avatarRow}>
          <View style={beat2Styles.avatarBox}>
            <PixelAvatar age={10} pixelSize={6} />
            {showFinal ? (
              <Animated.Text entering={FadeInUp.duration(400)} style={beat2Styles.bulb}>
                💡
              </Animated.Text>
            ) : null}
          </View>
          <View style={beat2Styles.speech}>
            <Text style={beat2Styles.speechText}>
              {showFinal ? 'Whoa. So THAT\'s it!' : 'Okay so... what even IS personal finance?'}
            </Text>
            <View style={beat2Styles.speechTailDown} />
          </View>
        </View>

        {/* TV — main focus, right under the dialog */}
        <View style={beat2Styles.tvWrap}>
          <View style={beat2Styles.tvBody}>
            <View style={beat2Styles.tvScreen}>
              {!allShown ? (
                <Animated.View
                  key={tvIdx}
                  entering={FadeIn.duration(150)}
                  style={beat2Styles.tvIconWrap}
                >
                  <Text style={beat2Styles.tvIcon}>{PF_ITEMS[tvIdx].emoji}</Text>
                  <Text style={beat2Styles.tvLabel}>{PF_ITEMS[tvIdx].label}</Text>
                </Animated.View>
              ) : null}
              {allShown && !showFinal ? <CircleGrid /> : null}
              {showFinal ? (
                <Animated.View
                  entering={FadeIn.duration(400)}
                  style={{ alignItems: 'center', padding: 8 }}
                >
                  <Text style={beat2Styles.finalLine}>PERSONAL FINANCE =</Text>
                  <Text style={beat2Styles.finalLine2}>
                    everything you do{'\n'}with YOUR money,{'\n'}for YOUR life.
                  </Text>
                </Animated.View>
              ) : null}
            </View>
            <View style={beat2Styles.tvKnobs}>
              <View style={beat2Styles.tvKnob} />
              <View style={beat2Styles.tvKnob} />
            </View>
          </View>
          <View style={beat2Styles.tvLegs} />
        </View>

        {!showFinal ? (
          <Text style={beat2Styles.footerText}>
            It sounds complicated. It isn&apos;t. You already make financial decisions every day — you
            just don&apos;t realise it yet.
          </Text>
        ) : null}
      </View>

      {showFinal ? <TapToContinue /> : null}
    </Pressable>
  );
}

function CircleGrid() {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={beat2Styles.circle}>
      {PF_ITEMS.map((it, i) => {
        const angle = (i / PF_ITEMS.length) * Math.PI * 2 - Math.PI / 2;
        const r = 38;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        return (
          <View
            key={i}
            style={[
              beat2Styles.circleItem,
              { transform: [{ translateX: x }, { translateY: y }] },
            ]}
          >
            <Text style={{ fontSize: 18 }}>{it.emoji}</Text>
          </View>
        );
      })}
    </Animated.View>
  );
}

// =============================================================
// BEAT 3 — THE REAL PROBLEM (text only)
// =============================================================
function Beat3({ onTap }: { onTap: () => void }) {
  const [phase, setPhase] = useState(0);
  // 0 = line 1, 1 = line 2, 2 = until now

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 2800);
    const t2 = setTimeout(() => setPhase(2), 5200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <Pressable
      testID="beat-3-problem"
      onPress={phase >= 2 ? onTap : undefined}
      style={[styles.beatRoot, { backgroundColor: '#1A1A2E' }]}
    >
      <Stars />
      <View style={beat3Styles.center}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={beat3Styles.line1}>LIFE KEEPS THROWING MONEY DECISIONS AT YOU.</Text>
        </Animated.View>

        {phase >= 1 ? (
          <Animated.View entering={FadeIn.duration(500)} style={beat3Styles.lineWrap}>
            <Text style={beat3Styles.line2}>BUT SCHOOL NEVER TAUGHT YOU HOW.</Text>
          </Animated.View>
        ) : null}

        {phase >= 2 ? (
          <Animated.View entering={FadeInUp.duration(600)} style={beat3Styles.lineWrap}>
            <Text style={beat3Styles.untilNow}>UNTIL NOW.</Text>
          </Animated.View>
        ) : null}
      </View>

      {phase >= 2 ? <TapToContinue /> : null}
    </Pressable>
  );
}

// =============================================================
// BEAT 4 — THE WORLD REVEAL (zooming roadmap)
// =============================================================
const LIFE_NODES = LIFE_STAGE_ARTIFACTS;

function Beat4({ onTap }: { onTap: () => void }) {
  const [active, setActive] = useState(0);
  const [done, setDone] = useState(false);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 9000, easing: Easing.out(Easing.cubic) });
    const interval = setInterval(() => {
      setActive((v) => {
        const next = v + 1;
        play('tick');
        if (next >= LIFE_NODES.length) {
          clearInterval(interval);
          setTimeout(() => setDone(true), 800);
          return v;
        }
        return next;
      });
    }, 1300);
    return () => clearInterval(interval);
  }, [scale]);

  const zoomStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      testID="beat-4-world"
      onPress={done ? onTap : undefined}
      style={[styles.beatRoot, { backgroundColor: '#0A0E27' }]}
    >
      <Stars />
      <Animated.View style={[beat4Styles.mapWrap, zoomStyle]}>
        {LIFE_NODES.map((n, i) => {
          const isLeft = i % 2 === 0;
          const top = 18 + i * 70;
          const left = isLeft ? 40 : 220;
          const isActive = i <= active;
          return (
            <React.Fragment key={i}>
              <View
                style={[
                  beat4Styles.node,
                  {
                    top,
                    left,
                    backgroundColor: isActive ? C.yellow : '#222',
                    borderColor: isActive ? '#000' : '#444',
                    shadowOpacity: isActive ? 1 : 0,
                  },
                ]}
              >
                <ArtifactImage source={ARTIFACTS[n.key]} size={34} />
              </View>
              {isActive ? (
                <Animated.View
                  entering={FadeIn.duration(300)}
                  style={[
                    beat4Styles.nodeLabel,
                    {
                      top: top + 14,
                      left: isLeft ? left + 70 : left - 110,
                      width: 100,
                      alignItems: isLeft ? 'flex-start' : 'flex-end',
                    },
                  ]}
                >
                  <Text style={beat4Styles.nodeLabelText}>{n.label}</Text>
                  <Text style={beat4Styles.nodeAge}>AGE {n.age}</Text>
                </Animated.View>
              ) : null}
              {/* trail dot to next */}
              {i < LIFE_NODES.length - 1 ? (
                <View
                  style={[
                    beat4Styles.trailDot,
                    {
                      top: top + 56,
                      left: isLeft ? left + 60 : left - 12,
                      backgroundColor: isActive ? '#FFF' : '#444',
                    },
                  ]}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </Animated.View>

      {/* Narration */}
      <View style={beat4Styles.narrationWrap}>
        <Animated.Text key={active} entering={FadeIn.duration(400)} style={beat4Styles.narration}>
          {[
            'You\'ll be born into a middle-class Indian family...',
            '...make your first money decisions as a child...',
            '...navigate college, your first salary, taxes, EMIs...',
            '...build a career, a family, and obligations...',
            '...face the storms of mid-life — kids, EMIs, gold...',
            '...survive a real crisis that tests everything...',
            '...and retire with a life shaped entirely by YOUR choices.',
          ][Math.min(active, 6)]}
        </Animated.Text>
      </View>

      {done ? (
        <Animated.View entering={FadeInUp.duration(500)} style={beat4Styles.finalWrap}>
          <Text style={beat4Styles.finalTitle}>THIS IS YOUR</Text>
          <Text style={beat4Styles.finalTitleBig}>FINANCIAL LIFE.</Text>
          <Text style={beat4Styles.finalSub}>YOU&apos;RE IN CHARGE.</Text>
        </Animated.View>
      ) : null}

      {done ? <TapToContinue /> : null}
    </Pressable>
  );
}

// =============================================================
// BEAT 5 — HOW THE GAME WORKS (3 cards)
// =============================================================
function Beat5({ onTap }: { onTap: () => void }) {
  const [card, setCard] = useState(0); // 0,1,2 individual cards shown
  const [c1Flipped, setC1Flipped] = useState(false);
  const [c2Choice, setC2Choice] = useState<null | 'save' | 'spend'>(null);
  const [c3Played, setC3Played] = useState(false);

  // Reveal next card after current is interacted
  useEffect(() => {
    if (card === 1 && c1Flipped) {
      const t = setTimeout(() => setCard(2), 1100);
      return () => clearTimeout(t);
    }
    if (card === 2 && c2Choice) {
      const t = setTimeout(() => setCard(3), 1100);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [card, c1Flipped, c2Choice]);

  // Auto reveal C1 on mount
  useEffect(() => {
    const t = setTimeout(() => setCard(1), 350);
    return () => clearTimeout(t);
  }, []);

  const allDone = c1Flipped && c2Choice && c3Played;

  return (
    <Pressable
      testID="beat-5-howitworks"
      onPress={allDone ? onTap : undefined}
      style={[styles.beatRoot, { backgroundColor: '#0E1530' }]}
    >
      <View style={beat5Styles.top}>
        <Text style={beat5Styles.title}>HERE&apos;S HOW FINLIFE WORKS</Text>
        <Text style={beat5Styles.subtitle}>(tap each card to try it)</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 80, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {card >= 1 ? (
          <Card1Situation flipped={c1Flipped} onFlip={() => setC1Flipped(true)} />
        ) : null}
        {card >= 2 ? (
          <Card2Decision choice={c2Choice} onChoose={(c) => setC2Choice(c)} />
        ) : null}
        {card >= 3 ? (
          <Card3Consequence played={c3Played} onPlay={() => setC3Played(true)} />
        ) : null}
        {allDone ? (
          <Animated.View entering={FadeInUp.duration(500)} style={beat5Styles.outroWrap}>
            <Text style={beat5Styles.outroLine}>THAT&apos;S IT.</Text>
            <Text style={beat5Styles.outroSub}>No quizzes. No lectures. Just life.</Text>
            <View style={{ marginTop: 14, alignItems: 'center' }}>
              <PulseText text="▸ TAP TO CONTINUE" />
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>
    </Pressable>
  );
}

function Card1Situation({ flipped, onFlip }: { flipped: boolean; onFlip: () => void }) {
  return (
    <Animated.View entering={SlideInRight.duration(500)} style={beat5Styles.card}>
      <View style={beat5Styles.cardHead}>
        <Text style={beat5Styles.cardEmoji}>🎭</Text>
        <View style={{ flex: 1 }}>
          <Text style={beat5Styles.cardEyebrow}>STEP 1</Text>
          <Text style={beat5Styles.cardTitle}>LIFE THROWS A SITUATION</Text>
        </View>
      </View>
      <Pressable
        testID="beat5-card1"
        onPress={() => {
          play('click');
          Haptics.selectionAsync().catch(() => {});
          onFlip();
        }}
        disabled={flipped}
        style={({ pressed }) => [
          beat5Styles.miniBox,
          { backgroundColor: flipped ? '#FFF' : C.yellow },
          pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] },
        ]}
      >
        {!flipped ? (
          <>
            <ArtifactImage source={ARTIFACTS.gift} size={52} />
            <Text style={beat5Styles.miniBoxText}>TAP TO OPEN</Text>
          </>
        ) : (
          <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: 'center' }}>
            <Text style={beat5Styles.scenarioTitle}>BIRTHDAY GIFT</Text>
            <Text style={beat5Styles.scenarioText}>
              Grandma gives you ₹1,000 for your birthday. What do you do?
            </Text>
          </Animated.View>
        )}
      </Pressable>
      <Text style={beat5Styles.cardCaption}>
        Real Indian life moments. Real money involved. You always know what&apos;s happening.
      </Text>
    </Animated.View>
  );
}

function Card2Decision({
  choice,
  onChoose,
}: {
  choice: null | 'save' | 'spend';
  onChoose: (c: 'save' | 'spend') => void;
}) {
  return (
    <Animated.View entering={SlideInRight.duration(500)} style={beat5Styles.card}>
      <View style={beat5Styles.cardHead}>
        <Text style={beat5Styles.cardEmoji}>🤔</Text>
        <View style={{ flex: 1 }}>
          <Text style={beat5Styles.cardEyebrow}>STEP 2</Text>
          <Text style={beat5Styles.cardTitle}>YOU MAKE A REAL CHOICE</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable
          testID="beat5-card2-save"
          onPress={() => {
            play('coin');
            Haptics.selectionAsync().catch(() => {});
            onChoose('save');
          }}
          disabled={!!choice}
          style={({ pressed }) => [
            beat5Styles.choiceMini,
            {
              backgroundColor: choice === 'save' ? C.green : '#1A2034',
              borderColor: choice === 'save' ? C.yellow : '#000',
            },
            pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] },
          ]}
        >
          <ArtifactImage source={ARTIFACTS.piggyBank} size={36} />
          <Text style={beat5Styles.choiceMiniText}>SAVE IT</Text>
        </Pressable>
        <Pressable
          testID="beat5-card2-spend"
          onPress={() => {
            play('coin');
            Haptics.selectionAsync().catch(() => {});
            onChoose('spend');
          }}
          disabled={!!choice}
          style={({ pressed }) => [
            beat5Styles.choiceMini,
            {
              backgroundColor: choice === 'spend' ? C.red : '#1A2034',
              borderColor: choice === 'spend' ? C.yellow : '#000',
            },
            pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] },
          ]}
        >
          <ArtifactImage source={ARTIFACTS.toys} size={36} />
          <Text style={beat5Styles.choiceMiniText}>BUY A TOY</Text>
        </Pressable>
      </View>
      <Text style={beat5Styles.cardCaption}>
            {choice
              ? choice === 'save'
                ? 'Smart instinct! Now watch what time does to your \u20B91,000...'
                : 'Felt good, didn\u2019t it? Now watch what time does NOT do to spent money...'
              : 'No right or wrong yet. Just your gut. But every choice has a consequence.'}
      </Text>
    </Animated.View>
  );
}

function Card3Consequence({ played, onPlay }: { played: boolean; onPlay: () => void }) {
  return (
    <Animated.View entering={SlideInRight.duration(500)} style={beat5Styles.card}>
      <View style={beat5Styles.cardHead}>
        <Text style={beat5Styles.cardEmoji}>⚡</Text>
        <View style={{ flex: 1 }}>
          <Text style={beat5Styles.cardEyebrow}>STEP 3</Text>
          <Text style={beat5Styles.cardTitle}>TIME FAST-FORWARDS</Text>
        </View>
      </View>
      <Pressable
        testID="beat5-card3"
        onPress={() => {
          if (played) return;
          play('whoosh');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
          onPlay();
        }}
        style={({ pressed }) => [
          beat5Styles.miniAccel,
          pressed && !played && { transform: [{ translateX: 2 }, { translateY: 2 }] },
        ]}
      >
        {!played ? (
          <Text style={beat5Styles.miniAccelHint}>▶ PRESS TO PREVIEW</Text>
        ) : (
          <MiniAccel />
        )}
      </Pressable>
      <Text style={beat5Styles.cardCaption}>
        Decades of consequences in seconds. This is where the learning actually happens.
      </Text>
    </Animated.View>
  );
}

function MiniAccel() {
  const [age, setAge] = useState(8);
  const [savings, setSavings] = useState(1000);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / 1900);
      setAge(Math.round(8 + (35 - 8) * t));
      setSavings(Math.round(1000 + (135000 - 1000) * t));
      if (t >= 1) clearInterval(id);
    }, 50);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={beat5Styles.miniAccelTitle}>⏳ TIME FLIES ⏳</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
        <View style={beat5Styles.miniStat}>
          <Text style={beat5Styles.miniStatLabel}>AGE</Text>
          <Text style={beat5Styles.miniStatValue}>{age}</Text>
        </View>
        <View style={[beat5Styles.miniStat, { backgroundColor: C.green }]}>
          <Text style={[beat5Styles.miniStatLabel, { color: '#000' }]}>SAVINGS</Text>
          <Text style={[beat5Styles.miniStatValue, { color: '#000' }]}>
            ₹{savings.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>
    </View>
  );
}

// =============================================================
// BEAT 6 — THE STAKES (consequence chain)
// =============================================================
const CHAIN_GOOD = [
  { age: 8, emoji: '🎂', text: 'You save your birthday money' },
  { age: 22, emoji: '💼', text: 'You start investing early' },
  { age: 35, emoji: '📈', text: 'Your investments have doubled' },
  { age: 43, emoji: '🏥', text: 'A health crisis hits' },
  { age: 43, emoji: '🛡️', text: 'You had insurance. You\'re okay.', good: true },
];
const CHAIN_BAD = [
  { age: 8, emoji: '🎂', text: 'You spend everything' },
  { age: 22, emoji: '💸', text: 'No savings habit, no investments' },
  { age: 35, emoji: '📉', text: 'Living paycheck to paycheck' },
  { age: 43, emoji: '🏥', text: 'The same health crisis hits' },
  { age: 43, emoji: '💔', text: 'No insurance. ₹12L gone.', bad: true },
];

function Beat6({ onTap }: { onTap: () => void }) {
  const [step, setStep] = useState(0); // 0..4 good chain, 5..9 bad chain, 10 final
  useEffect(() => {
    if (step >= 10) return;
    const t = setTimeout(() => {
      play(step === 9 ? 'bad' : 'tick');
      setStep((v) => v + 1);
    }, step === 4 || step === 9 ? 1800 : 1100);
    return () => clearTimeout(t);
  }, [step]);

  const done = step >= 10;

  return (
    <Pressable
      testID="beat-6-stakes"
      onPress={done ? onTap : undefined}
      style={[styles.beatRoot, { backgroundColor: '#0A0E27' }]}
    >
      <Stars />
      <Text style={beat6Styles.title}>SAME LIFE. DIFFERENT DECISIONS.</Text>
      <View style={beat6Styles.row}>
        <Chain title="WITH HABITS" data={CHAIN_GOOD} visibleUpTo={Math.min(step, 4)} color={C.green} />
        <View style={beat6Styles.divider} />
        <Chain
          title="WITHOUT"
          data={CHAIN_BAD}
          visibleUpTo={step < 5 ? -1 : Math.min(step - 5, 4)}
          color={C.red}
        />
      </View>
      {done ? (
        <>
          <Animated.View entering={FadeInUp.duration(500)} style={beat6Styles.outro}>
            <Text style={beat6Styles.outroBig}>ONE DECISION.</Text>
            <Text style={beat6Styles.outroBigOrange}>DECADES OF DIFFERENCE.</Text>
            <Text style={beat6Styles.outroSub}>
              In FinLife, your choices follow you. Choose wisely — or learn why it matters.
            </Text>
          </Animated.View>
          <TapToContinue />
        </>
      ) : null}
    </Pressable>
  );
}

function Chain({
  title,
  data,
  visibleUpTo,
  color,
}: {
  title: string;
  data: typeof CHAIN_GOOD;
  visibleUpTo: number;
  color: string;
}) {
  return (
    <View style={beat6Styles.chainCol}>
      <View style={[beat6Styles.chainHead, { backgroundColor: color }]}>
        <Text style={beat6Styles.chainHeadText}>{title}</Text>
      </View>
      {data.map((n, i) => {
        const visible = i <= visibleUpTo;
        return (
          <View key={i} style={beat6Styles.chainItemWrap}>
            <Animated.View
              entering={visible ? FadeIn.duration(300) : undefined}
              style={[
                beat6Styles.chainItem,
                { opacity: visible ? 1 : 0.1, borderColor: visible ? color : '#222' },
              ]}
            >
              <Text style={beat6Styles.chainEmoji}>{n.emoji}</Text>
              <Text style={beat6Styles.chainAge}>AGE {n.age}</Text>
              <Text style={beat6Styles.chainText}>{n.text}</Text>
            </Animated.View>
            {i < data.length - 1 ? (
              <View
                style={[
                  beat6Styles.threadDot,
                  { backgroundColor: visible && i < visibleUpTo ? color : '#222' },
                ]}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

// =============================================================
// BEAT 7 — NAME ENTRY
// =============================================================
function Beat7({ onStart }: { onStart: (name: string) => void }) {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const ready = name.trim().length > 0 || submitted;

  const handleStart = (skipName = false) => {
    if (submitted) return;
    setSubmitted(true);
    setTimeout(() => onStart(skipName ? 'Player' : name), 1300);
  };

  // Bobbing avatar
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.value = withRepeat(
      withSequence(withTiming(-6, { duration: 600 }), withTiming(0, { duration: 600 })),
      -1,
    );
  }, [bob]);
  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));

  return (
    <View testID="beat-7-name" style={[styles.beatRoot, { backgroundColor: '#0E1530' }]}>
      <Stars />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          contentContainerStyle={beat7Styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Distant roadmap glow */}
          <View style={beat7Styles.glowBg} pointerEvents="none">
            <LinearGradient
              colors={['rgba(241,196,15,0)', 'rgba(241,196,15,0.18)', 'rgba(241,196,15,0)']}
              style={StyleSheet.absoluteFillObject}
            />
          </View>

          {/* Avatar + speech */}
          <View style={beat7Styles.avatarRow}>
            <View style={beat7Styles.speechBubble}>
              <Text style={beat7Styles.speechText}>
                {submitted
                  ? `Let's go, ${name.trim() || 'Player'}!\nYour financial life starts now.`
                  : 'Hey! I\'m you — just getting started.\nWhat should I call you?'}
              </Text>
              <View style={beat7Styles.speechTail} />
            </View>
            <Animated.View style={bobStyle}>
              <PixelAvatar age={12} pixelSize={9} />
            </Animated.View>
          </View>

          {/* Input */}
          {!submitted ? (
            <Animated.View entering={FadeIn.duration(400)} style={beat7Styles.inputWrap}>
              <Text style={beat7Styles.inputLabel}>ENTER YOUR NAME</Text>
              <TextInput
                testID="intro-name-input"
                value={name}
                onChangeText={setName}
                placeholder="Type your name..."
                placeholderTextColor="#666"
                maxLength={20}
                style={beat7Styles.input}
                autoCapitalize="words"
                returnKeyType="go"
                onSubmitEditing={() => ready && handleStart(false)}
              />
              <View style={beat7Styles.cursorRow} />
              <Text style={beat7Styles.inputHint}>
                Your name appears on your Life Report Card at the end.
              </Text>

              <Pressable
                testID="intro-start-btn"
                onPress={() => handleStart(false)}
                disabled={!ready}
                style={({ pressed }) => [
                  beat7Styles.startBtn,
                  {
                    backgroundColor: ready ? C.yellow : '#3a3a3a',
                    borderColor: ready ? '#000' : '#222',
                  },
                  pressed && ready && { transform: [{ translateX: 2 }, { translateY: 2 }] },
                ]}
              >
                <Text
                  style={[
                    beat7Styles.startBtnText,
                    { color: ready ? '#000' : '#777' },
                  ]}
                >
                  ▶ START MY JOURNEY
                </Text>
              </Pressable>

              <Pressable
                testID="intro-skip-name-btn"
                onPress={() => handleStart(true)}
                style={({ pressed }) => [
                  beat7Styles.skipName,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={beat7Styles.skipNameText}>
                  Skip — call me &quot;Player&quot;
                </Text>
              </Pressable>
            </Animated.View>
          ) : (
            <Confetti />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Confetti() {
  const colors = [C.yellow, C.green, C.red, C.blue, C.orange, '#fff'];
  return (
    <View style={beat7Styles.confettiWrap} pointerEvents="none">
      {Array.from({ length: 40 }).map((_, i) => (
        <ConfettiPiece key={i} color={colors[i % colors.length]} delay={i * 30} index={i} />
      ))}
      <Animated.View entering={FadeIn.duration(400)} style={beat7Styles.celebText}>
        <Text style={beat7Styles.celebHead}>★ LET&apos;S GO! ★</Text>
      </Animated.View>
    </View>
  );
}

function ConfettiPiece({ color, delay, index }: { color: string; delay: number; index: number }) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const r = useSharedValue(0);
  const o = useSharedValue(0);
  useEffect(() => {
    const targetX = (Math.random() - 0.5) * 360;
    const targetY = -300 - Math.random() * 300;
    o.value = withDelay(delay, withTiming(1, { duration: 100 }));
    x.value = withDelay(
      delay,
      withTiming(targetX, { duration: 1200, easing: Easing.out(Easing.cubic) }),
    );
    y.value = withDelay(
      delay,
      withTiming(targetY, { duration: 1200, easing: Easing.out(Easing.cubic) }),
    );
    r.value = withDelay(delay, withTiming(720, { duration: 1200 }));
  }, [x, y, r, o, delay]);
  const s = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { rotate: `${r.value}deg` }],
    opacity: o.value,
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: '50%',
          bottom: 80,
          width: 10,
          height: 14,
          backgroundColor: color,
          borderWidth: 1,
          borderColor: '#000',
        },
        s,
      ]}
    />
  );
}

// =============================================================
// STYLES
// =============================================================
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0E27' },
  stage: { flex: 1 },
  beatRoot: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  skipBtn: {
    position: 'absolute',
    top: 50,
    right: 14,
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: C.yellow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    zIndex: 50,
  },
  skipText: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 10,
    letterSpacing: 1,
  },
  dots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    zIndex: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#333',
  },
  dotActive: {
    backgroundColor: C.orange,
    width: 14,
    shadowColor: C.orange,
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  dotPast: {
    backgroundColor: C.yellow,
  },
  centerCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  tinyHut: {
    position: 'absolute',
    width: 32,
    height: 26,
    borderWidth: 2,
    borderColor: '#000',
  },
  tinySun: {
    position: 'absolute',
    top: 30,
    right: 38,
    width: 20,
    height: 20,
    backgroundColor: C.yellow,
    borderWidth: 2,
    borderColor: '#000',
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1A1A1A',
    borderTopWidth: 4,
    borderColor: C.yellow,
    padding: 22,
    gap: 12,
  },
  title: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 16,
    letterSpacing: 2,
    textAlign: 'center',
  },
  body: {
    fontFamily: FONT.body,
    color: '#CCC',
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 4,
  },
  btnPrimary: {
    backgroundColor: C.yellow,
    borderWidth: 4,
    borderColor: '#000',
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  btnPrimaryText: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 13,
    letterSpacing: 2,
  },
  btnGhost: {
    padding: 12,
    alignItems: 'center',
  },
  btnGhostText: {
    fontFamily: FONT.display,
    color: '#888',
    fontSize: 11,
    letterSpacing: 1,
  },
});

const tapHintStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 34,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 60,
  },
  pill: {
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderWidth: 2,
    borderColor: C.yellow,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 12,
    letterSpacing: 2,
  },
});

const beat1Styles = StyleSheet.create({
  line1: {
    fontFamily: FONT.display,
    color: C.white,
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 2,
  },
  line2: {
    fontFamily: FONT.body,
    color: '#AAA',
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 26,
    marginTop: 26,
  },
  revealWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealInner: {
    width: 320,
    height: 380,
    borderWidth: 5,
    borderColor: '#000',
    overflow: 'hidden',
    position: 'relative',
  },
  avatarPeek: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
  },
});

const beat2Styles = StyleSheet.create({
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
    backgroundColor: '#5D2906',
    borderTopWidth: 4,
    borderTopColor: '#000',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 10,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    width: '100%',
    maxWidth: 320,
    marginBottom: 4,
  },
  avatarBox: { position: 'relative' },
  bulb: {
    position: 'absolute',
    top: -36,
    right: -8,
    fontSize: 32,
  },
  speech: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 4,
    borderColor: '#000',
    padding: 10,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  speechText: {
    fontFamily: FONT.body,
    color: '#000',
    fontSize: 16,
    lineHeight: 20,
  },
  speechTailDown: {
    position: 'absolute',
    bottom: -14,
    left: 28,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#000',
  },
  tvWrap: {
    alignItems: 'center',
    marginTop: 8,
  },
  tvBody: {
    width: 240,
    backgroundColor: '#2C3E50',
    borderWidth: 5,
    borderColor: '#000',
    padding: 10,
  },
  tvScreen: {
    height: 150,
    backgroundColor: '#000',
    borderWidth: 3,
    borderColor: '#1A1A2E',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tvIconWrap: { alignItems: 'center' },
  tvIcon: { fontSize: 64 },
  tvLabel: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 13,
    letterSpacing: 2,
    marginTop: 4,
  },
  tvKnobs: { flexDirection: 'row', justifyContent: 'flex-end', gap: 6, marginTop: 6 },
  tvKnob: { width: 10, height: 10, backgroundColor: '#000', borderRadius: 5 },
  tvLegs: {
    width: 80,
    height: 14,
    backgroundColor: '#7F4F24',
    borderWidth: 3,
    borderColor: '#000',
  },
  circle: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circleItem: {
    position: 'absolute',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: C.yellow,
    padding: 4,
  },
  finalLine: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 11,
    letterSpacing: 1,
  },
  finalLine2: {
    fontFamily: FONT.body,
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  footerText: {
    fontFamily: FONT.body,
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.92,
    maxWidth: 300,
    marginTop: 14,
  },
});

const beat3Styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 80,
  },
  lineWrap: {
    marginTop: 28,
    alignItems: 'center',
  },
  line1: {
    fontFamily: FONT.display,
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 1.5,
    lineHeight: 20,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 3,
    borderColor: '#000',
  },
  line2: {
    fontFamily: FONT.display,
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 1.5,
    lineHeight: 20,
    backgroundColor: '#000',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 3,
    borderColor: C.yellow,
  },
  untilNow: {
    fontFamily: FONT.display,
    color: C.orange,
    fontSize: 32,
    letterSpacing: 4,
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 4,
    borderColor: C.orange,
  },
});

const beat4Styles = StyleSheet.create({
  mapWrap: {
    width: 340,
    height: 520,
    alignSelf: 'center',
    marginTop: 50,
    position: 'relative',
  },
  node: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.yellow,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
  },
  nodeEmoji: { fontSize: 26 },
  nodeLabel: {
    position: 'absolute',
  },
  nodeLabelText: {
    fontFamily: FONT.display,
    color: C.white,
    fontSize: 10,
    letterSpacing: 1,
  },
  nodeAge: {
    fontFamily: FONT.body,
    color: C.yellow,
    fontSize: 13,
  },
  trailDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderWidth: 2,
    borderColor: '#000',
  },
  narrationWrap: {
    position: 'absolute',
    bottom: 220,
    left: 30,
    right: 30,
    alignItems: 'center',
  },
  narration: {
    fontFamily: FONT.body,
    color: '#FFF',
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
  },
  finalWrap: {
    position: 'absolute',
    bottom: 130,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  finalTitle: {
    fontFamily: FONT.display,
    color: '#888',
    fontSize: 11,
    letterSpacing: 2,
  },
  finalTitleBig: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 22,
    letterSpacing: 2,
    marginTop: 4,
  },
  finalSub: {
    fontFamily: FONT.display,
    color: C.orange,
    fontSize: 14,
    letterSpacing: 2,
    marginTop: 6,
  },
});

const beat5Styles = StyleSheet.create({
  top: { paddingTop: 100, paddingHorizontal: 80, alignItems: 'center' },
  title: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 14,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONT.body,
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1A2034',
    borderWidth: 4,
    borderColor: '#000',
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardEmoji: { fontSize: 30 },
  cardEyebrow: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 9,
    letterSpacing: 2,
  },
  cardTitle: {
    fontFamily: FONT.display,
    color: '#FFF',
    fontSize: 12,
    letterSpacing: 1,
  },
  miniBox: {
    borderWidth: 3,
    borderColor: '#000',
    padding: 14,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  miniBoxIcon: { fontSize: 36 },
  miniBoxText: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 6,
  },
  scenarioTitle: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 12,
    letterSpacing: 1,
  },
  scenarioText: {
    fontFamily: FONT.body,
    color: '#000',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
  },
  cardCaption: {
    fontFamily: FONT.body,
    color: '#CCC',
    fontSize: 14,
    lineHeight: 17,
  },
  choiceMini: {
    flex: 1,
    borderWidth: 3,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  choiceMiniText: {
    fontFamily: FONT.display,
    color: '#FFF',
    fontSize: 11,
    letterSpacing: 1,
  },
  miniAccel: {
    backgroundColor: '#000',
    borderWidth: 3,
    borderColor: C.yellow,
    padding: 12,
    alignItems: 'center',
    minHeight: 110,
    justifyContent: 'center',
  },
  miniAccelHint: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 12,
    letterSpacing: 2,
  },
  miniAccelTitle: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 11,
    letterSpacing: 2,
  },
  miniStat: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 70,
  },
  miniStatLabel: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 8,
    letterSpacing: 1,
  },
  miniStatValue: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 14,
    marginTop: 2,
  },
  outroWrap: {
    alignItems: 'center',
    marginTop: 10,
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 3,
    borderColor: C.orange,
  },
  outroLine: {
    fontFamily: FONT.display,
    color: C.orange,
    fontSize: 22,
    letterSpacing: 3,
  },
  outroSub: {
    fontFamily: FONT.body,
    color: '#FFF',
    fontSize: 17,
    marginTop: 6,
  },
});

const beat6Styles = StyleSheet.create({
  title: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 12,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 96,
    marginBottom: 14,
    paddingHorizontal: 70,
  },
  row: { flexDirection: 'row', flex: 1, paddingHorizontal: 8 },
  divider: { width: 4, backgroundColor: '#222' },
  chainCol: { flex: 1, paddingHorizontal: 4 },
  chainHead: {
    borderWidth: 3,
    borderColor: '#000',
    paddingVertical: 4,
    alignItems: 'center',
    marginBottom: 6,
  },
  chainHeadText: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 11,
    letterSpacing: 1,
  },
  chainItemWrap: { alignItems: 'center' },
  chainItem: {
    width: '100%',
    borderWidth: 3,
    padding: 6,
    alignItems: 'center',
    backgroundColor: '#000',
    gap: 2,
  },
  chainEmoji: { fontSize: 20 },
  chainAge: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 8,
    letterSpacing: 1,
  },
  chainText: {
    fontFamily: FONT.body,
    color: '#FFF',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 13,
  },
  threadDot: {
    width: 4,
    height: 14,
    marginVertical: 1,
  },
  outro: {
    paddingHorizontal: 18,
    paddingBottom: 60,
    alignItems: 'center',
  },
  outroBig: {
    fontFamily: FONT.display,
    color: '#FFF',
    fontSize: 18,
    letterSpacing: 2,
  },
  outroBigOrange: {
    fontFamily: FONT.display,
    color: C.orange,
    fontSize: 18,
    letterSpacing: 2,
    marginTop: 4,
  },
  outroSub: {
    fontFamily: FONT.body,
    color: '#CCC',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});

const beat7Styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 80,
    paddingBottom: 60,
    justifyContent: 'flex-start',
    gap: 18,
  },
  glowBg: {
    ...StyleSheet.absoluteFillObject,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 20,
  },
  speechBubble: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 4,
    borderColor: '#000',
    padding: 10,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  speechText: {
    fontFamily: FONT.body,
    color: '#000',
    fontSize: 17,
    lineHeight: 19,
  },
  speechTail: {
    position: 'absolute',
    right: -16,
    bottom: 14,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 14,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#000',
  },
  inputWrap: {
    backgroundColor: '#000',
    borderWidth: 4,
    borderColor: C.yellow,
    padding: 14,
    gap: 8,
  },
  inputLabel: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 11,
    letterSpacing: 2,
  },
  input: {
    fontFamily: FONT.body,
    color: '#FFF',
    fontSize: 22,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 3,
    borderBottomColor: C.orange,
  },
  cursorRow: { height: 0 },
  inputHint: {
    fontFamily: FONT.body,
    color: '#888',
    fontSize: 13,
  },
  startBtn: {
    borderWidth: 4,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  startBtnText: {
    fontFamily: FONT.display,
    fontSize: 14,
    letterSpacing: 2,
  },
  skipName: {
    alignItems: 'center',
    padding: 8,
  },
  skipNameText: {
    fontFamily: FONT.body,
    color: '#888',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  confettiWrap: {
    height: 360,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  celebText: { alignItems: 'center' },
  celebHead: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 28,
    letterSpacing: 3,
    textShadowColor: C.red,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
});
