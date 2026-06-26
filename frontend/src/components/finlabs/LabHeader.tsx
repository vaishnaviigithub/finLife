import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONT } from '@/src/ui/theme';
import { FL_BG, FL_GREEN } from '@/src/finlabs/storage';
import { play } from '@/src/game/audio';
import * as Haptics from 'expo-haptics';

type Props = {
  title: string;
  subtitle?: string;
  onBack: () => void;
};

export default function LabHeader({ title, subtitle, onBack }: Props) {
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.row}>
        <Pressable
          onPress={() => {
            play('click');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            onBack();
          }}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          testID="lab-back-btn"
        >
          <MaterialCommunityIcons name="arrow-left" size={18} color={FL_GREEN} />
        </Pressable>
        <View style={styles.titles}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: FL_BG,
    borderBottomWidth: 3,
    borderBottomColor: FL_GREEN,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: FL_GREEN,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ translateX: 1 }, { translateY: 1 }],
  },
  titles: {
    flex: 1,
  },
  title: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 13,
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: FONT.body,
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
});
