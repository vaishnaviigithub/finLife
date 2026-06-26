import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInRight } from 'react-native-reanimated';
import {
  LabTutorial,
  LabLessonCard,
  LabHud,
  LabNumericField,
  LabPixelBars,
  LabScreenShell,
  LabToast,
  TutorialPage,
  ConceptMeta,
} from '@/src/components/finlabs/LabShared';
import { EmiSplitDemo, EmiHiddenCostDemo } from '@/src/components/finlabs/LabTutorialDemos';
import {
  setLabFlagDone,
  isTutorialSeen,
  setTutorialSeen,
  FL_GREEN,
} from '@/src/finlabs/storage';
import { finLabsRoadmapHref } from '@/src/finlabs/routes';
import { C, FONT } from '@/src/ui/theme';
import { play } from '@/src/game/audio';

const FLAG = 'finlab_teenage_emi_done';

const EMI_CONCEPT: ConceptMeta = {
  acronym: 'EMI',
  fullForm: 'Equated Monthly Installment',
  definition:
    'A fixed amount you pay every month on a loan or purchase plan. It includes interest — so the total you pay is always more than the sticker price.',
};

function near(n: number, target: number, tol: number) {
  return Math.abs(n - target) <= tol;
}

type OfferStep = 0 | 1 | 2;
const OFFER_LABELS = ['A · PAY FULL', 'B · 6-MON EMI', 'C · 0% TRAP'];

const EMI_TUTORIAL_PAGES: TutorialPage[] = [
  {
    title: 'MEET EMI',
    showConcept: true,
    subtitle: 'Before the maths — what does it mean?',
    body: 'EMI lets you pay for something in fixed monthly chunks instead of one big payment. Sounds easy. It always costs more than paying upfront.',
  },
  {
    title: 'SPLIT THE PHONE',
    subtitle: 'Tap the phone until it breaks into 12 EMIs',
    interactive: (onReady) => <EmiSplitDemo onReady={onReady} />,
  },
  {
    title: 'THE 3 VARIABLES',
    subtitle: 'Tap each letter to learn what it stands for',
    terms: [
      {
        id: 'p',
        label: 'P',
        fullForm: 'Principal — the loan amount',
        meaning: 'The actual price borrowed (e.g. ₹15,000 for the phone).',
      },
      {
        id: 'r',
        label: 'r',
        fullForm: 'Monthly interest rate',
        meaning: 'Annual % ÷ 12 ÷ 100. At 14% annual → r = 0.01167',
      },
      {
        id: 'n',
        label: 'n',
        fullForm: 'Number of months',
        meaning: 'How many EMIs you will pay (e.g. 12 months).',
      },
    ],
  },
  {
    title: 'THE FORMULA',
    subtitle: 'Banks use this to calculate your monthly payment',
    formula:
      'EMI = P × r × (1+r)^n ÷ [(1+r)^n − 1]\n\nExample → ₹15,000 at 14% for 12 months:\nEMI = ₹1,334/month\nTotal = ₹1,334 × 12 = ₹16,008',
    body: 'You don\'t need to memorise this — just know: longer EMI + higher rate = more extra money.',
  },
  {
    title: 'HIDDEN FEES',
    subtitle: 'Tap each button to reveal what stores hide',
    interactive: (onReady) => <EmiHiddenCostDemo onReady={onReady} />,
  },
  {
    title: 'REMEMBER THIS',
    subtitle: 'One last term',
    terms: [
      {
        id: 'gst',
        label: 'GST',
        fullForm: 'Goods and Services Tax',
        meaning: 'Even processing fees get taxed. That\'s why "0% EMI" still costs more.',
      },
    ],
    warning: 'Stores say 0% interest. They never say 0% extra charges. Always multiply EMI × months + ALL fees.',
  },
];

export default function EmiTrapLab({ chapterId }: { chapterId: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<'tutorial' | 'calc' | 'compare' | 'lesson'>('tutorial');
  const [canSkipTutorial, setCanSkipTutorial] = useState(false);

  const [aTotal, setATotal] = useState('');
  const [bEmi, setBEmi] = useState('');
  const [bTotal, setBTotal] = useState('');
  const [cTotal, setCTotal] = useState('');
  const [fineRead, setFineRead] = useState(false);
  const [offerStep, setOfferStep] = useState<OfferStep>(0);
  const [toast, setToast] = useState('');

  useEffect(() => {
    isTutorialSeen(FLAG).then((seen) => {
      setCanSkipTutorial(seen);
      if (seen) setPhase('calc');
    });
  }, []);

  const back = () => router.replace(finLabsRoadmapHref(chapterId));

  const aOk = near(parseFloat(aTotal) || 0, 15000, 1);
  const bEmiOk = near(parseFloat(bEmi) || 0, 2596, 20);
  const bTotOk = near(parseFloat(bTotal) || 0, 16164.82, 20);
  const cOk = near(parseFloat(cTotal) || 0, 16178.82, 20);
  const allOk = aOk && bEmiOk && bTotOk && cOk;

  const stepOk =
    offerStep === 0 ? aOk :
    offerStep === 1 ? bEmiOk && bTotOk :
    fineRead && cOk;

  const doneCount = [aOk, bEmiOk && bTotOk, cOk].filter(Boolean).length;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const tryCompare = () => {
    if (allOk) {
      play('coin');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setPhase('compare');
      return;
    }
    play('bad');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    if (!aOk) {
      setOfferStep(0);
      showToast('Option A: pay full = just the MRP ₹15,000');
    } else if (!bEmiOk || !bTotOk) {
      setOfferStep(1);
      showToast('Option B: add fees first, then calculate EMI on ₹15,588.82');
    } else if (!fineRead) {
      setOfferStep(2);
      showToast('Option C: read the fine print to find hidden fees');
    } else {
      setOfferStep(2);
      showToast('Option C: MRP + ₹999 fee + ₹179.82 GST = ?');
    }
  };

  const goNextOffer = () => {
    if (!stepOk) {
      tryCompare();
      return;
    }
    play('tick');
    if (offerStep < 2) setOfferStep((s) => (s + 1) as OfferStep);
    else tryCompare();
  };

  const pickFullPay = (amount: number) => {
    play('click');
    setATotal(String(amount));
    if (amount === 15000) {
      play('coin');
      setTimeout(() => setOfferStep(1), 350);
    } else {
      play('bad');
      showToast(amount === 16008 ? 'That\'s the EMI total — no fees on pay-full!' : 'Pay full = sticker price only');
    }
  };

  if (phase === 'tutorial') {
    return (
      <LabTutorial
        concept="EMI"
        conceptMeta={EMI_CONCEPT}
        pages={EMI_TUTORIAL_PAGES}
        canSkip={canSkipTutorial}
        onSkip={() => {
          setTutorialSeen(FLAG);
          setPhase('calc');
        }}
        onComplete={() => {
          setTutorialSeen(FLAG);
          setPhase('calc');
        }}
      />
    );
  }

  if (phase === 'lesson') {
    return (
      <LabScreenShell title="EMI TRAP" onBack={back}>
        <LabLessonCard
          concept="EMI & HIDDEN COSTS"
          text="Monthly amount is bait. Total outflow is the real number. Always multiply EMI × months + all fees before signing."
          onContinue={async () => {
            await setLabFlagDone(FLAG);
            back();
          }}
        />
      </LabScreenShell>
    );
  }

  if (phase === 'compare') {
    return (
      <LabScreenShell title="THE REAL COST" subtitle="Same phone · three prices" onBack={back}>
        <Text style={styles.compareIntro}>You cracked all three offers. Here&apos;s what they really cost:</Text>
        <LabPixelBars
          items={[
            { label: 'PAY FULL', value: 15000, display: '₹15,000' },
            { label: '6-MONTH EMI', value: 16165, display: '₹16,165' },
            { label: '12-MONTH 0%', value: 16179, display: '₹16,179' },
          ]}
        />
        <Text style={styles.insight}>
          12-month &quot;0%&quot; EMI was the most expensive. The maths they hoped you wouldn&apos;t do.
        </Text>
        <Pressable onPress={() => setPhase('lesson')} style={[styles.primaryBtn, { flex: undefined, marginTop: 12 }]}>
          <Text style={styles.primaryBtnText}>SEE LESSON ▶</Text>
        </Pressable>
      </LabScreenShell>
    );
  }

  return (
    <LabScreenShell
      title="NOVA X11"
      subtitle={`Offer ${offerStep + 1}/3 · MRP ₹15,000`}
      onBack={back}
      footer={
        <View>
          <View style={styles.progressRow}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.progressSeg,
                  i <= offerStep && styles.progressSegOn,
                  (i === 0 && aOk) || (i === 1 && bEmiOk && bTotOk) || (i === 2 && cOk) ? styles.progressSegDone : null,
                ]}
              />
            ))}
          </View>
          <Text style={styles.footerHint}>
            {allOk
              ? '✓ ALL 3 OFFERS SOLVED — COMPARE!'
              : stepOk
                ? `✓ OFFER ${String.fromCharCode(65 + offerStep)} DONE — TAP NEXT`
                : `${doneCount}/3 offers correct · fix red fields`}
          </Text>
          <View style={styles.footerNav}>
            {offerStep > 0 ? (
              <Pressable
                onPress={() => setOfferStep((s) => (s - 1) as OfferStep)}
                style={styles.footerBack}
              >
                <Text style={styles.footerBackText}>◀</Text>
              </Pressable>
            ) : (
              <View style={styles.footerBack} />
            )}
            <Pressable
              onPress={goNextOffer}
              style={[styles.primaryBtn, allOk && offerStep === 2 && stepOk ? null : !stepOk ? styles.primaryBtnWarn : null]}
            >
              <Text style={styles.primaryBtnText}>
                {allOk && offerStep === 2 ? 'COMPARE OPTIONS ▶' : stepOk ? 'NEXT OFFER ▶' : 'NEED A HINT ▶'}
              </Text>
            </Pressable>
          </View>
        </View>
      }
    >
      <LabToast message={toast} visible={!!toast} />
      <LabHud mood={72} age={15} wallet={0} />

      <View style={styles.phoneCard}>
        <Text style={styles.phoneEmoji}>📱</Text>
        <Text style={styles.phoneName}>NOVA X11</Text>
        <Text style={styles.phoneMrp}>MRP ₹15,000</Text>
      </View>

      <View style={styles.stepTabs}>
        {OFFER_LABELS.map((label, i) => (
          <Pressable
            key={label}
            onPress={() => setOfferStep(i as OfferStep)}
            style={[styles.stepTab, offerStep === i && styles.stepTabOn]}
          >
            <Text style={[styles.stepTabText, offerStep === i && styles.stepTabTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {offerStep === 0 && (
        <Animated.View entering={FadeInRight.duration(220)} style={styles.offerCard}>
          <Text style={styles.offerHeadline}>Pay the full price today</Text>
          <Text style={styles.offerExplain}>No EMI. No processing fee. Just the sticker price.</Text>
          <Text style={styles.pickLabel}>TAP THE CORRECT AMOUNT</Text>
          <View style={styles.chipRow}>
            {[12000, 15000, 16008].map((amt) => (
              <Pressable
                key={amt}
                onPress={() => pickFullPay(amt)}
                style={[
                  styles.chip,
                  parseFloat(aTotal) === amt && styles.chipSelected,
                  amt === 15000 && aOk && styles.chipCorrect,
                ]}
              >
                <Text style={styles.chipText}>₹{amt.toLocaleString('en-IN')}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.orDivider}>— or type it —</Text>
          <LabNumericField
            large
            label="Total you pay"
            hint="Just the MRP — nothing extra"
            value={aTotal}
            onChange={setATotal}
            correct={aOk}
            wrongHint="Pay full = ₹15,000 exactly. No fees on this option."
          />
        </Animated.View>
      )}

      {offerStep === 1 && (
        <Animated.View entering={FadeInRight.duration(220)} style={styles.offerCard}>
          <Text style={styles.offerHeadline}>6-month EMI at 14% annual</Text>
          <View style={styles.feeBreakdown}>
            <Text style={styles.feeLine}>Phone MRP          ₹15,000.00</Text>
            <Text style={styles.feeLine}>+ Processing fee     ₹499.00</Text>
            <Text style={styles.feeLine}>+ GST on fee          ₹89.82</Text>
            <Text style={styles.feeLineBold}>Loan before EMI   ₹15,588.82</Text>
          </View>
          <LabNumericField
            large
            label="Monthly EMI"
            hint="Calculate EMI on ₹15,588.82 for 6 months"
            value={bEmi}
            onChange={setBEmi}
            correct={bEmiOk}
            wrongHint="Try ~₹2,596/month (±₹20 is OK)"
          />
          <LabNumericField
            large
            label="Total paid"
            hint="EMI × 6 months (fees already in the loan)"
            value={bTotal}
            onChange={setBTotal}
            correct={bTotOk}
            wrongHint="Try ~₹16,165 total (±₹20 is OK)"
          />
        </Animated.View>
      )}

      {offerStep === 2 && (
        <Animated.View entering={FadeInRight.duration(220)} style={styles.offerCard}>
          <Text style={styles.offerHeadline}>12-month &quot;0% interest&quot;</Text>
          <Text style={styles.offerExplain}>Store claims zero interest. Find the hidden charges.</Text>
          <Pressable
            onPress={() => { play('click'); setFineRead(true); }}
            style={[styles.finePrint, fineRead && styles.finePrintDone]}
          >
            <Text style={styles.finePrintText}>
              {fineRead ? '✓ FINE PRINT OPENED' : '📄 TAP TO READ FINE PRINT'}
            </Text>
          </Pressable>
          {fineRead ? (
            <View style={styles.fineDoc}>
              <Text style={styles.fineDocText}>
                ...0% interest promotional offer...
              </Text>
              <Text style={styles.fineDocHighlight}>
                processing fee ₹999 applicable on all EMI plans
              </Text>
              <Text style={styles.fineDocHighlight}>
                GST ₹179.82 charged on processing fee
              </Text>
              <Text style={styles.fineDocText}>...terms and conditions apply...</Text>
            </View>
          ) : null}
          <LabNumericField
            large
            label="True total you pay"
            hint={fineRead ? 'MRP + processing + GST on fee' : 'Open fine print first ↑'}
            value={cTotal}
            onChange={setCTotal}
            correct={cOk}
            editable={fineRead}
            wrongHint="15000 + 999 + 179.82 = ? (±₹20 is OK)"
          />
        </Animated.View>
      )}
    </LabScreenShell>
  );
}

const styles = StyleSheet.create({
  phoneCard: {
    alignItems: 'center',
    borderWidth: 3,
    borderColor: C.yellow,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#111',
  },
  phoneEmoji: { fontSize: 44 },
  phoneName: { fontFamily: FONT.display, color: C.yellow, fontSize: 14, marginTop: 8 },
  phoneMrp: { fontFamily: FONT.body, color: '#aaa', fontSize: 24, marginTop: 4 },
  stepTabs: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  stepTab: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#333',
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#111',
  },
  stepTabOn: { borderColor: FL_GREEN, backgroundColor: '#0a1a12' },
  stepTabText: { fontFamily: FONT.body, color: '#666', fontSize: 16 },
  stepTabTextOn: { color: FL_GREEN },
  offerCard: {
    borderWidth: 3,
    borderColor: FL_GREEN,
    padding: 14,
    backgroundColor: '#0a0a0a',
  },
  offerHeadline: {
    fontFamily: FONT.body,
    color: C.white,
    fontSize: 26,
    lineHeight: 28,
    marginBottom: 8,
  },
  offerExplain: {
    fontFamily: FONT.body,
    color: '#999',
    fontSize: 22,
    lineHeight: 24,
    marginBottom: 14,
  },
  pickLabel: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 8,
  },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#444',
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#111',
  },
  chipSelected: { borderColor: C.yellow },
  chipCorrect: { borderColor: C.green, backgroundColor: '#0a1a12' },
  chipText: { fontFamily: FONT.body, color: C.white, fontSize: 22 },
  orDivider: {
    fontFamily: FONT.body,
    color: '#555',
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 10,
  },
  feeBreakdown: {
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: '#111',
    padding: 10,
    marginBottom: 14,
  },
  feeLine: { fontFamily: FONT.body, color: '#aaa', fontSize: 20, lineHeight: 26 },
  feeLineBold: {
    fontFamily: FONT.body,
    color: FL_GREEN,
    fontSize: 22,
    lineHeight: 28,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 6,
  },
  finePrint: {
    borderWidth: 2,
    borderColor: C.yellow,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#1a1500',
  },
  finePrintDone: { borderColor: FL_GREEN, backgroundColor: '#0a1a12' },
  finePrintText: { fontFamily: FONT.body, color: C.yellow, fontSize: 22 },
  fineDoc: {
    borderWidth: 2,
    borderColor: '#444',
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#111',
  },
  fineDocText: { fontFamily: FONT.body, color: '#666', fontSize: 18, lineHeight: 22 },
  fineDocHighlight: {
    fontFamily: FONT.body,
    color: C.red,
    fontSize: 20,
    lineHeight: 24,
    marginVertical: 4,
  },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  progressSeg: { flex: 1, height: 6, backgroundColor: '#333' },
  progressSegOn: { backgroundColor: '#2a5a40' },
  progressSegDone: { backgroundColor: FL_GREEN },
  footerHint: {
    fontFamily: FONT.body,
    color: '#aaa',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerNav: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  footerBack: {
    width: 48,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBackText: { fontFamily: FONT.display, color: '#888', fontSize: 14 },
  compareIntro: {
    fontFamily: FONT.body,
    color: '#bbb',
    fontSize: 22,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 14,
  },
  insight: {
    fontFamily: FONT.body,
    color: '#ccc',
    fontSize: 22,
    lineHeight: 26,
    textAlign: 'center',
    marginVertical: 12,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: FL_GREEN,
    borderWidth: 3,
    borderColor: '#000',
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnWarn: { backgroundColor: '#3a3a00', borderColor: C.yellow },
  primaryBtnText: { fontFamily: FONT.display, color: '#000', fontSize: 11, letterSpacing: 0.5 },
});
