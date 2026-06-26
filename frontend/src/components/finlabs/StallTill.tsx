import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { C, FONT } from '@/src/ui/theme';
import { FL_GREEN } from '@/src/finlabs/storage';

export type TillStack = {
  value: number;
  max: number;
};

export const DEFAULT_TILL: TillStack[] = [
  { value: 1, max: 4 },
  { value: 2, max: 2 },
  { value: 5, max: 2 },
  { value: 10, max: 2 },
  { value: 20, max: 2 },
  { value: 50, max: 1 },
];

function coinColor(value: number) {
  if (value >= 20) return { bg: '#E8F5E9', border: FL_GREEN, text: '#1B4332' };
  if (value >= 10) return { bg: '#FFF9C4', border: '#F9A825', text: '#5D4037' };
  return { bg: '#ECEFF1', border: '#90A4AE', text: '#37474F' };
}

type Props = {
  typedChange: string;
  onChangeText: (t: string) => void;
  needed: number;
  pickedTotal: number;
  selected: number[];
  stacks: TillStack[];
  onTapCoin: (value: number) => void;
  onRemoveCoin: (index: number) => void;
  onClear: () => void;
  onGive: () => void;
  canGive: boolean;
  flashGreen?: boolean;
  shakeStyle?: object;
  hint?: string | null;
};

export default function StallTill({
  typedChange,
  onChangeText,
  needed,
  pickedTotal,
  selected,
  stacks,
  onTapCoin,
  onRemoveCoin,
  onClear,
  onGive,
  canGive,
  flashGreen,
  shakeStyle,
  hint,
}: Props) {
  const stackUsed = (value: number) => selected.filter((v) => v === value).length;

  return (
    <View style={styles.workbench}>
      {/* Register — change answer */}
      <View style={styles.register}>
        <View style={styles.registerScreen}>
          <Text style={styles.registerLabel}>CHANGE TO GIVE</Text>
          <View style={styles.registerInputRow}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              style={styles.registerInput}
              value={typedChange}
              onChangeText={(t) => onChangeText(t.replace(/[^\d]/g, ''))}
              keyboardType="number-pad"
              placeholder="?"
              placeholderTextColor="#555"
              maxLength={4}
              testID="change-input"
            />
          </View>
          <Text style={styles.registerHint}>
            {needed > 0 ? `Subtract: paid − order = ₹${needed}` : ''}
          </Text>
        </View>
        <View style={styles.registerTotals}>
          <Text style={styles.totalLine}>
            TARGET <Text style={styles.totalVal}>₹{needed}</Text>
          </Text>
          <Text style={[styles.totalLine, pickedTotal > needed && styles.totalBad]}>
            COINS <Text style={styles.totalVal}>₹{pickedTotal}</Text>
          </Text>
        </View>
      </View>

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      {/* Customer hand — selected change */}
      <View style={styles.handLabel}>
        <Text style={styles.handLabelText}>HAND TO CUSTOMER</Text>
      </View>
      <Animated.View
        style={[
          styles.handTray,
          flashGreen && styles.handTrayOk,
          shakeStyle,
        ]}
      >
        {selected.length === 0 ? (
          <Text style={styles.handEmpty}>Pick coins from the drawer ↓</Text>
        ) : (
          selected.map((v, i) => (
            <Pressable key={`${v}-${i}`} onPress={() => onRemoveCoin(i)} style={styles.handCoin}>
              <Text style={styles.handCoinText}>₹{v}</Text>
            </Pressable>
          ))
        )}
      </Animated.View>

      {/* Cash drawer */}
      <View style={styles.drawer}>
        <View style={styles.drawerHandle} />
        <Text style={styles.drawerLabel}>CASH DRAWER</Text>
        <View style={styles.coinGrid}>
          {stacks.map((stack) => {
            const used = stackUsed(stack.value);
            const left = stack.max - used;
            const colors = coinColor(stack.value);
            const isNote = stack.value >= 10;
            return (
              <Pressable
                key={stack.value}
                disabled={left <= 0}
                onPress={() => onTapCoin(stack.value)}
                style={({ pressed }) => [
                  styles.coinSlot,
                  isNote && styles.noteSlot,
                  { backgroundColor: colors.bg, borderColor: colors.border },
                  left <= 0 && styles.coinSlotEmpty,
                  pressed && left > 0 && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.coinValue, { color: colors.text }]}>₹{stack.value}</Text>
                <View style={styles.coinCount}>
                  <Text style={styles.coinCountText}>{left}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={onClear} style={({ pressed }) => [styles.clearBtn, pressed && styles.pressed]}>
          <Text style={styles.clearText}>CLEAR</Text>
        </Pressable>
        <Pressable
          disabled={!canGive}
          onPress={onGive}
          style={({ pressed }) => [
            styles.giveBtn,
            !canGive && styles.giveBtnOff,
            pressed && canGive && styles.pressed,
          ]}
        >
          <Text style={styles.giveText}>GIVE CHANGE ✓</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  workbench: {
    backgroundColor: '#141414',
    borderTopWidth: 4,
    borderTopColor: '#5D4037',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  register: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  registerScreen: {
    flex: 1,
    backgroundColor: '#0a1628',
    borderWidth: 3,
    borderColor: '#1e3a5f',
    padding: 10,
    borderRadius: 4,
  },
  registerLabel: {
    fontFamily: FONT.display,
    color: '#64B5F6',
    fontSize: 7,
    letterSpacing: 2,
    marginBottom: 4,
  },
  registerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rupee: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 22,
  },
  registerInput: {
    flex: 1,
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 32,
    padding: 0,
    minHeight: 40,
  },
  registerHint: {
    fontFamily: FONT.body,
    color: '#546E7A',
    fontSize: 12,
    marginTop: 4,
  },
  registerTotals: {
    width: 88,
    backgroundColor: '#111',
    borderWidth: 2,
    borderColor: '#333',
    padding: 8,
    justifyContent: 'center',
    gap: 6,
  },
  totalLine: {
    fontFamily: FONT.display,
    color: '#888',
    fontSize: 7,
    letterSpacing: 0.5,
  },
  totalVal: {
    color: FL_GREEN,
    fontSize: 11,
  },
  totalBad: { color: C.red },
  hint: {
    fontFamily: FONT.body,
    color: C.yellow,
    fontSize: 14,
    marginBottom: 6,
    textAlign: 'center',
  },
  handLabel: {
    marginBottom: 4,
  },
  handLabelText: {
    fontFamily: FONT.display,
    color: '#888',
    fontSize: 7,
    letterSpacing: 2,
  },
  handTray: {
    minHeight: 48,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#444',
    borderStyle: 'dashed',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  handTrayOk: {
    borderColor: C.green,
    borderStyle: 'solid',
    backgroundColor: 'rgba(46,204,113,0.12)',
  },
  handEmpty: {
    fontFamily: FONT.body,
    color: '#555',
    fontSize: 14,
    flex: 1,
    textAlign: 'center',
  },
  handCoin: {
    backgroundColor: '#FFF8E1',
    borderWidth: 2,
    borderColor: '#5D4037',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  handCoinText: {
    fontFamily: FONT.display,
    color: '#5D4037',
    fontSize: 9,
  },
  drawer: {
    backgroundColor: '#2a2a2a',
    borderWidth: 3,
    borderColor: '#1a1a1a',
    padding: 10,
    marginBottom: 10,
  },
  drawerHandle: {
    width: 40,
    height: 6,
    backgroundColor: '#555',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 6,
  },
  drawerLabel: {
    fontFamily: FONT.display,
    color: '#888',
    fontSize: 7,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },
  coinGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  coinSlot: {
    width: 56,
    height: 56,
    borderWidth: 3,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteSlot: {
    borderRadius: 6,
    width: 64,
    height: 48,
  },
  coinSlotEmpty: {
    opacity: 0.25,
  },
  coinValue: {
    fontFamily: FONT.display,
    fontSize: 10,
  },
  coinCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: FL_GREEN,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinCountText: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  clearBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#444',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#111',
  },
  clearText: {
    fontFamily: FONT.display,
    color: '#888',
    fontSize: 10,
  },
  giveBtn: {
    flex: 2,
    backgroundColor: FL_GREEN,
    borderWidth: 3,
    borderColor: '#000',
    paddingVertical: 12,
    alignItems: 'center',
  },
  giveBtnOff: {
    backgroundColor: '#333',
    borderColor: '#444',
    opacity: 0.5,
  },
  giveText: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 11,
    letterSpacing: 1,
  },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }] },
});
