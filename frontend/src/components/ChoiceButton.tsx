import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { C, FONT } from '../ui/theme';
import { play } from '../game/audio';

type Props = {
  label: string;
  hint?: string;
  color?: string;
  onPress: () => void;
  testID?: string;
};

export default function ChoiceButton({ label, hint, color = C.green, onPress, testID }: Props) {
  const ty = useSharedValue(0);
  const tx = useSharedValue(0);

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.abs(ty.value) / 6,
  }));

  const handle = () => {
    tx.value = withSequence(withTiming(4, { duration: 60 }), withTiming(0, { duration: 80 }));
    ty.value = withSequence(withTiming(4, { duration: 60 }), withTiming(0, { duration: 80 }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    play('click');
    onPress();
  };

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.shadow, shadowStyle]} />
      <Animated.View style={[aStyle]}>
        <Pressable
          testID={testID}
          onPress={handle}
          style={[styles.btn, { backgroundColor: color }]}
        >
          <Text style={styles.label}>{label}</Text>
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  shadow: {
    position: 'absolute',
    left: 4,
    top: 4,
    right: -4,
    bottom: -4,
    backgroundColor: '#000',
  },
  btn: {
    borderWidth: 4,
    borderColor: C.black,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  label: {
    fontFamily: FONT.display,
    color: C.black,
    fontSize: 12,
    letterSpacing: 1,
  },
  hint: {
    fontFamily: FONT.body,
    color: C.black,
    fontSize: 16,
    marginTop: 2,
    opacity: 0.85,
  },
});
