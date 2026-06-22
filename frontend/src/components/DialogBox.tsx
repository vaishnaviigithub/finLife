import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, FONT } from '../ui/theme';

type Props = {
  speaker?: string;
  text: string;
};

export default function DialogBox({ speaker, text }: Props) {
  return (
    <View style={styles.shadow} testID="dialog-box">
      <View style={styles.box}>
        {speaker ? (
          <View style={styles.tab}>
            <Text style={styles.tabText}>{speaker}</Text>
          </View>
        ) : null}
        <Text style={styles.text}>{text}</Text>
        <View style={styles.tri} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  box: {
    backgroundColor: C.white,
    borderWidth: 4,
    borderColor: C.black,
    padding: 16,
    paddingTop: 18,
    minHeight: 110,
  },
  tab: {
    position: 'absolute',
    top: -16,
    left: 12,
    backgroundColor: C.yellow,
    borderWidth: 4,
    borderColor: C.black,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  tabText: {
    fontFamily: FONT.display,
    color: C.black,
    fontSize: 10,
    letterSpacing: 1,
  },
  text: {
    fontFamily: FONT.body,
    color: C.black,
    fontSize: 20,
    lineHeight: 22,
  },
  tri: {
    position: 'absolute',
    right: 12,
    bottom: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: C.black,
  },
});
