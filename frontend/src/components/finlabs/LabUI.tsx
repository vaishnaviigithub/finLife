import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { C, FONT } from '@/src/ui/theme';
import { FL_GREEN } from '@/src/finlabs/storage';
import { play } from '@/src/game/audio';
import DialogBox from '@/src/components/DialogBox';

export function LabBeatHeader({
  num,
  label,
  color = C.yellow,
  style,
}: {
  num: string;
  label: string;
  color?: string;
  style?: object;
}) {
  return (
    <View style={[styles.headerWrap, style]}>
      <View style={[styles.headerBadge, { backgroundColor: color }]}>
        <Text style={styles.headerNum}>{num}</Text>
      </View>
      <Text style={[styles.headerLabel, { color }]}>{label}</Text>
      <View style={[styles.headerLine, { backgroundColor: color }]} />
    </View>
  );
}

export function LabMiniHud({
  wallet,
  mood,
}: {
  wallet: number;
  mood: number;
}) {
  return (
    <View style={styles.hud}>
      <View style={styles.hudStat}>
        <Text style={styles.hudLabel}>WALLET</Text>
        <Text style={styles.hudValue}>Rs {Math.round(wallet).toLocaleString('en-IN')}</Text>
      </View>
      <View style={styles.hudStat}>
        <Text style={styles.hudLabel}>MOOD</Text>
        <Text style={styles.hudValue}>{Math.round(mood)}/100</Text>
      </View>
    </View>
  );
}

export type LabAccelEvent =
  | { kind: 'day'; title: string; emoji: string; text: string }
  | { kind: 'story'; title: string; emoji: string; text: string }
  | {
      kind: 'stat';
      title: string;
      emoji: string;
      label: string;
      text: string;
      from: number;
      to: number;
      format: 'inr' | 'mood';
      positive: boolean;
    };

function fmtStat(v: number, format: 'inr' | 'mood') {
  if (format === 'inr') return `Rs ${Math.round(v).toLocaleString('en-IN')}`;
  return `${Math.round(v)} / 100`;
}

function StatCounter({
  label,
  from,
  to,
  format,
  positive,
}: {
  label: string;
  from: number;
  to: number;
  format: 'inr' | 'mood';
  positive: boolean;
}) {
  const [value, setValue] = useState(from);
  const ringSv = useSharedValue(0);

  useEffect(() => {
    setValue(from);
    const start = Date.now();
    const dur = 1200;
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / dur);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setValue(from + (to - from) * eased);
      if (t >= 1) clearInterval(id);
    }, 40);
    ringSv.value = withSequence(withTiming(1.1, { duration: 200 }), withTiming(1, { duration: 220 }));
    return () => clearInterval(id);
  }, [from, to, ringSv]);

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: ringSv.value }] }));
  const color = positive ? C.green : C.red;
  const delta = to - from;

  return (
    <Animated.View style={[styles.counterWrap, ringStyle]}>
      <View style={[styles.counterCard, { borderColor: color }]}>
        <Text style={[styles.counterLabel, { color }]}>{label}</Text>
        <Text style={styles.counterValue}>{fmtStat(value, format)}</Text>
        <View style={[styles.deltaPill, { backgroundColor: color }]}>
          <Text style={styles.deltaText}>
            {delta >= 0 ? '+' : '−'}
            {format === 'inr'
              ? `Rs ${Math.abs(Math.round(delta)).toLocaleString('en-IN')}`
              : Math.abs(Math.round(delta))}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

export function LabAccelPlayer({
  events,
  onDone,
  stepPrefix,
}: {
  events: LabAccelEvent[];
  onDone: () => void;
  stepPrefix?: string;
}) {
  const [idx, setIdx] = useState(0);
  const event = events[idx];
  const isLast = idx >= events.length - 1;

  useEffect(() => {
    if (!event) return;
    if (event.kind === 'day') play('whoosh');
    else if (event.kind === 'stat') play(event.positive ? 'coin' : 'bad');
    else play('tick');
    Haptics.selectionAsync().catch(() => {});
  }, [idx, event]);

  if (!event) return null;

  const handleNext = () => {
    if (isLast) onDone();
    else setIdx((v) => v + 1);
  };

  return (
    <View style={styles.accelRoot}>
      <View style={styles.topBar}>
        <Text style={styles.stepCount}>
          {stepPrefix ? `${stepPrefix} · ` : ''}STEP {idx + 1} / {events.length}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((idx + 1) / events.length) * 100}%` }]} />
        </View>
      </View>

      <View style={styles.cardWrap}>
        <Animated.View key={idx} entering={FadeIn.duration(320)} style={styles.accelCard}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={styles.bigEmojiWrap}>
            <Text style={styles.bigEmoji}>{event.emoji}</Text>
          </View>
          {event.kind === 'stat' ? (
            <StatCounter
              label={event.label}
              from={event.from}
              to={event.to}
              format={event.format}
              positive={event.positive}
            />
          ) : null}
          <Text style={styles.accelText}>{event.text}</Text>
        </Animated.View>
      </View>

      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [styles.nextBtn, pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] }]}
        >
          <Text style={styles.nextText}>{isLast ? 'CONTINUE ▶' : 'NEXT ▶'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function LabSituationBlock({
  tag,
  situation,
  children,
}: {
  tag: string;
  situation: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.situationBlock}>
      <LabBeatHeader num="①" label="THE SITUATION" color={C.yellow} />
      <DialogBox speaker={tag} text={situation} />
      {children}
    </View>
  );
}

export function LabDecisionBlock({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.decisionBlock}>
      <LabBeatHeader num="②" label="YOUR PLAN" color={FL_GREEN} style={{ marginTop: 12 }} />
      {children}
    </View>
  );
}

export function LabPrimaryBtn({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryBtn,
        disabled && styles.primaryBtnDisabled,
        pressed && !disabled && { transform: [{ translateX: 2 }, { translateY: 2 }] },
      ]}
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  hud: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#000',
    borderBottomWidth: 3,
    borderBottomColor: C.yellow,
    padding: 8,
  },
  hudStat: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#333',
    padding: 6,
    alignItems: 'center',
  },
  hudLabel: {
    fontFamily: FONT.display,
    color: '#888',
    fontSize: 8,
    letterSpacing: 1,
  },
  hudValue: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 13,
    marginTop: 2,
  },
  accelRoot: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    paddingTop: 12,
    paddingHorizontal: 18,
  },
  stepCount: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 10,
    letterSpacing: 2,
    textAlign: 'center',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#222',
    borderWidth: 2,
    borderColor: '#000',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.yellow,
  },
  cardWrap: {
    flex: 1,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  accelCard: {
    backgroundColor: '#1A1A1A',
    borderWidth: 4,
    borderColor: C.yellow,
    padding: 18,
    minHeight: 300,
  },
  eventTitle: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 13,
    letterSpacing: 3,
    textAlign: 'center',
  },
  bigEmojiWrap: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  bigEmoji: {
    fontSize: 52,
    textAlign: 'center',
  },
  accelText: {
    fontFamily: FONT.body,
    color: C.white,
    fontSize: 20,
    lineHeight: 24,
    marginTop: 12,
    textAlign: 'center',
  },
  counterWrap: {
    alignItems: 'center',
    marginTop: 8,
  },
  counterCard: {
    backgroundColor: '#000',
    borderWidth: 3,
    paddingVertical: 10,
    paddingHorizontal: 18,
    minWidth: 240,
    alignItems: 'center',
  },
  counterLabel: {
    fontFamily: FONT.display,
    fontSize: 11,
    letterSpacing: 2,
  },
  counterValue: {
    fontFamily: FONT.display,
    color: C.white,
    fontSize: 22,
    marginTop: 6,
  },
  deltaPill: {
    marginTop: 6,
    borderWidth: 2,
    borderColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  deltaText: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 12,
  },
  bottomBar: {
    padding: 18,
    paddingBottom: 24,
  },
  nextBtn: {
    backgroundColor: C.green,
    borderWidth: 4,
    borderColor: '#000',
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextText: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 13,
    letterSpacing: 2,
  },
  situationBlock: {
    marginBottom: 4,
  },
  decisionBlock: {
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: FL_GREEN,
    borderWidth: 4,
    borderColor: '#000',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryBtnDisabled: {
    opacity: 0.35,
    backgroundColor: '#444',
  },
  primaryBtnText: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 12,
    letterSpacing: 1,
  },
});
