import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { C, FONT } from '@/src/ui/theme';
import { FL_GREEN, FL_YELLOW } from '@/src/finlabs/storage';
import { play } from '@/src/game/audio';

type ReadyProps = { onReady: () => void };

const demo = StyleSheet.create({
  phone: {
    alignItems: 'center',
    borderWidth: 3,
    borderColor: FL_YELLOW,
    backgroundColor: '#111',
    padding: 14,
    marginBottom: 10,
  },
  phoneEmoji: { fontSize: 36 },
  phonePrice: { fontFamily: FONT.display, color: FL_YELLOW, fontSize: 14, marginTop: 6 },
  hint: { fontFamily: FONT.display, color: '#666', fontSize: 7, marginTop: 8, letterSpacing: 1 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center', minHeight: 52 },
  tile: {
    borderWidth: 2,
    borderColor: FL_GREEN,
    backgroundColor: '#0a1a12',
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  tileText: { fontFamily: FONT.display, color: FL_GREEN, fontSize: 7 },
  btn: {
    borderWidth: 2,
    borderColor: FL_GREEN,
    backgroundColor: '#0a1a12',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnActive: { backgroundColor: FL_GREEN },
  btnText: { fontFamily: FONT.display, color: FL_GREEN, fontSize: 8, letterSpacing: 0.5 },
  btnTextActive: { color: '#000' },
  result: {
    borderLeftWidth: 4,
    borderLeftColor: FL_GREEN,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333',
    padding: 10,
    marginTop: 10,
  },
  resultLine: { fontFamily: 'VT323', color: '#ddd', fontSize: 18, lineHeight: 22 },
  resultBad: { fontFamily: FONT.display, color: C.red, fontSize: 9, marginTop: 6 },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingVertical: 6,
  },
  billLabel: { fontFamily: FONT.body, color: '#aaa', fontSize: 15 },
  billVal: { fontFamily: FONT.display, color: FL_GREEN, fontSize: 10 },
  billTotal: { fontFamily: FONT.display, color: C.red, fontSize: 11 },
  forkRow: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  forkCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#444',
    padding: 8,
    alignItems: 'center',
    backgroundColor: '#111',
  },
  forkSelected: { borderColor: FL_GREEN, backgroundColor: '#0a1a12' },
  forkEmoji: { fontSize: 22 },
  forkLabel: { fontFamily: FONT.display, color: '#ccc', fontSize: 7, marginTop: 4, textAlign: 'center' },
  docRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginVertical: 8 },
  docChip: {
    borderWidth: 2,
    borderColor: '#555',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#111',
  },
  docOn: { borderColor: FL_GREEN, backgroundColor: '#0a1a12' },
  docText: { fontFamily: FONT.display, color: '#888', fontSize: 7 },
  docTextOn: { color: FL_GREEN },
  rateCard: {
    borderWidth: 2,
    borderColor: FL_YELLOW,
    padding: 10,
    backgroundColor: '#111',
    marginVertical: 8,
  },
  rateLine: { fontFamily: 'VT323', color: '#ccc', fontSize: 18, lineHeight: 24 },
  progressTrack: {
    height: 8,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: FL_GREEN,
  },
});

export function EmiSplitDemo({ onReady }: ReadyProps) {
  const [tiles, setTiles] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const pulse = useSharedValue(1);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 500 }), withTiming(1, { duration: 500 })),
      -1,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const split = () => {
    if (tiles >= 12 || revealed) return;
    play('tick');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTiles((t) => t + 1);
  };

  const revealTotal = () => {
    play('coin');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    setRevealed(true);
    onReady();
  };

  const pct = Math.round((tiles / 12) * 100);

  return (
    <View>
      <Animated.View style={pulseStyle}>
        <Pressable onPress={split} disabled={tiles >= 12} style={demo.phone}>
          <Text style={demo.phoneEmoji}>📱</Text>
          <Text style={demo.phonePrice}>
            {tiles >= 12 ? 'SPLIT!' : '₹15,000 PHONE'}
          </Text>
          <Text style={demo.hint}>
            {tiles < 12 ? `TAP RAPIDLY TO SPLIT (${tiles}/12)` : 'ALL 12 PIECES OUT ✓'}
          </Text>
        </Pressable>
      </Animated.View>

      <View style={demo.progressTrack}>
        <View style={[demo.progressFill, { width: `${pct}%` }]} />
      </View>

      <View style={demo.tileGrid}>
        {Array.from({ length: tiles }).map((_, i) => (
          <Animated.View key={i} entering={FadeInDown.duration(150)} style={demo.tile}>
            <Text style={demo.tileText}>₹1,334</Text>
          </Animated.View>
        ))}
      </View>

      {tiles >= 12 && !revealed ? (
        <Pressable onPress={revealTotal} style={[demo.btn, demo.btnActive]}>
          <Text style={[demo.btnText, demo.btnTextActive]}>SEE TOTAL DAMAGE ▶</Text>
        </Pressable>
      ) : null}

      {revealed ? (
        <Animated.View entering={FadeIn.duration(300)} style={demo.result}>
          <Text style={demo.resultLine}>₹1,334 × 12 = ₹16,008</Text>
          <Text style={demo.resultBad}>+₹1,008 EXTRA JUST TO SPLIT IT</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

export function EmiHiddenCostDemo({ onReady }: ReadyProps) {
  const [step, setStep] = useState(0);
  const base = 15000;
  const fee = 499;
  const gst = 89.82;
  const total = base + fee + gst;

  const addFee = () => {
    if (step !== 0) return;
    play('tick');
    setStep(1);
  };
  const addGst = () => {
    if (step !== 1) return;
    play('tick');
    setStep(2);
  };
  const reveal = () => {
    if (step !== 2) return;
    play('bad');
    setStep(3);
    onReady();
  };

  return (
    <View>
      <View style={demo.result}>
        <View style={demo.billRow}>
          <Text style={demo.billLabel}>Phone MRP</Text>
          <Text style={demo.billVal}>₹{base.toLocaleString('en-IN')}</Text>
        </View>
        {step >= 1 ? (
          <Animated.View entering={FadeInDown} style={demo.billRow}>
            <Text style={demo.billLabel}>+ Processing fee</Text>
            <Text style={demo.billVal}>₹{fee.toFixed(2)}</Text>
          </Animated.View>
        ) : null}
        {step >= 2 ? (
          <Animated.View entering={FadeInDown} style={demo.billRow}>
            <Text style={demo.billLabel}>+ GST on fee</Text>
            <Text style={demo.billVal}>₹{gst.toFixed(2)}</Text>
          </Animated.View>
        ) : null}
        {step >= 3 ? (
          <Animated.View entering={FadeInDown} style={[demo.billRow, { borderBottomWidth: 0 }]}>
            <Text style={[demo.billLabel, { color: C.red }]}>BEFORE EMI STARTS</Text>
            <Text style={demo.billTotal}>₹{total.toFixed(2)}</Text>
          </Animated.View>
        ) : null}
      </View>
      {step === 0 ? (
        <Pressable onPress={addFee} style={demo.btn}>
          <Text style={demo.btnText}>+ ADD PROCESSING FEE ▶</Text>
        </Pressable>
      ) : null}
      {step === 1 ? (
        <Pressable onPress={addGst} style={demo.btn}>
          <Text style={demo.btnText}>+ ADD GST ON FEE ▶</Text>
        </Pressable>
      ) : null}
      {step === 2 ? (
        <Pressable onPress={reveal} style={[demo.btn, demo.btnActive]}>
          <Text style={[demo.btnText, demo.btnTextActive]}>SHOW TRUE TOTAL ▶</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function BankFlowDemo({ onReady }: ReadyProps) {
  const [step, setStep] = useState(0);
  const steps = ['YOUR ₹', 'GOES TO BANK', 'BANK LENDS IT', 'YOU GET INTEREST'];
  const tap = () => {
    play('tick');
    const n = step + 1;
    setStep(n);
    if (n >= steps.length) onReady();
  };
  return (
    <View>
      <View style={demo.forkRow}>
        {steps.map((s, i) => (
          <View
            key={s}
            style={[demo.forkCard, i <= step && demo.forkSelected]}
          >
            <Text style={demo.forkEmoji}>{i === 0 ? '💵' : i === 1 ? '🏦' : i === 2 ? '📈' : '🪙'}</Text>
            <Text style={[demo.forkLabel, i <= step && { color: FL_GREEN }]}>{s}</Text>
          </View>
        ))}
      </View>
      {step < steps.length ? (
        <Pressable onPress={tap} style={demo.btn}>
          <Text style={demo.btnText}>NEXT STEP ▶ ({step}/{steps.length})</Text>
        </Pressable>
      ) : (
        <Text style={[demo.hint, { color: FL_GREEN, textAlign: 'center' }]}>✓ FLOW COMPLETE</Text>
      )}
    </View>
  );
}

export function KycDocDemo({ onReady }: ReadyProps) {
  const docs = [
    { id: 'aadhaar', label: 'AADHAAR', tip: 'Identity + address proof' },
    { id: 'pan', label: 'PAN', tip: 'Links to tax records' },
    { id: 'photo', label: 'PHOTO', tip: 'Face verification' },
  ];
  const [on, setOn] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    play('click');
    const next = new Set(on);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOn(next);
    if (next.size === docs.length) onReady();
  };
  return (
    <View>
      <Text style={demo.hint}>TAP EACH DOC TO LEARN WHY THE BANK NEEDS IT</Text>
      <View style={demo.docRow}>
        {docs.map((d) => (
          <Pressable key={d.id} onPress={() => toggle(d.id)} style={[demo.docChip, on.has(d.id) && demo.docOn]}>
            <Text style={[demo.docText, on.has(d.id) && demo.docTextOn]}>{d.label}</Text>
          </Pressable>
        ))}
      </View>
      {docs.filter((d) => on.has(d.id)).map((d) => (
        <Animated.View key={d.id} entering={FadeInDown} style={demo.result}>
          <Text style={demo.resultLine}>{d.label} → {d.tip}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

export function OpportunityForkDemo({ onReady }: ReadyProps) {
  const [pick, setPick] = useState<'movie' | 'home' | null>(null);
  const choose = (p: 'movie' | 'home') => {
    play('click');
    setPick(p);
    onReady();
  };
  return (
    <View>
      <Text style={[demo.hint, { textAlign: 'center', marginBottom: 6 }]}>₹350 FORK — TAP A PATH</Text>
      <View style={demo.forkRow}>
        <Pressable onPress={() => choose('movie')} style={[demo.forkCard, pick === 'movie' && demo.forkSelected]}>
          <Text style={demo.forkEmoji}>🎬</Text>
          <Text style={demo.forkLabel}>MOVIE{'\n'}Mood +8 · Wallet −350</Text>
        </Pressable>
        <Pressable onPress={() => choose('home')} style={[demo.forkCard, pick === 'home' && demo.forkSelected]}>
          <Text style={demo.forkEmoji}>🏠</Text>
          <Text style={demo.forkLabel}>STAY HOME{'\n'}Mood −3 · Wallet same</Text>
        </Pressable>
      </View>
      {pick ? (
        <Animated.View entering={FadeIn} style={demo.result}>
          <Text style={demo.resultLine}>
            {pick === 'movie'
              ? 'You traded ₹350 for fun + friends. That trade-off is opportunity cost.'
              : 'You saved ₹350 but lost some mood + social time. Also a real cost.'}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

export function SocialMeterDemo({ onReady }: ReadyProps) {
  const [val, setVal] = useState(40);
  const [tapped, setTapped] = useState(0);
  const pump = () => {
    play('tick');
    setVal((v) => Math.min(100, v + 15));
    const n = tapped + 1;
    setTapped(n);
    if (n >= 4) onReady();
  };
  const drain = () => {
    play('bad');
    setVal((v) => Math.max(0, v - 15));
    const n = tapped + 1;
    setTapped(n);
    if (n >= 4) onReady();
  };
  return (
    <View>
      <Text style={[demo.hint, { marginBottom: 6 }]}>👥 SOCIAL {val}/100</Text>
      <View style={{ height: 12, backgroundColor: '#222', borderWidth: 1, borderColor: '#444' }}>
        <View style={{ height: '100%', width: `${val}%`, backgroundColor: C.blue }} />
      </View>
      <View style={demo.forkRow}>
        <Pressable onPress={pump} style={demo.btn}>
          <Text style={demo.btnText}>SAY YES (+SOCIAL)</Text>
        </Pressable>
        <Pressable onPress={drain} style={[demo.btn, { borderColor: C.red }]}>
          <Text style={[demo.btnText, { color: C.red }]}>SKIP (−SOCIAL)</Text>
        </Pressable>
      </View>
      <Text style={demo.hint}>TAP 4 TIMES TOTAL ({tapped}/4)</Text>
    </View>
  );
}

export function RateBuilderDemo({ onReady }: ReadyProps) {
  const [hrs, setHrs] = useState(0);
  const [rate, setRate] = useState(0);
  const price = Math.round(hrs * rate * 1.2);
  React.useEffect(() => {
    if (hrs >= 2 && rate >= 300) onReady();
  }, [hrs, rate, onReady]);
  return (
    <View style={demo.rateCard}>
      <Text style={demo.rateLine}>Hours: {hrs || '?'}  ×  Rate: ₹{rate || '?'}/hr  ×  1.2 buffer</Text>
      <Text style={[demo.resultBad, { color: FL_YELLOW }]}>= ₹{price || '???'} per poster</Text>
      <View style={demo.forkRow}>
        <Pressable onPress={() => { play('tick'); setHrs(2); }} style={[demo.btn, hrs > 0 && demo.btnActive]}>
          <Text style={[demo.btnText, hrs > 0 && demo.btnTextActive]}>2 HOURS</Text>
        </Pressable>
        <Pressable onPress={() => { play('tick'); setRate(300); }} style={[demo.btn, rate > 0 && demo.btnActive]}>
          <Text style={[demo.btnText, rate > 0 && demo.btnTextActive]}>₹300/HR</Text>
        </Pressable>
      </View>
      {hrs >= 2 && rate >= 300 ? (
        <Text style={[demo.hint, { color: FL_GREEN }]}>✓ ₹720 — fair quote unlocked</Text>
      ) : (
        <Text style={demo.hint}>SET BOTH VALUES</Text>
      )}
    </View>
  );
}

export function GstSplitDemo({ onReady }: ReadyProps) {
  const [step, setStep] = useState(0);
  const sub = 810;
  const half = 20.25;
  const advance = () => {
    play('tick');
    const n = step + 1;
    setStep(n);
    if (n >= 3) onReady();
  };
  return (
    <View>
      <Pressable onPress={advance} disabled={step >= 3} style={demo.btn}>
        <Text style={demo.btnText}>
          {step === 0 ? 'START WITH SUBTOTAL ₹810 ▶' :
           step === 1 ? 'ADD CGST 2.5% ▶' :
           step === 2 ? 'ADD SGST 2.5% ▶' : '✓ BILL COMPLETE'}
        </Text>
      </Pressable>
      {step >= 1 ? (
        <Animated.View entering={FadeInDown} style={demo.billRow}>
          <Text style={demo.billLabel}>CGST @ 2.5%</Text>
          <Text style={demo.billVal}>₹{half.toFixed(2)}</Text>
        </Animated.View>
      ) : null}
      {step >= 2 ? (
        <Animated.View entering={FadeInDown} style={demo.billRow}>
          <Text style={demo.billLabel}>SGST @ 2.5%</Text>
          <Text style={demo.billVal}>₹{half.toFixed(2)}</Text>
        </Animated.View>
      ) : null}
      {step >= 3 ? (
        <Animated.View entering={FadeInDown} style={demo.result}>
          <Text style={demo.resultLine}>TOTAL = ₹810 + ₹20.25 + ₹20.25 = ₹850.50</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

export function ServiceChargeDemo({ onReady }: ReadyProps) {
  const [removed, setRemoved] = useState(false);
  return (
    <View>
      <View style={[demo.result, { borderLeftColor: C.red }]}>
        <View style={demo.billRow}>
          <Text style={demo.billLabel}>Service Charge 10%</Text>
          <Text style={[demo.billVal, { color: removed ? '#555' : C.red, textDecorationLine: removed ? 'line-through' : 'none' }]}>
            ₹117.00
          </Text>
        </View>
      </View>
      <Pressable
        onPress={() => { play('coin'); setRemoved(true); onReady(); }}
        style={[demo.btn, removed && demo.btnActive]}
      >
        <Text style={[demo.btnText, removed && demo.btnTextActive]}>
          {removed ? '✓ REMOVED — YOUR RIGHT!' : 'TAP TO REFUSE SERVICE CHARGE ▶'}
        </Text>
      </Pressable>
    </View>
  );
}
