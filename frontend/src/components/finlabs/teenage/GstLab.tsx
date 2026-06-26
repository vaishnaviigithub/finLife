import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  LabTutorial,
  LabLessonCard,
  LabScreenShell,
  TutorialPage,
} from '@/src/components/finlabs/LabShared';
import {
  setLabFlagDone,
  isTutorialSeen,
  setTutorialSeen,
  FL_GREEN,
} from '@/src/finlabs/storage';
import { finLabsRoadmapHref } from '@/src/finlabs/routes';
import { C, FONT } from '@/src/ui/theme';
import { GstSplitDemo, ServiceChargeDemo } from '@/src/components/finlabs/LabTutorialDemos';
import { play } from '@/src/game/audio';

const FLAG = 'finlab_teenage_gst_done';

const GST_CONCEPT = {
  acronym: 'GST',
  fullForm: 'Goods and Services Tax',
  definition:
    'One national tax on goods and services. Shops and restaurants collect it for the government — it is not their profit.',
};

type BillLine = {
  id: string;
  label: string;
  illegal: boolean;
  why: string;
};

type Bill = {
  id: string;
  name: string;
  place: string;
  note: string;
  lines: BillLine[];
};

const BILLS: Bill[] = [
  {
    id: 'b1',
    name: 'Spicy Bites',
    place: 'Table 7 · Dine-in',
    note: 'Regular AC restaurant — food GST is 5% total (2.5% CGST + 2.5% SGST).',
    lines: [
      { id: 'food', label: 'Food subtotal: ₹810.00', illegal: false, why: 'Correct food total.' },
      { id: 'cgst', label: 'CGST @ 2.5%: ₹20.25', illegal: false, why: 'Correct half of 5% GST.' },
      { id: 'sgst', label: 'SGST @ 2.5%: ₹20.25', illegal: false, why: 'Correct half of 5% GST.' },
      { id: 'svc', label: 'Service charge @ 10%: ₹81.00', illegal: true, why: 'Service charge cannot be forced on you (CCPA 2022). You can refuse it.' },
      { id: 'tot', label: 'Total payable: ₹931.50', illegal: false, why: 'Math is fine — but remove the service charge line.' },
    ],
  },
  {
    id: 'b2',
    name: 'Campus Canteen',
    place: 'Counter · Dine-in',
    note: 'School/college canteens charge 5% GST on food — not 18%.',
    lines: [
      { id: 'food', label: 'Thali + juice: ₹200.00', illegal: false, why: 'Correct subtotal.' },
      { id: 'gst18', label: 'GST @ 18%: ₹36.00', illegal: true, why: 'Regular canteen food should be 5% GST, not 18%.' },
      { id: 'tot', label: 'Total: ₹236.00', illegal: false, why: 'Total follows their wrong GST — flag the 18% line.' },
    ],
  },
  {
    id: 'b3',
    name: 'Pizza Hub',
    place: 'Dine-in · Not takeaway',
    note: 'You ate inside — packaging fees should not appear.',
    lines: [
      { id: 'food', label: 'Pizza + garlic bread: ₹450.00', illegal: false, why: 'Correct subtotal.' },
      { id: 'gst', label: 'GST @ 5%: ₹22.50', illegal: false, why: 'Correct GST on food.' },
      { id: 'pack', label: 'Packaging charge: ₹30.00', illegal: true, why: 'Dine-in bill — no packaging or box charge.' },
      { id: 'tot', label: 'Total: ₹502.50', illegal: false, why: 'Remove packaging to pay ₹472.50.' },
    ],
  },
  {
    id: 'b4',
    name: 'Grand Hotel Restaurant',
    place: 'Luxury hotel · Room > ₹7,500/night',
    note: '18% GST on food is allowed here — but extra fees still are not.',
    lines: [
      { id: 'food', label: 'Continental meal: ₹400.00', illegal: false, why: 'Correct subtotal.' },
      { id: 'cgst', label: 'CGST @ 9%: ₹36.00', illegal: false, why: 'Correct — half of 18% GST.' },
      { id: 'sgst', label: 'SGST @ 9%: ₹36.00', illegal: false, why: 'Correct — half of 18% GST.' },
      { id: 'svc', label: 'Service charge @ 10%: ₹40.00', illegal: true, why: 'Still optional — not a government tax.' },
      { id: 'tot', label: 'Total: ₹512.00', illegal: false, why: 'GST lines are fine; refuse service charge.' },
    ],
  },
  {
    id: 'b5',
    name: 'Chai & Snacks Corner',
    place: 'Quick bite · Dine-in',
    note: 'Watch for fake fees dressed up as tips or convenience charges.',
    lines: [
      { id: 'food', label: 'Samosa + chai: ₹120.00', illegal: false, why: 'Correct subtotal.' },
      { id: 'gst', label: 'GST @ 5%: ₹6.00', illegal: false, why: 'Correct GST.' },
      { id: 'tip', label: 'Mandatory gratuity: ₹15.00', illegal: true, why: 'Same as forced service charge — you can say no.' },
      { id: 'fee', label: 'Convenience fee: ₹20.00', illegal: true, why: 'Not a real tax. Challenge random add-on fees.' },
      { id: 'tot', label: 'Total: ₹161.00', illegal: false, why: 'Pay ₹126 without the illegal extras.' },
    ],
  },
];

export default function GstLab({ chapterId }: { chapterId: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<'tutorial' | 'exercise' | 'final' | 'lesson'>('tutorial');
  const [canSkip, setCanSkip] = useState(false);
  const [billIdx, setBillIdx] = useState(0);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [toast, setToast] = useState('');

  useEffect(() => {
    isTutorialSeen(FLAG).then((s) => {
      setCanSkip(s);
      if (s) setPhase('exercise');
    });
  }, []);

  const back = () => router.replace(finLabsRoadmapHref(chapterId));
  const bill = BILLS[billIdx];
  const illegalIds = bill.lines.filter((l) => l.illegal).map((l) => l.id);
  const flaggedIllegal = illegalIds.filter((id) => flagged.has(id)).length;
  const allIllegalFound = illegalIds.every((id) => flagged.has(id));
  const wronglyFlagged = bill.lines.some((l) => !l.illegal && flagged.has(l.id));
  const canNextBill = allIllegalFound && !wronglyFlagged;

  const toggleLine = (line: BillLine) => {
    play('click');
    const next = new Set(flagged);
    if (next.has(line.id)) {
      next.delete(line.id);
      setToast('');
    } else {
      next.add(line.id);
      if (line.illegal) {
        play('coin');
        setToast(line.why);
      } else {
        play('bad');
        setToast(`That line is OK — ${line.why}`);
      }
    }
    setFlagged(next);
  };

  const finishBill = () => {
    if (!canNextBill) return;
    const pts = illegalIds.length;
    setScore((s) => s + pts);
    play('win');
    if (billIdx + 1 >= BILLS.length) {
      setPhase('final');
    } else {
      setBillIdx((i) => i + 1);
      setFlagged(new Set());
      setToast('');
    }
  };

  const maxScore = BILLS.reduce((s, b) => s + b.lines.filter((l) => l.illegal).length, 0);

  const tutorialPages: TutorialPage[] = [
    {
      title: 'WHAT IS GST?',
      showConcept: true,
      terms: [
        {
          id: 'gst',
          label: 'GST',
          fullForm: 'Goods and Services Tax',
          meaning: 'National tax since July 2017. You pay it; the shop just collects it for the government.',
        },
      ],
      body: 'GST is printed on bills as CGST + SGST (within your state) or IGST (across states). It is never the restaurant\'s bonus money.',
    },
    {
      title: 'COMMON GST RATES',
      terms: [
        { id: 'r5', label: '5%', fullForm: 'Most restaurant food', meaning: 'Dhabas, canteens, pizza places — dine-in or takeaway.' },
        { id: 'r12', label: '12%', fullForm: 'Some packaged foods', meaning: 'Certain packaged snacks & items — not typical restaurant meals.' },
        { id: 'r18', label: '18%', fullForm: 'Luxury hotel restaurants', meaning: 'Only when the hotel room tariff is above ₹7,500/night.' },
      ],
      formula: 'Regular meal out → usually 5%\nLuxury hotel restaurant → 18%\nAlways read the % on the bill',
    },
    {
      title: 'CGST + SGST',
      terms: [
        {
          id: 'cgst',
          label: 'CGST',
          fullForm: 'Central GST',
          meaning: 'Half of the total GST goes to the central government.',
        },
        {
          id: 'sgst',
          label: 'SGST',
          fullForm: 'State GST',
          meaning: 'The other half goes to your state. Always equals CGST on local bills.',
        },
      ],
      interactive: (onReady) => <GstSplitDemo onReady={onReady} />,
      formula: '5% total = 2.5% CGST + 2.5% SGST\n₹400 food → ₹10 + ₹10 → ₹420 total',
    },
    {
      title: 'NOT A TAX',
      terms: [
        {
          id: 'svc',
          label: 'SERVICE CHARGE',
          fullForm: 'Optional restaurant fee',
          meaning: 'NOT GST. NOT a government tax. Since 2022 you can refuse it.',
        },
      ],
      interactive: (onReady) => <ServiceChargeDemo onReady={onReady} />,
      warning: 'Also watch for "gratuity", "convenience fee", or "packaging charge" on dine-in bills.',
    },
    {
      title: 'YOUR MISSION',
      body: 'You will see 5 real-looking bills. Tap every line that should NOT be charged — wrong GST %, forced service charge, packaging on dine-in, or fake fees.',
      formula: 'Flag illegal lines only\nTap NEXT when all problems are found\nHelpline: 1800-11-4000',
    },
  ];

  if (phase === 'tutorial') {
    return (
      <LabTutorial
        concept="GST"
        conceptMeta={GST_CONCEPT}
        pages={tutorialPages}
        canSkip={canSkip}
        onSkip={() => { setTutorialSeen(FLAG); setPhase('exercise'); }}
        onComplete={() => { setTutorialSeen(FLAG); setPhase('exercise'); }}
      />
    );
  }

  if (phase === 'lesson') {
    return (
      <LabScreenShell title="RESTAURANT GST" onBack={back}>
        <LabLessonCard
          concept="READ EVERY BILL"
          text="Most meals = 5% GST. Luxury hotel restaurants = 18%. Service charge and random fees are optional — challenge them politely before you pay."
          onContinue={async () => {
            await setLabFlagDone(FLAG);
            back();
          }}
        />
        <View style={styles.refCard}>
          <Text style={styles.refTitle}>QUICK REF</Text>
          <Text style={styles.refLine}>Food out → 5% GST (2.5% + 2.5%)</Text>
          <Text style={styles.refLine}>Luxury hotel → 18% GST</Text>
          <Text style={styles.refLine}>Service charge · packaging · fake fees → refuse</Text>
        </View>
      </LabScreenShell>
    );
  }

  if (phase === 'final') {
    const tag =
      score >= maxScore ? 'BILL DETECTIVE 🔍' :
      score >= maxScore - 2 ? 'SMART DINER ✅' :
      score >= 3 ? 'LEARNING THE ROPES 📚' : 'KEEP PRACTISING 💪';
    return (
      <LabScreenShell title="ALL 5 BILLS CHECKED 🧾" onBack={back}>
        <Text style={styles.scoreBig}>{score} / {maxScore} FLAGS</Text>
        <View style={styles.tagBox}><Text style={styles.tagText}>{tag}</Text></View>
        <Pressable onPress={() => setPhase('lesson')} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>SEE LESSON ▶</Text>
        </Pressable>
      </LabScreenShell>
    );
  }

  return (
    <LabScreenShell
      title={`BILL ${billIdx + 1} / ${BILLS.length}`}
      subtitle={`${bill.name} · ${bill.place}`}
      onBack={back}
      footer={
        <Pressable
          disabled={!canNextBill}
          onPress={finishBill}
          style={[styles.primaryBtn, !canNextBill && styles.primaryBtnOff]}
        >
          <Text style={styles.primaryBtnText}>
            {canNextBill
              ? billIdx + 1 >= BILLS.length
                ? 'FINISH ALL BILLS ▶'
                : 'NEXT BILL ▶'
              : `FIND ${illegalIds.length - flaggedIllegal} MORE PROBLEM${illegalIds.length - flaggedIllegal === 1 ? '' : 'S'}`}
          </Text>
        </Pressable>
      }
    >
      <Text style={styles.billNote}>{bill.note}</Text>
      <Text style={styles.hint}>Tap lines that should NOT be on your bill</Text>
      <Text style={styles.progress}>
        Found {flaggedIllegal} / {illegalIds.length} problems
        {wronglyFlagged ? ' · un-flag correct lines' : ''}
      </Text>

      <View style={styles.receipt}>
        <Text style={styles.receiptTitle}>{bill.name.toUpperCase()}</Text>
        <Text style={styles.receiptSub}>{bill.place}</Text>
        <View style={styles.divider} />
        {bill.lines.map((line) => {
          const isFlagged = flagged.has(line.id);
          const showBad = isFlagged && line.illegal;
          const showWrongPick = isFlagged && !line.illegal;
          return (
            <Pressable
              key={line.id}
              onPress={() => toggleLine(line)}
              style={[
                styles.lineRow,
                showBad && styles.lineBad,
                showWrongPick && styles.lineWrongPick,
                isFlagged && line.illegal && styles.lineFlaggedOk,
              ]}
            >
              <Text style={styles.lineText}>{line.label}</Text>
              {isFlagged ? (
                <Text style={[styles.lineMark, showWrongPick && styles.lineMarkWrong]}>
                  {line.illegal ? '🚩' : '✗'}
                </Text>
              ) : null}
              {isFlagged ? <Text style={styles.lineWhy}>{line.why}</Text> : null}
            </Pressable>
          );
        })}
      </View>

      {toast ? <Text style={styles.toast}>{toast}</Text> : null}
    </LabScreenShell>
  );
}

const styles = StyleSheet.create({
  billNote: {
    fontFamily: FONT.body,
    color: C.yellow,
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 22,
  },
  hint: { fontFamily: FONT.body, color: '#888', fontSize: 15, marginBottom: 4 },
  progress: { fontFamily: FONT.display, color: FL_GREEN, fontSize: 9, marginBottom: 10, letterSpacing: 1 },
  receipt: {
    borderWidth: 2,
    borderColor: '#444',
    padding: 12,
    backgroundColor: '#111',
    marginBottom: 12,
  },
  receiptTitle: { fontFamily: FONT.display, color: FL_GREEN, fontSize: 10, letterSpacing: 1 },
  receiptSub: { fontFamily: FONT.body, color: '#888', fontSize: 14, marginTop: 2, marginBottom: 8 },
  divider: { height: 2, backgroundColor: '#333', marginBottom: 8 },
  lineRow: {
    borderWidth: 2,
    borderColor: '#333',
    padding: 10,
    marginBottom: 6,
    backgroundColor: '#0a0a0a',
  },
  lineBad: { borderColor: C.red, backgroundColor: '#1a0808' },
  lineWrongPick: { borderColor: C.yellow, backgroundColor: '#1a1508' },
  lineFlaggedOk: { borderColor: C.red },
  lineText: { fontFamily: FONT.body, color: '#ddd', fontSize: 16 },
  lineMark: { fontFamily: FONT.display, color: C.red, fontSize: 12, marginTop: 4 },
  lineMarkWrong: { color: C.yellow },
  lineWhy: { fontFamily: FONT.body, color: C.yellow, fontSize: 13, marginTop: 6, lineHeight: 18 },
  toast: {
    fontFamily: FONT.body,
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  scoreBig: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 28,
    textAlign: 'center',
    marginVertical: 16,
  },
  tagBox: { borderWidth: 2, borderColor: C.yellow, padding: 12, marginBottom: 16 },
  tagText: { fontFamily: FONT.display, color: C.yellow, fontSize: 10, textAlign: 'center' },
  refCard: { borderWidth: 2, borderColor: '#444', padding: 12, marginTop: 12 },
  refTitle: { fontFamily: FONT.display, color: FL_GREEN, fontSize: 9, marginBottom: 6 },
  refLine: { fontFamily: FONT.body, color: '#aaa', fontSize: 14, marginBottom: 4 },
  primaryBtn: {
    backgroundColor: FL_GREEN,
    borderWidth: 3,
    borderColor: '#000',
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnOff: { opacity: 0.35, backgroundColor: '#444' },
  primaryBtnText: { fontFamily: FONT.display, color: '#000', fontSize: 10, textAlign: 'center' },
});
