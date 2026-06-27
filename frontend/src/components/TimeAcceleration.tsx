import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { C, FONT } from '../ui/theme';
import { play } from '../game/audio';
import type { AccelEvent } from '../game/accelEvents';

type Props = {
  events: AccelEvent[];
  onDone: () => void;
};

export default function TimeAcceleration({ events, onDone }: Props) {
  const [idx, setIdx] = useState(0);
  const event = events[idx];
  const isLast = idx >= events.length - 1;

  const spin = useSharedValue(0);
  useEffect(() => {
    spin.value = 0;
    spin.value = withRepeat(withTiming(360, { duration: 700, easing: Easing.linear }), -1);
  }, [idx, spin]);

  useEffect(() => {
    if (!event) return;
    if (event.kind === 'time') play('whoosh');
    else if (event.kind === 'stat') play(event.positive ? 'coin' : 'bad');
    else if (event.kind === 'future') play('win');
    else play('tick');

    Haptics.selectionAsync().catch(() => {});
  }, [idx, event]);

  const handleNext = () => {
    if (isLast) {
      onDone();
    } else {
      setIdx((v) => v + 1);
    }
  };

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotateX: `${spin.value}deg` }],
  }));

  if (!event) return null;

  return (
    <View style={styles.overlay} testID="time-acceleration">
      <View style={styles.topBar}>
        <Text style={styles.stepCount}>
          STEP {idx + 1} / {events.length}
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((idx + 1) / events.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.cardWrap}>
        <Animated.View
          key={idx}
          entering={FadeIn.duration(320)}
          style={styles.card}
          testID="accel-event-card"
        >
          <Text style={styles.eventTitle}>{event.title}</Text>

          {event.kind === 'time' ? (
            <Animated.View style={[styles.bigEmojiWrap, spinStyle]}>
              <Text style={styles.bigEmoji}>{event.emoji}</Text>
            </Animated.View>
          ) : (
            <View style={styles.bigEmojiWrap}>
              <Text style={styles.bigEmoji}>{event.emoji}</Text>
            </View>
          )}

          {event.kind === 'stat' ? (
            <StatCounter
              label={event.label}
              from={event.from}
              to={event.to}
              format={event.format}
              positive={event.positive}
            />
          ) : null}

          <Text style={styles.text} testID="accel-event-text">
            {event.text}
          </Text>
        </Animated.View>
      </View>

      <View style={styles.bottomBar}>
        <Pressable
          testID="accel-next-btn"
          onPress={handleNext}
          style={({ pressed }) => [
            styles.nextBtn,
            pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] },
          ]}
        >
          <Text style={styles.nextText}>
            {isLast ? '▶ SEE THE LESSON' : 'NEXT ▶'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function fmt(v: number, format: 'inr' | 'plain100') {
  if (format === 'inr') {
    return 'Rs ' + Math.round(v).toLocaleString('en-IN');
  }
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
  format: 'inr' | 'plain100';
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
        <Text style={styles.counterValue} testID="stat-counter-value">
          {fmt(value, format)}
        </Text>
        <View style={[styles.deltaPill, { backgroundColor: color }]}>
          <Text style={styles.deltaText}>
            {delta >= 0 ? '+' : '−'}
            {format === 'inr'
              ? 'Rs ' + Math.abs(delta).toLocaleString('en-IN')
              : Math.abs(delta)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 100,
  },
  topBar: {
    paddingTop: 48,
    paddingHorizontal: 18,
  },
  stepCount: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 11,
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
  card: {
    backgroundColor: '#1A1A1A',
    borderWidth: 4,
    borderColor: C.yellow,
    padding: 18,
    minHeight: 320,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  eventTitle: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 14,
    letterSpacing: 3,
    textAlign: 'center',
  },
  bigEmojiWrap: {
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  bigEmoji: {
    fontSize: 60,
    textAlign: 'center',
  },
  text: {
    fontFamily: FONT.body,
    color: C.white,
    fontSize: 20,
    lineHeight: 22,
    marginTop: 14,
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
    paddingBottom: 32,
  },
  nextBtn: {
    backgroundColor: C.green,
    borderWidth: 4,
    borderColor: '#000',
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  nextText: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 13,
    letterSpacing: 2,
  },
});
