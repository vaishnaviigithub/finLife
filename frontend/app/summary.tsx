import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CHAPTERS, useGame } from '@/src/game/store';
import { ALL_FLAGS } from '@/src/game/data';
import { C, FONT } from '@/src/ui/theme';
import { play } from '@/src/game/audio';
import PixelAvatar from '@/src/components/PixelAvatar';
import ArtifactImage from '@/src/components/ArtifactImage';
import { ARTIFACTS, getChapterBackground } from '@/src/game/artifacts';

export default function Summary() {
  const router = useRouter();
  const { state } = useGame();
  const params = useLocalSearchParams<{ chapter?: string }>();
  const chapter = useMemo(
    () => CHAPTERS.find((c) => c.id === params.chapter) ?? null,
    [params.chapter],
  );

  useEffect(() => {
    play('win');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  const flagsList = useMemo(() => {
    return ALL_FLAGS.filter((f) => state.flags[f.key]);
  }, [state.flags]);

  // Score: knowledge + happiness/2 + min(savings/1000, 50) - min(debt/2000, 30)
  const score = Math.max(
    0,
    Math.round(
      state.knowledge * 0.6 +
        state.happiness * 0.2 +
        Math.min(state.savings / 1000, 60) -
        Math.min(state.debt / 2000, 30),
    ),
  );

  const grade = score > 80 ? 'S' : score > 65 ? 'A' : score > 50 ? 'B' : score > 35 ? 'C' : 'D';
  const gradeColor =
    grade === 'S' ? C.yellow : grade === 'A' ? C.green : grade === 'B' ? C.blue : grade === 'C' ? C.orange : C.red;

  const nextChapter = useMemo(() => {
    if (!chapter) return null;
    const idx = CHAPTERS.findIndex((c) => c.id === chapter.id);
    return CHAPTERS[idx + 1] ?? null;
  }, [chapter]);

  return (
    <View style={styles.root} testID="summary-screen">
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>CHAPTER COMPLETE</Text>
          {chapter ? (
            <ArtifactImage
              source={ARTIFACTS[getChapterBackground(chapter.id)]}
              size={72}
              containerStyle={{ alignSelf: 'center', marginBottom: 8 }}
            />
          ) : null}
          <Text style={styles.title}>{chapter?.title ?? 'CHAPTER'}</Text>
          <Text style={styles.subtitle}>{chapter?.subtitle}</Text>

          {/* Grade card */}
          <Animated.View
            entering={FadeInDown.duration(500)}
            style={[styles.gradeCard, { backgroundColor: gradeColor }]}
          >
            <View style={styles.gradeLeft}>
              <PixelAvatar age={state.age} pixelSize={7} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.gradeLabel}>YOUR GRADE</Text>
              <Text style={styles.gradeBig}>{grade}</Text>
              <Text style={styles.gradeScore}>SCORE {score}</Text>
            </View>
          </Animated.View>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <StatBox label="AGE" value={`${state.age}`} icon="cake-variant" color={C.yellow} />
            <StatBox label="CASH" value={`Rs ${state.cash.toLocaleString('en-IN')}`} icon="cash" color={C.green} />
            <StatBox label="SAVED" value={`Rs ${state.savings.toLocaleString('en-IN')}`} icon="piggy-bank" color={C.blue} />
            <StatBox label="DEBT" value={`Rs ${state.debt.toLocaleString('en-IN')}`} icon="credit-card-minus" color={C.red} />
            <StatBox label="MOOD" value={`${state.happiness}/100`} icon="emoticon-happy-outline" color={C.orange} />
            <StatBox label="LEARN" value={`${state.knowledge}/100`} icon="brain" color="#9B59B6" />
          </View>

          {/* Earned/learned tags */}
          <Text style={styles.sectionTitle}>WHAT YOU CARRY FORWARD</Text>
          <View style={styles.flagsBox}>
            {flagsList.length === 0 ? (
              <Text style={styles.flagEmpty}>No habits set yet. Try again to discover more.</Text>
            ) : (
              flagsList.map((f) => (
                <View
                  key={f.key}
                  style={[
                    styles.flag,
                    { backgroundColor: f.positive ? C.green : C.red },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={f.positive ? 'check-bold' : 'close-thick'}
                    size={14}
                    color="#000"
                  />
                  <Text style={styles.flagText}>{f.label}</Text>
                </View>
              ))
            )}
          </View>

          {/* Story log */}
          <Text style={styles.sectionTitle}>LIFE TIMELINE</Text>
          <View style={styles.log}>
            {state.log.slice(-8).map((l, i) => (
              <View key={i} style={styles.logItem}>
                <Text style={styles.logAge}>AGE {l.age}</Text>
                <Text style={styles.logText}>{l.text}</Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {nextChapter ? (
              <Pressable
                testID="next-chapter-btn"
                onPress={() => router.replace('/')}
                style={({ pressed }) => [
                  styles.primary,
                  pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] },
                ]}
              >
                <Text style={styles.primaryText}>
                  ▶ START {nextChapter.title}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                testID="home-btn"
                onPress={() => router.replace('/')}
                style={({ pressed }) => [
                  styles.primary,
                  pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] },
                ]}
              >
                <Text style={styles.primaryText}>◀ BACK TO MENU</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function StatBox({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}) {
  return (
    <View style={[styles.statBox, { borderColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={14} color="#000" />
      </View>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  eyebrow: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 10,
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: 8,
  },
  title: {
    fontFamily: FONT.display,
    color: C.white,
    fontSize: 28,
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: 6,
  },
  subtitle: {
    fontFamily: FONT.body,
    color: '#AAA',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 2,
  },
  gradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderWidth: 4,
    borderColor: '#000',
    marginTop: 18,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  gradeLeft: {
    padding: 4,
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#000',
  },
  gradeLabel: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 10,
    letterSpacing: 1,
  },
  gradeBig: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 48,
    marginTop: -4,
  },
  gradeScore: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  statBox: {
    width: '31%',
    borderWidth: 3,
    backgroundColor: '#000',
    padding: 6,
  },
  statIcon: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontFamily: FONT.display,
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 6,
  },
  statValue: {
    fontFamily: FONT.display,
    color: C.white,
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 12,
    letterSpacing: 2,
    marginTop: 22,
    marginBottom: 8,
  },
  flagsBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  flag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 2,
    borderColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  flagText: {
    fontFamily: FONT.body,
    color: '#000',
    fontSize: 14,
  },
  flagEmpty: {
    fontFamily: FONT.body,
    color: '#888',
    fontSize: 16,
  },
  log: {
    backgroundColor: '#000',
    borderWidth: 3,
    borderColor: '#333',
    padding: 10,
    gap: 6,
  },
  logItem: {
    flexDirection: 'row',
    gap: 8,
  },
  logAge: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 10,
    width: 60,
  },
  logText: {
    fontFamily: FONT.body,
    color: C.white,
    fontSize: 15,
    flex: 1,
  },
  actions: {
    marginTop: 22,
  },
  primary: {
    backgroundColor: C.green,
    borderWidth: 4,
    borderColor: '#000',
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  primaryText: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 13,
    letterSpacing: 2,
  },
});
