import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import LearnTermsModal from '@/src/components/LearnTermsModal';
import { C, FONT, pixelShadow } from '@/src/ui/theme';

type Props = {
  compact?: boolean;
};

export default function LearnTermsButton({ compact = false }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable
        testID="learn-terms-button"
        accessibilityLabel="Learn a financial term"
        onPress={() => setVisible(true)}
        style={({ pressed }) => [
          styles.button,
          compact ? styles.buttonCompact : styles.buttonWide,
          pressed && styles.pressed,
        ]}
      >
        {compact ? (
          <MaterialCommunityIcons name="book-open-page-variant" size={16} color={C.black} />
        ) : (
          <Text style={styles.bookEmoji}>📖</Text>
        )}
      </Pressable>
      <LearnTermsModal visible={visible} onClose={() => setVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.yellow,
    borderWidth: 2,
    borderColor: '#000',
    ...pixelShadow(2),
  },
  buttonCompact: {
    width: 34,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWide: {
    width: 34,
    height: 34,
    borderColor: C.yellow,
    backgroundColor: '#FFE766',
    shadowOffset: { width: 3, height: 3 },
  },
  pressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    shadowOffset: { width: 1, height: 1 },
  },
  bookEmoji: {
    fontFamily: FONT.body,
    fontSize: 20,
    lineHeight: 22,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
