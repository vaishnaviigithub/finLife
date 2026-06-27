import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { C, FONT } from '@/src/ui/theme';
import { FL_GREEN, FL_YELLOW } from '@/src/finlabs/storage';
import { play } from '@/src/game/audio';

type FieldKey = 'sub' | 'cgst' | 'sgst' | 'total';

type Item = { label: string; price: number };

type Props = {
  items: Item[];
  answers: Record<FieldKey, number>;
  tolerance?: number;
  onComplete: (score: number) => void;
};

const FIELDS: { key: FieldKey; label: string; hint: string }[] = [
  { key: 'sub', label: 'FOOD SUBTOTAL', hint: 'Add all food items' },
  { key: 'cgst', label: 'CGST @ 2.5%', hint: 'Subtotal × 2.5 ÷ 100' },
  { key: 'sgst', label: 'SGST @ 2.5%', hint: 'Same as CGST' },
  { key: 'total', label: 'TOTAL PAYABLE', hint: 'Subtotal + CGST + SGST' },
];

function near(n: number, t: number, tol: number) {
  return Math.abs(n - t) <= tol;
}

export default function GstBillCalculator({ items, answers, tolerance = 1, onComplete }: Props) {
  const [active, setActive] = useState<FieldKey>('sub');
  const [values, setValues] = useState<Record<FieldKey, string>>({
    sub: '', cgst: '', sgst: '', total: '',
  });
  const [checked, setChecked] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [checkedAll, setCheckedAll] = useState(false);

  const display = values[active] || '0';

  const validateField = (key: FieldKey, val: string): boolean => {
    const n = parseFloat(val) || 0;
    return near(n, answers[key], tolerance);
  };

  const checkField = (key: FieldKey) => {
    const val = values[key];
    if (!val.trim()) return;
    const ok = validateField(key, val);
    setChecked((c) => ({ ...c, [key]: ok }));
    if (ok) {
      play('coin');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      play('bad');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const pressKey = (k: string) => {
    play('tick');
    setChecked((c) => ({ ...c, [active]: undefined }));
    setValues((v) => {
      const cur = v[active];
      if (k === 'C') return { ...v, [active]: '' };
      if (k === '⌫') return { ...v, [active]: cur.slice(0, -1) };
      if (k === '.' && cur.includes('.')) return v;
      if (k === '.' && !cur) return { ...v, [active]: '0.' };
      return { ...v, [active]: cur + k };
    });
  };

  const fieldStatus = (key: FieldKey) => {
    if (checked[key] === undefined) return 'idle';
    return checked[key] ? 'ok' : 'bad';
  };

  const allFilled = FIELDS.every((f) => values[f.key].trim().length > 0);
  const allOk = FIELDS.every((f) => checked[f.key] === true);

  const runCheckBill = () => {
    const next: Partial<Record<FieldKey, boolean>> = {};
    let okCount = 0;
    FIELDS.forEach((f) => {
      const ok = validateField(f.key, values[f.key]);
      next[f.key] = ok;
      if (ok) okCount += 1;
    });
    setChecked(next);
    setCheckedAll(true);
    if (okCount === 4) {
      play('win');
      setTimeout(() => onComplete(3), 600);
    } else if (okCount >= 2) {
      play('coin');
    } else {
      play('bad');
    }
  };

  const KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '.', '⌫'];

  return (
    <View style={styles.root}>
      <View style={styles.receipt}>
        <Text style={styles.receiptTitle}>🧾 YOUR BILL</Text>
        {items.map((it) => (
          <View key={it.label} style={styles.itemRow}>
            <Text style={styles.itemName}>{it.label}</Text>
            <Text style={styles.itemPrice}>Rs {it.price}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        {FIELDS.map((f) => {
          const st = fieldStatus(f.key);
          return (
            <Pressable
              key={f.key}
              onPress={() => { play('click'); setActive(f.key); }}
              style={[
                styles.fieldRow,
                active === f.key && styles.fieldRowActive,
                st === 'ok' && styles.fieldRowOk,
                st === 'bad' && styles.fieldRowBad,
              ]}
            >
              <Text style={styles.fieldLabel}>{f.label}</Text>
              <Text style={styles.fieldVal}>
                Rs {values[f.key] || '—'}
              </Text>
              {st === 'ok' ? <Text style={styles.fieldMark}>✓</Text> : null}
              {st === 'bad' ? <Text style={styles.fieldMarkBad}>✗</Text> : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.calc}>
        <Text style={styles.calcHint}>{FIELDS.find((f) => f.key === active)?.hint}</Text>
        <View style={styles.display}>
          <Text style={styles.displayLabel}>{FIELDS.find((f) => f.key === active)?.label}</Text>
          <Text style={styles.displayVal}>Rs {display || '0'}</Text>
        </View>

        <View style={styles.keypad}>
          {KEYS.map((k) => (
            <Pressable
              key={k}
              onPress={() => pressKey(k)}
              style={[styles.key, (k === 'C' || k === '⌫') && styles.keyFn]}
            >
              <Text style={[styles.keyText, (k === 'C' || k === '⌫') && styles.keyTextFn]}>{k}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.calcActions}>
          <Pressable onPress={() => checkField(active)} style={styles.enterBtn}>
            <Text style={styles.enterText}>ENTER ↵</Text>
          </Pressable>
          <Pressable
            disabled={!allFilled}
            onPress={runCheckBill}
            style={[styles.checkBtn, !allFilled && styles.checkBtnOff]}
          >
            <Text style={styles.checkText}>CHECK BILL ▶</Text>
          </Pressable>
        </View>
        {checkedAll && !allOk ? (
          <Text style={styles.fixHint}>Fix red rows — tap a row, use keypad, press ENTER</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  receipt: {
    borderWidth: 2,
    borderColor: '#444',
    backgroundColor: '#111',
    padding: 12,
    marginBottom: 10,
  },
  receiptTitle: {
    fontFamily: FONT.display,
    color: FL_YELLOW,
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 8,
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemName: { fontFamily: FONT.body, color: '#bbb', fontSize: 20 },
  itemPrice: { fontFamily: FONT.body, color: '#ddd', fontSize: 20 },
  divider: { height: 2, backgroundColor: '#333', marginVertical: 8 },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 4,
    backgroundColor: '#0a0a0a',
  },
  fieldRowActive: { borderColor: FL_GREEN, backgroundColor: '#0a1a12' },
  fieldRowOk: { borderColor: C.green, backgroundColor: '#0a1a10' },
  fieldRowBad: { borderColor: C.red, backgroundColor: '#1a0808' },
  fieldLabel: { fontFamily: FONT.display, color: '#888', fontSize: 7, flex: 1 },
  fieldVal: { fontFamily: FONT.body, color: FL_GREEN, fontSize: 22, marginRight: 8 },
  fieldMark: { fontFamily: FONT.display, color: C.green, fontSize: 14 },
  fieldMarkBad: { fontFamily: FONT.display, color: C.red, fontSize: 14 },
  calc: {
    borderWidth: 3,
    borderColor: '#333',
    backgroundColor: '#1a1a1a',
    padding: 10,
  },
  calcHint: {
    fontFamily: FONT.body,
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 6,
  },
  display: {
    backgroundColor: '#050505',
    borderWidth: 2,
    borderColor: FL_GREEN,
    padding: 12,
    marginBottom: 10,
  },
  displayLabel: { fontFamily: FONT.display, color: '#666', fontSize: 7, letterSpacing: 1 },
  displayVal: {
    fontFamily: FONT.body,
    color: FL_YELLOW,
    fontSize: 36,
    textAlign: 'right',
    letterSpacing: 2,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  key: {
    width: '22%',
    minWidth: 64,
    aspectRatio: 1.4,
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#444',
    borderBottomWidth: 4,
    borderBottomColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyFn: { backgroundColor: '#3a2a10', borderColor: '#554420' },
  keyText: { fontFamily: FONT.body, color: '#fff', fontSize: 24 },
  keyTextFn: { color: FL_YELLOW, fontSize: 18 },
  calcActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  enterBtn: {
    flex: 1,
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: '#555',
    paddingVertical: 14,
    alignItems: 'center',
  },
  enterText: { fontFamily: FONT.display, color: '#ccc', fontSize: 10 },
  checkBtn: {
    flex: 1.4,
    backgroundColor: FL_GREEN,
    borderWidth: 3,
    borderColor: '#000',
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkBtnOff: { opacity: 0.4, backgroundColor: '#444' },
  checkText: { fontFamily: FONT.display, color: '#000', fontSize: 10 },
  fixHint: {
    fontFamily: FONT.body,
    color: C.yellow,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
});
