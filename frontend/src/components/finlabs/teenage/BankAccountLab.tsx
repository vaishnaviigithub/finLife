import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  LabTutorial,
  LabLessonCard,
  LabHud,
  LabChoiceCard,
  LabScreenShell,
  LabToast,
  TutorialPage,
} from '@/src/components/finlabs/LabShared';
import BankClerkKyc from '@/src/components/finlabs/teenage/BankClerkKyc';

type QuizState = 'idle' | 'correct' | 'wrong';

function QuizOption({ label, state, disabled, onPress }: { label: string; state: QuizState; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || state !== 'idle'}
      style={[
        styles.quizOption,
        state === 'correct' && styles.quizCorrect,
        state === 'wrong' && styles.quizWrong,
      ]}
    >
      <Text style={styles.quizOptionText}>{label}</Text>
      {state === 'correct' ? <Text style={styles.quizMark}>✓</Text> : null}
      {state === 'wrong' ? <Text style={styles.quizMarkBad}>✗</Text> : null}
    </Pressable>
  );
}

function QuizChip({ label, state, disabled, onPress }: { label: string; state: QuizState; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || state !== 'idle'}
      style={[
        styles.chip,
        state === 'correct' && styles.chipOk,
        state === 'wrong' && styles.chipBad,
      ]}
    >
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}
import {
  setLabFlagDone,
  isTutorialSeen,
  setTutorialSeen,
  FL_GREEN,
  FL_YELLOW,
} from '@/src/finlabs/storage';
import { finLabsRoadmapHref } from '@/src/finlabs/routes';
import { C, FONT } from '@/src/ui/theme';
import { BankFlowDemo, KycDocDemo } from '@/src/components/finlabs/LabTutorialDemos';
import { play } from '@/src/game/audio';
import ArtifactImage from '@/src/components/ArtifactImage';
import { ARTIFACTS } from '@/src/game/artifacts';

const FLAG = 'finlab_teenage_bank_done';

const BANK_CONCEPT = {
  acronym: 'SAVINGS A/C',
  fullForm: 'Savings Bank Account',
  definition:
    'Your entry point to banking — store money safely, earn interest, use UPI, and receive salary later.',
};

const BANKS = [
  { id: 'sbi', name: 'SBI Student', emoji: '🏛️', hint: '₹0 min · 2.7% · Free ATM', color: C.blue, ifsc: 'SBIN0001234' },
  { id: 'hdfc', name: 'HDFC Basic', emoji: '🏦', hint: '₹0 min · 3% · Best app', color: C.green, ifsc: 'HDFC0001234' },
  { id: 'jupiter', name: 'Jupiter Neo', emoji: '📱', hint: 'Top app · No branch', color: C.yellow, ifsc: 'JUPT0001234' },
] as const;

const BANK_TUTORIAL_PAGES: TutorialPage[] = [
  {
    title: 'HOW A BANK ACCOUNT WORKS',
    showConcept: true,
    terms: [
      { id: 'p', label: 'P', fullForm: 'Principal — your balance', meaning: 'Money in your account that earns interest.' },
      { id: 'r', label: 'R', fullForm: 'Rate — annual interest %', meaning: 'How much the bank pays you per year.' },
    ],
    interactive: (onReady) => <BankFlowDemo onReady={onReady} />,
    formula: 'Simple interest = P × R × T ÷ 100\n\n₹5,000 at 3% for 1 year = ₹150',
  },
  {
    title: 'KYC — WHY DOCUMENTS?',
    terms: [
      { id: 'kyc', label: 'KYC', fullForm: 'Know Your Customer', meaning: 'Bank verifies your identity before opening an account.' },
      { id: 'ifsc', label: 'IFSC', fullForm: 'Indian Financial System Code', meaning: 'Branch code for online transfers.' },
    ],
    interactive: (onReady) => <KycDocDemo onReady={onReady} />,
    warning: 'Under 18? A parent MUST be joint account holder.',
  },
];

export default function BankAccountLab({ chapterId }: { chapterId: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<'tutorial' | 'pick' | 'kyc' | 'quiz' | 'lesson'>('tutorial');
  const [canSkip, setCanSkip] = useState(false);
  const [bank, setBank] = useState<(typeof BANKS)[number]['id'] | null>(null);
  const [q1, setQ1] = useState<string | null>(null);
  const [q2, setQ2] = useState<string | null>(null);
  const [q3, setQ3] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [acctNum] = useState(() => String(Math.floor(10000000000 + Math.random() * 89999999999)));

  const bankInfo = useMemo(() => BANKS.find((b) => b.id === bank), [bank]);

  useEffect(() => {
    isTutorialSeen(FLAG).then((s) => {
      setCanSkip(s);
      if (s) setPhase('pick');
    });
  }, []);

  const back = () => router.replace(finLabsRoadmapHref(chapterId));

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const quizOk = q1 === 'transfer' && q2 === 'legal' && q3 === '150';

  if (phase === 'tutorial') {
    return (
      <LabTutorial
        concept="BANK ACCOUNT"
        conceptMeta={BANK_CONCEPT}
        pages={BANK_TUTORIAL_PAGES}
        canSkip={canSkip}
        onSkip={() => { setTutorialSeen(FLAG); setPhase('pick'); }}
        onComplete={() => { setTutorialSeen(FLAG); setPhase('pick'); }}
      />
    );
  }

  if (phase === 'lesson') {
    return (
      <LabScreenShell title="FIRST BANK" onBack={back}>
        <LabLessonCard
          concept="SAVINGS ACCOUNTS"
          text="A bank account isn't just storage. It's your entry point to UPI, loans, salary, and investments. Open one early."
          onContinue={async () => {
            await setLabFlagDone(FLAG);
            back();
          }}
        />
      </LabScreenShell>
    );
  }

  if (phase === 'quiz' && bankInfo) {
    return (
      <LabScreenShell
        title="ACCOUNT ACTIVATED"
        subtitle="Your new account is live!"
        onBack={back}
        footer={
          <Pressable
            disabled={!quizOk}
            onPress={() => {
              play('win');
              setPhase('lesson');
            }}
            style={[styles.primaryBtn, !quizOk && styles.primaryBtnOff]}
          >
            <Text style={styles.primaryBtnText}>{quizOk ? 'FINISH ▶' : 'ANSWER ALL 3 TO FINISH'}</Text>
          </Pressable>
        }
      >
        <Animated.View entering={FadeIn} style={styles.accountCard}>
          <Text style={styles.accountEmoji}>🎉</Text>
          <Text style={styles.accountTitle}>WELCOME TO {bankInfo.name.toUpperCase()}</Text>
          <Text style={styles.accountLine}>Account: {acctNum}</Text>
          <Text style={styles.accountLine}>IFSC: {bankInfo.ifsc}</Text>
          <Text style={styles.accountLine}>UPI: you@{bank === 'jupiter' ? 'jupiter' : bank}</Text>
        </Animated.View>

        <Text style={styles.quizHead}>QUICK CHECK — TAP THE RIGHT ANSWER</Text>

        <Text style={styles.quizQ}>IFSC code is used for?</Text>
        <QuizOption
          label="Online bank transfers"
          disabled={q1 === 'transfer'}
          state={q1 === null ? 'idle' : q1 === 'transfer' ? 'correct' : 'idle'}
          onPress={() => { play('coin'); setQ1('transfer'); }}
        />
        <QuizOption
          label="Withdrawing cash at ATM"
          disabled={q1 === 'transfer'}
          state={q1 === null ? 'idle' : q1 === 'atm' ? 'wrong' : 'idle'}
          onPress={() => { play('bad'); setQ1('atm'); showToast('IFSC is for online transfers'); }}
        />

        <Text style={styles.quizQ}>Why is your parent on the account?</Text>
        <QuizOption
          label="Legal rule for under-18"
          disabled={q2 === 'legal'}
          state={q2 === null ? 'idle' : q2 === 'legal' ? 'correct' : 'idle'}
          onPress={() => { play('coin'); setQ2('legal'); }}
        />
        <QuizOption
          label="They don't trust you"
          disabled={q2 === 'legal'}
          state={q2 === null ? 'idle' : q2 === 'trust' ? 'wrong' : 'idle'}
          onPress={() => { play('bad'); setQ2('trust'); showToast("It's the law — not about trust"); }}
        />

        <Text style={styles.quizQ}>₹5,000 at 3% for 1 year earns?</Text>
        <View style={styles.chipRow}>
          {[100, 150, 500].map((amt) => {
            const picked = q3 === String(amt);
            const state = q3 === null ? 'idle' : picked ? (amt === 150 ? 'correct' : 'wrong') : 'idle';
            return (
              <QuizChip
                key={amt}
                label={`₹${amt}`}
                disabled={q3 === '150'}
                state={state}
                onPress={() => {
                  setQ3(String(amt));
                  if (amt === 150) play('coin');
                  else { play('bad'); showToast('Try: 5000 × 3 × 1 ÷ 100'); }
                }}
              />
            );
          })}
        </View>
        <LabToast message={toast} visible={!!toast} />
      </LabScreenShell>
    );
  }

  if (phase === 'kyc' && bankInfo) {
    return (
      <LabScreenShell title="AT THE BRANCH" subtitle={`Opening ${bankInfo.name}`} onBack={back}>
        <LabHud wallet={5000} mood={70} age={15} />
        <BankClerkKyc
          bankName={bankInfo.name}
          onComplete={() => {
            play('win');
            setPhase('quiz');
          }}
        />
      </LabScreenShell>
    );
  }

  if (phase === 'pick') {
    return (
      <LabScreenShell
        title="CHOOSE YOUR BANK"
        subtitle="Pick where you'll open your first account"
        onBack={back}
        footer={
          <Pressable
            disabled={!bank}
            onPress={() => {
              play('whoosh');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              setPhase('kyc');
            }}
            style={[styles.primaryBtn, !bank && styles.primaryBtnOff]}
          >
            <Text style={styles.primaryBtnText}>VISIT BRANCH ▶</Text>
          </Pressable>
        }
      >
        <LabHud wallet={5000} mood={70} age={15} />
        <View style={styles.pickHero}>
          <ArtifactImage source={ARTIFACTS.building} size={56} />
          <Text style={styles.pickHeroText}>Three options. All ₹0 minimum balance for students.</Text>
        </View>
        {BANKS.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => { play('click'); setBank(b.id); }}
            style={[styles.bankCard, bank === b.id && styles.bankCardOn]}
          >
            <Text style={styles.bankEmoji}>{b.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bankName, bank === b.id && { color: FL_GREEN }]}>{b.name}</Text>
              <Text style={styles.bankHint}>{b.hint}</Text>
            </View>
            {bank === b.id ? <Text style={styles.bankCheck}>✓</Text> : null}
          </Pressable>
        ))}
      </LabScreenShell>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  pickHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: '#333',
    padding: 12,
    marginBottom: 14,
    backgroundColor: '#111',
  },
  pickHeroText: { fontFamily: FONT.body, color: '#aaa', fontSize: 20, flex: 1, lineHeight: 24 },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 3,
    borderColor: '#333',
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#0a0a0a',
  },
  bankCardOn: { borderColor: FL_GREEN, backgroundColor: '#0a1a12' },
  bankEmoji: { fontSize: 32 },
  bankName: { fontFamily: FONT.body, color: C.white, fontSize: 24 },
  bankHint: { fontFamily: FONT.body, color: '#888', fontSize: 18, marginTop: 2 },
  bankCheck: { fontFamily: FONT.display, color: FL_GREEN, fontSize: 18 },
  accountCard: {
    borderWidth: 3,
    borderColor: FL_GREEN,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#0a1a12',
    alignItems: 'center',
  },
  accountEmoji: { fontSize: 36, marginBottom: 8 },
  accountTitle: { fontFamily: FONT.display, color: FL_GREEN, fontSize: 11, letterSpacing: 1 },
  accountLine: { fontFamily: FONT.body, color: '#ccc', fontSize: 22, marginTop: 6 },
  quizHead: {
    fontFamily: FONT.display,
    color: FL_YELLOW,
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  quizQ: { fontFamily: FONT.body, color: '#ccc', fontSize: 22, marginBottom: 8, marginTop: 8 },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  chip: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#444',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  chipOk: { borderColor: C.green, backgroundColor: '#0a1a12' },
  chipBad: { borderColor: C.red, backgroundColor: '#1a0808' },
  chipText: { fontFamily: FONT.body, color: C.white, fontSize: 22 },
  quizOption: {
    borderWidth: 2,
    borderColor: '#444',
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quizCorrect: { borderColor: C.green, backgroundColor: '#0a1a12' },
  quizWrong: { borderColor: C.red, backgroundColor: '#1a0808' },
  quizOptionText: { fontFamily: FONT.body, color: '#eee', fontSize: 20, flex: 1 },
  quizMark: { fontFamily: FONT.display, color: C.green, fontSize: 16 },
  quizMarkBad: { fontFamily: FONT.display, color: C.red, fontSize: 16 },
  primaryBtn: {
    backgroundColor: FL_GREEN,
    borderWidth: 3,
    borderColor: '#000',
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnOff: { opacity: 0.4, backgroundColor: '#444' },
  primaryBtnText: { fontFamily: FONT.display, color: '#000', fontSize: 11, letterSpacing: 0.5 },
});
