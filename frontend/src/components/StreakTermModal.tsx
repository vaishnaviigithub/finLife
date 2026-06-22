import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { C, FONT } from '@/src/ui/theme';
import { FinancialTerm } from '@/src/game/streaks';
import { play } from '@/src/game/audio';

type Props = {
  visible: boolean;
  term: FinancialTerm;
  onComplete: () => void;
};

export default function StreakTermModal({ visible, term, onComplete }: Props) {
  const [showTerm, setShowTerm] = useState(false);

  useEffect(() => {
    if (visible) setShowTerm(false);
  }, [visible, term.id]);

  const handlePrompt = () => {
    play('coin');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setShowTerm(true);
  };

  const handleDone = () => {
    play('win');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setShowTerm(false);
    onComplete();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
      testID="streak-modal"
    >
      <View style={styles.backdrop}>
        <Animated.View entering={FadeInDown.duration(220)} style={styles.sheet}>
          {!showTerm ? (
            <>
              <Text style={styles.fire}>🔥</Text>
              <Text style={styles.title}>COMPLETE YOUR STREAK!</Text>
              <Text style={styles.body}>
                Learn a new financial term to keep your streak going.
              </Text>
              <Pressable
                testID="streak-prompt-yes"
                onPress={handlePrompt}
                style={({ pressed }) => [
                  styles.btnPrimary,
                  pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] },
                ]}
              >
                <Text style={styles.btnPrimaryText}>YES!</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.eyebrow}>WORD OF THE DAY</Text>
              <Text style={styles.termTitle}>
                {term.word} {term.emoji}
              </Text>
              <View style={styles.termCard}>
                <Text style={styles.termMeaning}>{term.meaning}</Text>
              </View>
              <Pressable
                testID="streak-term-done"
                onPress={handleDone}
                style={({ pressed }) => [
                  styles.btnPrimary,
                  pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] },
                ]}
              >
                <Text style={styles.btnPrimaryText}>OKAY!</Text>
              </Pressable>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1A1A1A',
    borderTopWidth: 4,
    borderColor: C.orange,
    padding: 22,
    gap: 12,
    alignItems: 'center',
  },
  fire: {
    fontSize: 36,
    marginBottom: 4,
  },
  title: {
    fontFamily: FONT.display,
    color: C.orange,
    fontSize: 16,
    letterSpacing: 2,
    textAlign: 'center',
  },
  eyebrow: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 10,
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
  termTitle: {
    fontFamily: FONT.display,
    color: C.white,
    fontSize: 24,
    letterSpacing: 1,
    textAlign: 'center',
  },
  termCard: {
    backgroundColor: '#FFF',
    borderWidth: 4,
    borderColor: '#000',
    padding: 18,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  termMeaning: {
    fontFamily: FONT.body,
    color: '#000',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
  },
  btnPrimary: {
    backgroundColor: C.orange,
    borderWidth: 4,
    borderColor: '#000',
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  btnPrimaryText: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 14,
    letterSpacing: 2,
  },
});
