import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { C, FONT } from '../ui/theme';
import { Term } from '../game/types';
import { play } from '../game/audio';

type Props = {
  terms: Term[];
  onContinue: () => void;
};

/**
 * CONCEPT PRIMER screen — shown before SITUATION.
 * Reusable across every scenario that supplies a `terms` array.
 * Layout:
 *  - Small yellow uppercase header "BEFORE YOU DECIDE"
 *  - One mini-card per term (name large + definition below), divided by a
 *    thin line — all part of ONE continuous card, not boxed individually.
 *  - Full-width green button at the bottom.
 *  - No icons. Text only, generous spacing.
 */
export default function PrimerScreen({ terms, onContinue }: Props) {
  return (
    <View style={styles.root} testID="primer-screen">
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.header} testID="primer-header">BEFORE YOU DECIDE</Text>

          <Animated.View entering={FadeInDown.duration(350)} style={styles.card} testID="primer-card">
            {terms.map((t, i) => (
              <View key={t.name} testID={`primer-term-${i}`}>
                {i > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.termBlock}>
                  <Text style={styles.termName} testID={`primer-term-name-${i}`}>{t.name}</Text>
                  <Text style={styles.termDef} testID={`primer-term-def-${i}`}>{t.definition}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            testID="primer-got-it-btn"
            onPress={() => {
              play('click');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              onContinue();
            }}
            style={({ pressed }) => [
              styles.button,
              pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] },
            ]}
          >
            <Text style={styles.buttonText}>GOT IT  →</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: {
    padding: 24,
    paddingTop: 36,
    paddingBottom: 24,
  },
  header: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 12,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 28,
  },
  card: {
    backgroundColor: C.bg2,
    borderLeftWidth: 3,
    borderLeftColor: C.yellow,
    paddingHorizontal: 22,
    paddingVertical: 8,
  },
  termBlock: {
    paddingVertical: 22,
  },
  termName: {
    fontFamily: FONT.display,
    color: C.white,
    fontSize: 20,
    letterSpacing: 1,
    marginBottom: 12,
  },
  termDef: {
    fontFamily: FONT.body,
    color: '#BFBFBF',
    fontSize: 19,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#3A3A3A',
    marginHorizontal: 0,
  },
  footer: {
    padding: 18,
    paddingTop: 8,
  },
  button: {
    backgroundColor: C.green,
    borderWidth: 4,
    borderColor: '#000',
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  buttonText: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 14,
    letterSpacing: 2,
  },
});
