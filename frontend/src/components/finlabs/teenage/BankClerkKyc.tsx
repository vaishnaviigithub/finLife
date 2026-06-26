import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { C, FONT } from '@/src/ui/theme';
import { FL_GREEN, FL_YELLOW } from '@/src/finlabs/storage';
import { play } from '@/src/game/audio';
import ArtifactImage from '@/src/components/ArtifactImage';
import { ARTIFACTS } from '@/src/game/artifacts';

export type BankDoc = {
  id: string;
  label: string;
  emoji: string;
  ok: boolean;
  why: string;
};

export const BANK_DOCS: BankDoc[] = [
  { id: 'aadhaar', label: 'Aadhaar Card', emoji: '🪪', ok: true, why: '' },
  { id: 'school', label: 'School ID', emoji: '🎓', ok: true, why: '' },
  { id: 'photo', label: 'Passport Photo', emoji: '📸', ok: true, why: '' },
  { id: 'birth', label: 'Birth Certificate', emoji: '📜', ok: true, why: '' },
  { id: 'salary', label: 'Salary Slip', emoji: '💰', ok: false, why: "You're a student — no salary slip needed!" },
  { id: 'voter', label: 'Voter ID', emoji: '🗳️', ok: false, why: 'Voter ID is for 18+ only.' },
  { id: 'pan', label: 'PAN Card', emoji: '🆔', ok: false, why: 'Helpful later, but not required for student KYC.' },
  { id: 'bill', label: 'Electricity Bill', emoji: '💡', ok: false, why: 'Address proof — Aadhaar already covers this.' },
];

type ClerkLine = {
  id: string;
  text: string;
  accept?: string;
  hint?: string;
  isGuardian?: boolean;
};

const CLERK_SCRIPT: ClerkLine[] = [
  {
    id: 'welcome',
    text: "Namaste! I'm Priya, branch clerk. Student savings account — let's verify your KYC documents one by one.",
  },
  {
    id: 'aadhaar',
    text: 'Step 1 — Proof of identity. Please hand me your Aadhaar card.',
    accept: 'aadhaar',
    hint: 'Proves who you are + your address',
  },
  {
    id: 'school',
    text: "Step 2 — Proof you're a student. School ID please!",
    accept: 'school',
    hint: "Shows you're enrolled at school",
  },
  {
    id: 'photo',
    text: 'Step 3 — One passport-size photo for our records.',
    accept: 'photo',
    hint: 'Face verification on file',
  },
  {
    id: 'birth',
    text: "Step 4 — Birth certificate. Required because you're under 18.",
    accept: 'birth',
    hint: 'Confirms your age for a minor account',
  },
  {
    id: 'guardian',
    text: "Since you're a minor, a parent must be joint account holder. Is your guardian with you today?",
    isGuardian: true,
  },
  {
    id: 'done',
    text: 'Perfect! All documents verified. Stamping your application now...',
  },
];

type Props = {
  bankName: string;
  onComplete: () => void;
};

export default function BankClerkKyc({ bankName, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [handed, setHanded] = useState<string[]>([]);
  const [rejectMsg, setRejectMsg] = useState('');
  const [stamp, setStamp] = useState(false);
  const [guardianOk, setGuardianOk] = useState(false);

  const line = CLERK_SCRIPT[step];
  const needDoc = line?.accept;
  const docSteps = CLERK_SCRIPT.filter((l) => l.accept).length;
  const docsDone = handed.length;

  useEffect(() => {
    if (step === 0) play('whoosh');
  }, []);

  useEffect(() => {
    if (step === CLERK_SCRIPT.length - 1 && !stamp) {
      const t = setTimeout(() => {
        setStamp(true);
        play('win');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setTimeout(onComplete, 1400);
      }, 900);
      return () => clearTimeout(t);
    }
  }, [step, stamp, onComplete]);

  const advance = () => {
    play('tick');
    setRejectMsg('');
    setStep((s) => Math.min(s + 1, CLERK_SCRIPT.length - 1));
  };

  const submitDoc = (docId: string) => {
    const doc = BANK_DOCS.find((d) => d.id === docId);
    if (!doc) return;

    if (needDoc && docId !== needDoc) {
      play('bad');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setRejectMsg(doc.ok ? `Not yet — I asked for ${BANK_DOCS.find((d) => d.id === needDoc)?.label}` : doc.why);
      return;
    }

    if (!doc.ok) {
      play('bad');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setRejectMsg(doc.why);
      return;
    }

    if (handed.includes(docId)) {
      setRejectMsg('You already gave me that one!');
      return;
    }

    play('coin');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setRejectMsg('');
    setHanded((h) => [...h, docId]);
    setTimeout(advance, 500);
  };

  const confirmGuardian = () => {
    play('coin');
    setGuardianOk(true);
    setTimeout(advance, 400);
  };

  const progressPct = Math.round(((guardianOk ? docsDone + 1 : docsDone) / (docSteps + 1)) * 100);

  return (
    <View style={styles.root}>
      <View style={styles.branchBanner}>
        <ArtifactImage source={ARTIFACTS.building} size={32} />
        <View style={{ flex: 1 }}>
          <Text style={styles.branchName}>{bankName.toUpperCase()} BRANCH</Text>
          <Text style={styles.branchSub}>Counter 3 · KYC verification</Text>
        </View>
        <Text style={styles.kycPct}>{progressPct}%</Text>
      </View>

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>

      <View style={styles.counterScene}>
        <View style={styles.clerkSide}>
          <View style={styles.clerkBadge}>
            <Text style={styles.clerkEmoji}>👩‍💼</Text>
          </View>
          <Text style={styles.clerkName}>PRIYA</Text>
          <Text style={styles.clerkRole}>Bank Clerk</Text>
        </View>

        <View style={styles.desk}>
          {stamp ? (
            <Animated.View entering={ZoomIn.duration(400)} style={styles.stampBox}>
              <Text style={styles.stampText}>KYC ✓</Text>
              <Text style={styles.stampSub}>APPROVED</Text>
            </Animated.View>
          ) : (
            handed.slice(-2).map((id, i) => {
              const d = BANK_DOCS.find((x) => x.id === id);
              return (
                <Animated.View key={`${id}-${i}`} entering={FadeInDown} style={styles.onDesk}>
                  <Text style={styles.onDeskEmoji}>{d?.emoji}</Text>
                </Animated.View>
              );
            })
          )}
        </View>

        <View style={styles.playerSide}>
          <ArtifactImage source={ARTIFACTS.student} size={40} />
          <Text style={styles.playerLabel}>YOU</Text>
        </View>
      </View>

      <Animated.View key={line?.id} entering={FadeInRight.duration(280)} style={styles.speechBubble}>
        <Text style={styles.speechTag}>CLERK SAYS</Text>
        <Text style={styles.speechText}>{line?.text}</Text>
        {line?.hint ? <Text style={styles.speechHint}>💡 {line.hint}</Text> : null}
      </Animated.View>

      {rejectMsg ? (
        <Animated.View entering={FadeIn} style={styles.rejectBubble}>
          <Text style={styles.rejectText}>✗ {rejectMsg}</Text>
        </Animated.View>
      ) : null}

      {step === 0 ? (
        <Pressable onPress={advance} style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>START KYC ▶</Text>
        </Pressable>
      ) : null}

      {line?.isGuardian && !guardianOk ? (
        <View style={styles.guardianRow}>
          <Pressable onPress={confirmGuardian} style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>YES — GUARDIAN IS HERE ▶</Text>
          </Pressable>
        </View>
      ) : null}

      {needDoc && !handed.includes(needDoc) ? (
        <View style={styles.bagSection}>
          <Text style={styles.bagTitle}>YOUR DOCUMENT BAG — TAP TO HAND OVER</Text>
          <View style={styles.docGrid}>
            {BANK_DOCS.map((d) => {
              const used = handed.includes(d.id);
              return (
                <Pressable
                  key={d.id}
                  disabled={used}
                  onPress={() => submitDoc(d.id)}
                  style={[
                    styles.docCard,
                    used && styles.docCardUsed,
                    needDoc === d.id && styles.docCardWanted,
                  ]}
                >
                  <Text style={styles.docEmoji}>{d.emoji}</Text>
                  <Text style={[styles.docLabel, used && styles.docLabelUsed]}>{d.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {stamp ? (
        <Animated.Text entering={FadeIn} style={styles.openingText}>
          Opening your account...
        </Animated.Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  branchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: FL_GREEN,
    backgroundColor: '#0a1a12',
    padding: 10,
    marginBottom: 8,
  },
  branchName: { fontFamily: FONT.display, color: FL_GREEN, fontSize: 9, letterSpacing: 1 },
  branchSub: { fontFamily: FONT.body, color: '#888', fontSize: 18, marginTop: 2 },
  kycPct: { fontFamily: FONT.display, color: FL_YELLOW, fontSize: 14 },
  progressTrack: {
    height: 6,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 12,
  },
  progressFill: { height: '100%', backgroundColor: FL_GREEN },
  counterScene: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: '#111',
    padding: 12,
    marginBottom: 12,
    minHeight: 100,
  },
  clerkSide: { alignItems: 'center', width: 72 },
  clerkBadge: {
    width: 52,
    height: 52,
    borderWidth: 2,
    borderColor: FL_YELLOW,
    backgroundColor: '#1a1500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clerkEmoji: { fontSize: 28 },
  clerkName: { fontFamily: FONT.display, color: FL_YELLOW, fontSize: 8, marginTop: 4 },
  clerkRole: { fontFamily: FONT.body, color: '#666', fontSize: 14 },
  desk: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    minHeight: 64,
    borderTopWidth: 3,
    borderTopColor: '#444',
    marginHorizontal: 8,
    paddingTop: 8,
  },
  onDesk: {
    borderWidth: 2,
    borderColor: FL_GREEN,
    padding: 6,
    backgroundColor: '#0a1a12',
  },
  onDeskEmoji: { fontSize: 22 },
  stampBox: {
    borderWidth: 3,
    borderColor: C.red,
    paddingHorizontal: 14,
    paddingVertical: 8,
    transform: [{ rotate: '-8deg' }],
    backgroundColor: '#1a0505',
  },
  stampText: { fontFamily: FONT.display, color: C.red, fontSize: 14, letterSpacing: 2 },
  stampSub: { fontFamily: FONT.display, color: C.red, fontSize: 8, textAlign: 'center' },
  playerSide: { alignItems: 'center', width: 56 },
  playerLabel: { fontFamily: FONT.display, color: '#666', fontSize: 7, marginTop: 4 },
  speechBubble: {
    borderWidth: 2,
    borderColor: FL_GREEN,
    backgroundColor: '#0a0a0a',
    padding: 12,
    marginBottom: 10,
  },
  speechTag: { fontFamily: FONT.display, color: FL_GREEN, fontSize: 7, letterSpacing: 1, marginBottom: 6 },
  speechText: { fontFamily: FONT.body, color: '#eee', fontSize: 22, lineHeight: 26 },
  speechHint: { fontFamily: FONT.body, color: '#888', fontSize: 18, marginTop: 8 },
  rejectBubble: {
    borderWidth: 2,
    borderColor: C.red,
    backgroundColor: '#1a0808',
    padding: 10,
    marginBottom: 10,
  },
  rejectText: { fontFamily: FONT.body, color: C.red, fontSize: 20, lineHeight: 24 },
  bagSection: { marginTop: 4 },
  bagTitle: {
    fontFamily: FONT.display,
    color: '#666',
    fontSize: 7,
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  docGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  docCard: {
    width: '47%',
    borderWidth: 2,
    borderColor: '#444',
    backgroundColor: '#111',
    padding: 10,
    alignItems: 'center',
  },
  docCardWanted: { borderColor: FL_YELLOW, backgroundColor: '#1a1500' },
  docCardUsed: { opacity: 0.35, borderColor: '#333' },
  docEmoji: { fontSize: 28, marginBottom: 4 },
  docLabel: { fontFamily: FONT.body, color: '#ccc', fontSize: 16, textAlign: 'center' },
  docLabelUsed: { color: '#555' },
  guardianRow: { marginTop: 8 },
  actionBtn: {
    backgroundColor: FL_GREEN,
    borderWidth: 3,
    borderColor: '#000',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  actionBtnText: { fontFamily: FONT.display, color: '#000', fontSize: 11, letterSpacing: 0.5 },
  openingText: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: 1,
  },
});
