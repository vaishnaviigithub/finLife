import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { finLabsRoadmapHref } from '@/src/finlabs/routes';
import { FL_BG, FL_GREEN, FL_YELLOW } from '@/src/finlabs/storage';
import { C, FONT } from '@/src/ui/theme';
import { play } from '@/src/game/audio';

const FLAG = 'finlab_firstjob_itr_done';
const START_WALLET = 0;
const START_MOOD = 68;

type Field = {
  question: string;
  correct: number;
  tolerance: number;
  hint: string;
};

const FIELDS: Field[] = [
  { question: "What is Arjun's salary?", correct: 500000, tolerance: 1000, hint: "It's on the sticky note above." },
  { question: 'How much tax does he owe?', correct: 0, tolerance: 0, hint: 'Also on the sticky note.' },
  { question: 'So what is his refund?', correct: 10000, tolerance: 500, hint: 'TDS taken minus tax owed.' },
];

const TUTORIAL_TERMS = [
  {
    id: 'salary',
    title: 'SALARY',
    short: 'Money Arjun earned from his first job.',
    detail: 'Arjun is a salaried employee. This year his company paid him ₹5,00,000.',
    icon: 'briefcase-variant',
  },
  {
    id: 'tds',
    title: 'TDS',
    short: 'Tax deducted before salary reaches him.',
    detail: 'His employer already sent ₹10,000 to the government under his PAN.',
    icon: 'bank-transfer-out',
  },
  {
    id: 'itr',
    title: 'ITR',
    short: 'The return form that tells the final tax story.',
    detail: 'For simple salary below ₹50L, Arjun usually files ITR-1.',
    icon: 'file-document-edit',
  },
  {
    id: 'refund',
    title: 'REFUND',
    short: 'Money he gets back if extra tax was taken.',
    detail: 'Refund = TDS paid - final tax owed. Here that is ₹10,000 - ₹0.',
    icon: 'cash-refund',
  },
];

const QUESTIONS = [
  {
    text: 'Arjun files in September instead of July 31. What happens?',
    options: ['Nothing changes', 'He pays a penalty', 'His refund doubles'],
    answer: 1,
    explanation:
      'File before July 31. Late filing costs ₹1,000-₹5,000 in penalties depending on income. No reason to pay it.',
  },
  {
    text: 'Which form does a salary earner below ₹50L use?',
    options: ['ITR-1', 'ITR-2', 'ITR-3'],
    answer: 0,
    explanation: 'ITR-1. Simple salary, simple form. ITR-2 is for capital gains. ITR-3 is for business income.',
  },
  {
    text: 'How does Arjun verify his TDS was actually sent to the government?',
    options: ['Ask his manager', 'Check Form 26AS', 'Check his salary slip'],
    answer: 1,
    explanation:
      'Form 26AS is a govt document that shows every rupee deposited under your PAN. Always check it before filing your ITR.',
  },
];

function money(n: number) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function cleanAmount(v: string) {
  return Number(v.replace(/[^\d]/g, '') || 0);
}

export default function ItrLab({ chapterId }: { chapterId: string }) {
  const router = useRouter();
  const [screen, setScreen] = useState<1 | 2 | 3 | 4>(1);
  const [field, setField] = useState<0 | 1 | 2>(0);
  const [fieldValues, setFieldValues] = useState(['', '', '']);
  const [wrongCounts, setWrongCounts] = useState([0, 0, 0]);
  const [correctFields, setCorrectFields] = useState([false, false, false]);
  const [submitted, setSubmitted] = useState(false);
  const [flash, setFlash] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [wallet, setWallet] = useState(START_WALLET);
  const [mood, setMood] = useState(START_MOOD);
  const [q, setQ] = useState<0 | 1 | 2>(0);
  const [answered, setAnswered] = useState<boolean[]>([false, false, false]);
  const [picked, setPicked] = useState<number | null>(null);
  const [visibleLines, setVisibleLines] = useState(0);
  const [tutorialStep, setTutorialStep] = useState<'brief' | 'breakdown'>('brief');
  const [revealedTerms, setRevealedTerms] = useState<Set<string>>(new Set());

  const receiptY = useRef(new Animated.Value(400)).current;
  const shakeX = useRef(new Animated.Value(0)).current;

  const back = () => {
    const leave = () => router.replace(finLabsRoadmapHref(chapterId));
    if (screen === 2 || screen === 3) {
      Alert.alert('Progress will be lost. Go back?', '', [
        { text: 'STAY', style: 'cancel' },
        { text: 'LEAVE', style: 'destructive', onPress: leave },
      ]);
      return;
    }
    leave();
  };

  useEffect(() => {
    if (screen !== 1) return;
    setVisibleLines(0);
    if (tutorialStep !== 'breakdown') return;
    const timers = Array.from({ length: 6 }, (_, i) => setTimeout(() => setVisibleLines(i + 1), i * 100));
    return () => timers.forEach(clearTimeout);
  }, [screen, tutorialStep]);

  const failField = (idx: number) => {
    play('bad');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    setWrongCounts((prev) => prev.map((v, i) => (i === idx ? v + 1 : v)));
    shakeX.setValue(0);
    Animated.sequence([
      Animated.timing(shakeX, { toValue: -8, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 8, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -5, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  };

  const checkField = (idx: 0 | 1 | 2) => {
    const cfg = FIELDS[idx];
    const value = cleanAmount(fieldValues[idx]);
    if (Math.abs(value - cfg.correct) <= cfg.tolerance) {
      play('coin');
      setCorrectFields((prev) => prev.map((v, i) => (i === idx ? true : v)));
      if (idx < 2) setField((idx + 1) as 0 | 1 | 2);
      return;
    }
    failField(idx);
  };

  const submitItr = () => {
    setSubmitted(true);
    setFlash(true);
    play('win');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTimeout(() => setFlash(false), 170);
    receiptY.setValue(400);
    Animated.timing(receiptY, {
      toValue: 0,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      setShowStats(true);
      setWallet(10000);
      setMood(78);
    }, 1500);
  };

  const chooseOption = (idx: number) => {
    if (answered[q]) return;
    setPicked(idx);
    setAnswered((prev) => prev.map((v, i) => (i === q ? true : v)));
    play(idx === QUESTIONS[q].answer ? 'coin' : 'bad');
  };

  const nextQuestion = () => {
    setPicked(null);
    if (q >= 2) setScreen(4);
    else setQ((q + 1) as 0 | 1 | 2);
  };

  const done = async () => {
    await AsyncStorage.setItem(FLAG, 'true');
    router.replace(finLabsRoadmapHref(chapterId));
  };

  return (
    <View style={styles.root}>
      {flash ? <View style={styles.flash} pointerEvents="none" /> : null}
      <Header
        title={
          screen === 1 ? 'FILING YOUR ITR' :
          screen === 2 ? 'HELP ARJUN FILE HIS ITR' :
          screen === 3 ? '3 QUESTIONS.' :
          'INCOME TAX RETURN'
        }
        onBack={back}
      />
      {screen === 1 ? (
        <Tutorial
          onNext={() => setScreen(2)}
          visibleLines={visibleLines}
          tutorialStep={tutorialStep}
          revealedTerms={revealedTerms}
          onRevealTerm={(id) => {
            play('click');
            setRevealedTerms((prev) => new Set(prev).add(id));
          }}
          onOpenBreakdown={() => {
            play('coin');
            setTutorialStep('breakdown');
          }}
        />
      ) : null}
      {screen === 2 ? (
        <FieldsScreen
          field={field}
          values={fieldValues}
          wrongCounts={wrongCounts}
          correctFields={correctFields}
          submitted={submitted}
          showStats={showStats}
          wallet={wallet}
          mood={mood}
          receiptY={receiptY}
          shakeX={shakeX}
          onChange={(idx, value) => setFieldValues((prev) => prev.map((v, i) => (i === idx ? value : v)))}
          onCheck={checkField}
          onSubmit={submitItr}
          onNext={() => setScreen(3)}
        />
      ) : null}
      {screen === 3 ? (
        <QuestionsScreen
          q={q}
          picked={picked}
          answered={answered}
          onPick={chooseOption}
          onNext={nextQuestion}
        />
      ) : null}
      {screen === 4 ? <Lesson onDone={done} /> : null}
    </View>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <SafeAreaView edges={['top']} style={styles.header}>
      <Pressable onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>◀</Text>
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
    </SafeAreaView>
  );
}

function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.primaryBtn, disabled && styles.primaryOff, pressed && !disabled && styles.pressed]}
    >
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

function Tutorial({
  onNext,
  visibleLines,
  tutorialStep,
  revealedTerms,
  onRevealTerm,
  onOpenBreakdown,
}: {
  onNext: () => void;
  visibleLines: number;
  tutorialStep: 'brief' | 'breakdown';
  revealedTerms: Set<string>;
  onRevealTerm: (id: string) => void;
  onOpenBreakdown: () => void;
}) {
  const lines = [
    ['Salary earned', '₹5,00,000', false],
    ['TDS taken', '- ₹10,000', false],
    ['divider', '', false],
    ['Tax he owes', '₹0', false],
    ['divider', '', false],
    ['REFUND DUE', '₹10,000 ✓', true],
  ] as const;
  const cardsLeft = TUTORIAL_TERMS.length - revealedTerms.size;

  if (tutorialStep === 'brief') {
    return (
      <SafeAreaView edges={['bottom']} style={styles.tutorialSafe}>
        <ScrollView contentContainerStyle={styles.tutorialScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.tutorialStage}>
            <View style={styles.taxDeskHero}>
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons name="file-document-edit" size={38} color="#000" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroKicker}>ARJUN{"'"}S FIRST SALARY YEAR</Text>
                <Text style={styles.heroTitle}>FILE THE RETURN. CLAIM THE REFUND.</Text>
                <Text style={styles.heroCopy}>
                  You are Arjun, age 24, a salaried employee. Payroll handled the deductions, but the refund is still locked behind one form.
                </Text>
              </View>
            </View>

            <View style={styles.missionCard}>
              <View style={styles.missionTag}>
                <Text style={styles.missionTagText}>THE CASE FILE</Text>
              </View>
              <Text style={styles.missionText}>
                Salary earned: â‚¹5,00,000{"\n"}
                TDS already paid: â‚¹10,000{"\n"}
                Final tax owed: â‚¹0{"\n\n"}
                Tap every concept card before opening the tax desk.
              </Text>
            </View>

            <View style={styles.termGrid}>
              {TUTORIAL_TERMS.map((term) => {
                const revealed = revealedTerms.has(term.id);
                return (
                  <Pressable
                    key={term.id}
                    onPress={() => onRevealTerm(term.id)}
                    style={({ pressed }) => [
                      styles.termCard,
                      revealed && styles.termCardOn,
                      pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] },
                    ]}
                  >
                    <View style={[styles.termIcon, revealed && styles.termIconOn]}>
                      <MaterialCommunityIcons
                        name={term.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={22}
                        color={revealed ? '#000' : FL_GREEN}
                      />
                    </View>
                    <Text style={[styles.termTitle, revealed && styles.termTitleOn]}>{term.title}</Text>
                    <Text style={styles.termShort}>{revealed ? term.detail : term.short}</Text>
                    <Text style={styles.termTap}>{revealed ? 'UNLOCKED âœ“' : 'TAP TO OPEN'}</Text>
                  </Pressable>
                );
              })}
            </View>

            <PrimaryButton
              label={cardsLeft <= 0 ? 'OPEN TAX DESK â–¶' : `UNLOCK ${cardsLeft} MORE CARD${cardsLeft === 1 ? '' : 'S'}`}
              disabled={cardsLeft > 0}
              onPress={onOpenBreakdown}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.centerScreen}>
      <View style={styles.conceptPill}><Text style={styles.conceptPillText}>CONCEPT: ITR</Text></View>
      <View style={styles.breakdownCard}>
        <Text style={styles.cardTitle}>ARJUN{"'"}S YEAR</Text>
        {lines.map((line, idx) => {
          if (visibleLines <= idx) return <View key={idx} style={styles.revealSlot} />;
          if (line[0] === 'divider') return <View key={idx} style={styles.divider} />;
          return (
            <Animated.View key={idx} style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, line[2] && styles.refundText]}>{line[0]}</Text>
              <Text style={[styles.breakdownValue, line[2] && styles.refundText]}>{line[1]}</Text>
            </Animated.View>
          );
        })}
      </View>
      <Text style={styles.tutorialCopy}>
        His employer took ₹10,000 just in case.{"\n"}He actually owes ₹0.{"\n"}ITR is the form he fills to get it back.
      </Text>
      <PrimaryButton label="GOT IT ▶" onPress={onNext} />
    </SafeAreaView>
  );
}

function FieldsScreen(props: {
  field: 0 | 1 | 2;
  values: string[];
  wrongCounts: number[];
  correctFields: boolean[];
  submitted: boolean;
  showStats: boolean;
  wallet: number;
  mood: number;
  receiptY: Animated.Value;
  shakeX: Animated.Value;
  onChange: (idx: number, value: string) => void;
  onCheck: (idx: 0 | 1 | 2) => void;
  onSubmit: () => void;
  onNext: () => void;
}) {
  const allCorrect = props.correctFields.every(Boolean);
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.sticky}>
        <Text style={styles.stickyTitle}>ARJUN{"'"}S DETAILS</Text>
        <Text style={styles.stickyLine}>Salary:   ₹5,00,000</Text>
        <Text style={styles.stickyLine}>TDS paid: ₹10,000</Text>
        <Text style={styles.stickyLine}>Tax owed: ₹0</Text>
      </View>
      <ScrollView contentContainerStyle={styles.fieldsScroll} keyboardShouldPersistTaps="handled">
        {FIELDS.map((cfg, idx) => {
          const active = props.field === idx;
          const done = props.correctFields[idx];
          const future = idx > props.field;
          return (
            <View key={cfg.question} pointerEvents={future || done ? 'none' : 'auto'} style={[styles.fieldCard, future && styles.futureCard, done && styles.doneCard]}>
              <Text style={styles.fieldQuestion}>{cfg.question}</Text>
              {done ? <Text style={styles.doneAnswer}>✓ {money(cleanAmount(props.values[idx]))}</Text> : null}
              {idx === 2 && !done ? <Text style={styles.formula}>TDS taken - Tax owed{"\n"}₹10,000 - ₹0 = ₹[   ]</Text> : null}
              {!done ? (
                <Animated.View style={active ? { transform: [{ translateX: props.shakeX }] } : undefined}>
                  <View style={styles.inputRow}>
                    <Text style={styles.inputPrefix}>₹</Text>
                    <TextInput
                      value={props.values[idx]}
                      editable={active}
                      keyboardType="number-pad"
                      placeholder="type amount"
                      placeholderTextColor="#555"
                      onChangeText={(t) => props.onChange(idx, t.replace(/[^\d]/g, ''))}
                      style={styles.input}
                    />
                  </View>
                  {props.wrongCounts[idx] >= 2 ? <Text style={styles.hint}>{cfg.hint}</Text> : null}
                  {active ? <PrimaryButton label="LOCK ANSWER ▶" onPress={() => props.onCheck(idx as 0 | 1 | 2)} /> : null}
                </Animated.View>
              ) : null}
            </View>
          );
        })}
        {allCorrect && !props.submitted ? <PrimaryButton label="SUBMIT ITR ▶" onPress={props.onSubmit} /> : null}
        {props.submitted ? (
          <Animated.View style={[styles.filedCard, { transform: [{ translateY: props.receiptY }] }]}>
            <Text style={styles.filedTitle}>✓ ITR FILED</Text>
            <Text style={styles.filedLine}>Form: ITR-1</Text>
            <Text style={styles.filedLine}>Refund: ₹10,000</Text>
            <Text style={styles.filedLine}>Arrives: 15-45 working days</Text>
          </Animated.View>
        ) : null}
        {props.showStats ? (
          <View style={styles.statsCard}>
            <StatBar label="WALLET" value={props.wallet} max={10000} color={FL_GREEN} display={money(props.wallet)} />
            <StatBar label="MOOD" value={props.mood} max={100} color={C.orange} display={`${props.mood}/100`} />
            <PrimaryButton label="NEXT ▶" onPress={props.onNext} />
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StatBar({ label, value, max, color, display }: { label: string; value: number; max: number; color: string; display: string }) {
  return (
    <View style={styles.statWrap}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statTrack}><View style={[styles.statFill, { width: `${Math.min(100, (value / max) * 100)}%`, backgroundColor: color }]} /></View>
      <Text style={styles.statValue}>{display}</Text>
    </View>
  );
}

function QuestionsScreen({ q, picked, answered, onPick, onNext }: { q: 0 | 1 | 2; picked: number | null; answered: boolean[]; onPick: (idx: number) => void; onNext: () => void }) {
  const item = QUESTIONS[q];
  const isAnswered = answered[q];
  return (
    <SafeAreaView edges={['bottom']} style={styles.questionRoot}>
      <Text style={styles.dots}>{QUESTIONS.map((_, i) => (answered[i] || i === q ? '●' : '○')).join('')}</Text>
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{item.text}</Text>
        {item.options.map((option, idx) => {
          const correct = isAnswered && idx === item.answer;
          const wrong = isAnswered && picked === idx && idx !== item.answer;
          return (
            <Pressable disabled={isAnswered} key={option} onPress={() => onPick(idx)} style={[styles.optionBtn, correct && styles.optionCorrect, wrong && styles.optionWrong]}>
              <Text style={[styles.optionText, (correct || wrong) && styles.optionTextDark]}>{option}</Text>
            </Pressable>
          );
        })}
        {isAnswered ? <Text style={styles.explanation}>{item.explanation}</Text> : null}
      </View>
      {isAnswered ? <PrimaryButton label={q >= 2 ? 'SEE LESSON ▶' : 'NEXT ▶'} onPress={onNext} /> : null}
    </SafeAreaView>
  );
}

function Lesson({ onDone }: { onDone: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.lessonRoot}>
      <View style={styles.lessonTag}><Text style={styles.lessonTagText}>CONCEPT</Text></View>
      <Text style={styles.lessonConcept}>INCOME TAX RETURN</Text>
      <View style={styles.lessonCard}>
        <Text style={styles.lessonEyebrow}>THE LESSON</Text>
        <Text style={styles.lessonText}>
          TDS is money the government is holding for you. File ITR before July 31. Two fields and a refund. That{"'"}s it for most first-job salaries.
        </Text>
      </View>
      <View style={styles.cheatCard}>
        <Text style={styles.cheatTitle}>ITR BASICS</Text>
        <Text style={styles.cheatLine}>Form:     ITR-1</Text>
        <Text style={styles.cheatLine}>Deadline: July 31</Text>
        <Text style={styles.cheatLine}>Late fee: ₹1,000-₹5,000</Text>
        <Text style={styles.cheatLine}>Verify:   Form 26AS</Text>
        <Text style={styles.cheatLine}>Refund:   TDS - Tax owed</Text>
      </View>
      <PrimaryButton label="DONE ▶" onPress={onDone} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: FL_BG },
  flash: { ...StyleSheet.absoluteFillObject, backgroundColor: FL_GREEN, zIndex: 50 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 3, borderBottomColor: FL_GREEN, backgroundColor: '#000' },
  backBtn: { width: 36, height: 36, borderWidth: 2, borderColor: FL_GREEN, alignItems: 'center', justifyContent: 'center' },
  backText: { fontFamily: FONT.display, color: FL_GREEN, fontSize: 14 },
  headerTitle: { flex: 1, fontFamily: FONT.display, color: FL_GREEN, fontSize: 11, letterSpacing: 1 },
  centerScreen: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center', gap: 16 },
  tutorialSafe: { flex: 1, backgroundColor: FL_BG },
  tutorialScroll: { padding: 16, paddingBottom: 28, alignItems: 'center' },
  tutorialStage: { width: '100%', maxWidth: 760, gap: 14 },
  taxDeskHero: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    backgroundColor: '#141414',
    borderWidth: 3,
    borderColor: FL_GREEN,
    padding: 14,
  },
  heroIcon: {
    width: 74,
    height: 74,
    borderWidth: 4,
    borderColor: '#000',
    backgroundColor: FL_YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroKicker: { fontFamily: FONT.display, color: FL_YELLOW, fontSize: 9, letterSpacing: 2, marginBottom: 6 },
  heroTitle: { fontFamily: FONT.display, color: FL_GREEN, fontSize: 14, letterSpacing: 1, lineHeight: 19 },
  heroCopy: { fontFamily: FONT.body, color: '#ccc', fontSize: 18, lineHeight: 22, marginTop: 8 },
  missionCard: {
    backgroundColor: '#FFF',
    borderWidth: 4,
    borderColor: '#000',
    padding: 16,
    marginTop: 2,
  },
  missionTag: {
    alignSelf: 'flex-start',
    backgroundColor: FL_YELLOW,
    borderWidth: 3,
    borderColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: -28,
    marginBottom: 8,
  },
  missionTagText: { fontFamily: FONT.display, color: '#000', fontSize: 9, letterSpacing: 1 },
  missionText: { fontFamily: FONT.body, color: '#000', fontSize: 19, lineHeight: 23 },
  termGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  termCard: {
    flexGrow: 1,
    flexBasis: 280,
    borderWidth: 3,
    borderColor: '#333',
    backgroundColor: '#101010',
    padding: 12,
    minHeight: 150,
  },
  termCardOn: { borderColor: FL_GREEN, backgroundColor: '#0a1a12' },
  termIcon: {
    width: 38,
    height: 38,
    borderWidth: 2,
    borderColor: FL_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  termIconOn: { backgroundColor: FL_GREEN, borderColor: '#000' },
  termTitle: { fontFamily: FONT.display, color: C.white, fontSize: 12, letterSpacing: 1 },
  termTitleOn: { color: FL_GREEN },
  termShort: { fontFamily: FONT.body, color: '#bbb', fontSize: 17, lineHeight: 21, marginTop: 8 },
  termTap: { fontFamily: FONT.display, color: FL_YELLOW, fontSize: 8, letterSpacing: 1, marginTop: 'auto' },
  conceptPill: { backgroundColor: FL_YELLOW, borderWidth: 3, borderColor: '#000', paddingHorizontal: 10, paddingVertical: 5 },
  conceptPillText: { fontFamily: FONT.display, color: '#000', fontSize: 9, letterSpacing: 1 },
  breakdownCard: { width: '100%', maxWidth: 760, alignSelf: 'center', borderWidth: 4, borderColor: FL_GREEN, backgroundColor: '#111', padding: 16 },
  cardTitle: { fontFamily: FONT.display, color: C.white, fontSize: 13, letterSpacing: 2, marginBottom: 14 },
  revealSlot: { height: 28 },
  breakdownRow: { minHeight: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLabel: { fontFamily: FONT.body, color: '#ddd', fontSize: 19 },
  breakdownValue: { fontFamily: FONT.display, color: C.white, fontSize: 15 },
  refundText: { color: FL_GREEN, fontSize: 21, fontFamily: FONT.display },
  divider: { height: 2, backgroundColor: '#333', marginVertical: 8 },
  tutorialCopy: { fontFamily: FONT.body, color: '#ccc', fontSize: 20, lineHeight: 24, textAlign: 'center' },
  primaryBtn: { backgroundColor: FL_GREEN, borderWidth: 4, borderColor: '#000', paddingVertical: 14, paddingHorizontal: 14, alignItems: 'center', marginTop: 12, alignSelf: 'center', width: '100%', maxWidth: 760 },
  primaryOff: { opacity: 0.35, backgroundColor: '#444' },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }] },
  primaryText: { fontFamily: FONT.display, color: '#000', fontSize: 12, letterSpacing: 1, textAlign: 'center' },
  sticky: { backgroundColor: FL_YELLOW, borderBottomWidth: 4, borderBottomColor: '#000', padding: 12 },
  stickyTitle: { fontFamily: FONT.display, color: '#000', fontSize: 11, letterSpacing: 1, marginBottom: 6 },
  stickyLine: { fontFamily: FONT.display, color: '#111', fontSize: 10, marginTop: 2 },
  fieldsScroll: { padding: 14, paddingBottom: 28, alignItems: 'center' },
  fieldCard: { width: '100%', maxWidth: 760, borderWidth: 3, borderColor: '#333', backgroundColor: '#111', padding: 14, marginBottom: 12 },
  futureCard: { opacity: 0.32 },
  doneCard: { borderColor: FL_GREEN, backgroundColor: '#0a1a12' },
  fieldQuestion: { fontFamily: FONT.body, color: C.white, fontSize: 21, lineHeight: 24, marginBottom: 10 },
  doneAnswer: { fontFamily: FONT.display, color: FL_GREEN, fontSize: 13 },
  formula: { fontFamily: FONT.display, color: FL_YELLOW, fontSize: 11, lineHeight: 18, marginBottom: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 3, borderColor: '#444', backgroundColor: '#050505', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  inputPrefix: { fontFamily: FONT.body, color: FL_GREEN, fontSize: 30 },
  input: { flex: 1, fontFamily: FONT.body, color: C.white, fontSize: 32, minHeight: 44, padding: 0 },
  hint: { fontFamily: FONT.body, color: FL_YELLOW, fontSize: 18, lineHeight: 22, marginTop: 8 },
  filedCard: { width: '100%', maxWidth: 760, borderWidth: 4, borderColor: FL_GREEN, backgroundColor: '#111', padding: 18, marginTop: 10 },
  filedTitle: { fontFamily: FONT.display, color: FL_GREEN, fontSize: 15, letterSpacing: 2, marginBottom: 14 },
  filedLine: { fontFamily: FONT.body, color: '#ddd', fontSize: 20, lineHeight: 25 },
  statsCard: { width: '100%', maxWidth: 760, borderWidth: 2, borderColor: '#333', padding: 12, marginTop: 12, backgroundColor: '#0a0a0a' },
  statWrap: { marginBottom: 10 },
  statLabel: { fontFamily: FONT.display, color: '#888', fontSize: 8, marginBottom: 4 },
  statTrack: { height: 14, backgroundColor: '#222', borderWidth: 1, borderColor: '#444' },
  statFill: { height: '100%' },
  statValue: { fontFamily: FONT.display, color: FL_GREEN, fontSize: 10, marginTop: 4 },
  questionRoot: { flex: 1, padding: 16 },
  dots: { fontFamily: FONT.display, color: FL_GREEN, fontSize: 18, letterSpacing: 5, textAlign: 'center', marginBottom: 16 },
  questionCard: { borderWidth: 3, borderColor: FL_GREEN, backgroundColor: '#111', padding: 14 },
  questionText: { fontFamily: FONT.body, color: C.white, fontSize: 22, lineHeight: 26, marginBottom: 12 },
  optionBtn: { borderWidth: 3, borderColor: '#444', backgroundColor: '#050505', padding: 12, marginBottom: 9 },
  optionCorrect: { backgroundColor: FL_GREEN, borderColor: '#000' },
  optionWrong: { backgroundColor: C.red, borderColor: '#000' },
  optionText: { fontFamily: FONT.display, color: C.white, fontSize: 11, letterSpacing: 1 },
  optionTextDark: { color: '#000' },
  explanation: { fontFamily: FONT.body, color: FL_YELLOW, fontSize: 18, lineHeight: 22, marginTop: 8 },
  lessonRoot: { padding: 16, paddingBottom: 32, alignItems: 'stretch' },
  lessonTag: { alignSelf: 'center', backgroundColor: FL_YELLOW, borderWidth: 3, borderColor: '#000', paddingHorizontal: 10, paddingVertical: 4 },
  lessonTagText: { fontFamily: FONT.display, color: '#000', fontSize: 9, letterSpacing: 2 },
  lessonConcept: { fontFamily: FONT.display, color: C.white, fontSize: 18, letterSpacing: 2, marginTop: 10, textAlign: 'center' },
  lessonCard: { backgroundColor: '#FFF', borderWidth: 4, borderColor: '#000', padding: 20, marginTop: 18 },
  lessonEyebrow: { fontFamily: FONT.display, color: C.red, fontSize: 10, letterSpacing: 2, textAlign: 'center' },
  lessonText: { fontFamily: FONT.body, color: '#000', fontSize: 20, lineHeight: 24, textAlign: 'center', marginTop: 12 },
  cheatCard: { borderWidth: 3, borderColor: FL_GREEN, backgroundColor: '#111', padding: 14, marginTop: 14 },
  cheatTitle: { fontFamily: FONT.display, color: FL_GREEN, fontSize: 11, letterSpacing: 1, marginBottom: 10 },
  cheatLine: { fontFamily: FONT.display, color: '#ddd', fontSize: 10, lineHeight: 18 },
});
