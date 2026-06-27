import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { ZoomIn } from 'react-native-reanimated';
import {
  LabTutorial,
  LabLessonCard,
  LabScreenShell,
  TutorialPage,
  LabNumericField,
  LabTextField,
} from '@/src/components/finlabs/LabShared';
import {
  LabWhatsAppChat,
  ChatQuickReplies,
  ChatMessage,
  ChatMember,
} from '@/src/components/finlabs/LabWhatsApp';
import {
  setLabFlagDone,
  isTutorialSeen,
  setTutorialSeen,
  FL_GREEN,
  FL_YELLOW,
} from '@/src/finlabs/storage';
import { finLabsRoadmapHref } from '@/src/finlabs/routes';
import { C, FONT } from '@/src/ui/theme';
import { RateBuilderDemo } from '@/src/components/finlabs/LabTutorialDemos';
import { play } from '@/src/game/audio';

const FLAG = 'finlab_teenage_skills_done';

const SKILLS_CONCEPT = {
  acronym: 'FREELANCE',
  fullForm: 'Independent paid work using your skills',
  definition: 'You set the price, do the work, send an invoice, and get paid. Your time has a number — learn to name it.',
};

const ARJUN: ChatMember = { id: 'arjun', name: "Arjun's Kirana", avatar: '🏪', color: '#1a3a20' };

const SKILLS_TUTORIAL: TutorialPage[] = [
  {
    title: 'PRICE YOUR WORK',
    showConcept: true,
    terms: [
      { id: 'rate', label: 'RATE', fullForm: 'Price per hour', meaning: 'Low rate = endless revisions. Price signals quality.' },
      { id: 'buf', label: '×1.2', fullForm: 'Revision buffer', meaning: 'Add 20% for edits clients always ask for.' },
    ],
    interactive: (onReady) => <RateBuilderDemo onReady={onReady} />,
    formula: '2 hrs × Rs 300 × 1.2 = Rs 720 per poster',
  },
  {
    title: 'CLIENTS DM YOU',
    body: 'In this lab, a shop owner slides into your Instagram DMs. You quote, negotiate, invoice — all in chat. Just like real freelance work.',
    terms: [
      { id: 'upi', label: 'UPI', fullForm: 'Unified Payments Interface', meaning: 'How clients pay you — yourname@bank' },
    ],
  },
];

type ChatPhase = 'intro' | 'quote' | 'nego' | 'invoice' | 'paid';

let msgId = 0;
const nid = () => `s${++msgId}`;

export default function SkillsLab({ chapterId }: { chapterId: string }) {
  const router = useRouter();
  const [screen, setScreen] = useState<'tutorial' | 'dm' | 'lesson'>('tutorial');
  const [canSkip, setCanSkip] = useState(false);
  const [chatPhase, setChatPhase] = useState<ChatPhase>('intro');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState<{ name: string; avatar: string } | null>(null);
  const [hours, setHours] = useState('2');
  const [rate, setRate] = useState('300');
  const [agreed, setAgreed] = useState(0);
  const [mood, setMood] = useState(70);
  const [upi, setUpi] = useState('');
  const introRef = useRef(false);

  const back = () => router.replace(finLabsRoadmapHref(chapterId));
  const h = parseFloat(hours) || 0;
  const r = parseFloat(rate) || 0;
  const quote = Math.round(h * r * 1.2);
  const upiOk = upi.includes('@') && upi.length > 5;

  const push = useCallback((msg: Omit<ChatMessage, 'id'>) => {
    setMessages((prev) => [...prev, { ...msg, id: nid() }]);
  }, []);

  const arjunSays = useCallback((text: string) => {
    play('tick');
    push({ senderId: 'arjun', senderName: ARJUN.name, avatar: ARJUN.avatar, text, time: '2:14 PM' });
  }, [push]);

  const youSay = useCallback((text: string) => {
    play('click');
    push({ senderId: 'you', senderName: 'You', avatar: '🎨', text, isPlayer: true, time: '2:14 PM' });
  }, [push]);

  const arjunTyping = (ms: number) =>
    new Promise<void>((res) => {
      setTyping({ name: ARJUN.name, avatar: ARJUN.avatar });
      setTimeout(() => { setTyping(null); res(); }, ms);
    });

  const runDmIntro = useCallback(async () => {
    if (introRef.current) return;
    introRef.current = true;
    play('whoosh');
    await arjunTyping(800);
    arjunSays('Hi! 👋 I run a kirana shop near your colony.');
    await new Promise((r) => setTimeout(r, 700));
    await arjunTyping(600);
    arjunSays('Need a SALE poster for Instagram. You do Canva designs na?');
    await new Promise((r) => setTimeout(r, 600));
    await arjunTyping(500);
    arjunSays('How much for 1 poster? Need by Sunday 🙏');
    setChatPhase('quote');
  }, [arjunSays]);

  useEffect(() => {
    isTutorialSeen(FLAG).then((s) => {
      setCanSkip(s);
      if (s) setScreen('dm');
    });
  }, []);

  useEffect(() => {
    if (screen === 'dm' && messages.length === 0) runDmIntro();
  }, [screen, messages.length, runDmIntro]);

  const startDm = () => {
    introRef.current = false;
    msgId = 0;
    setMessages([]);
    setChatPhase('intro');
    setAgreed(0);
    setMood(70);
    setUpi('');
    setScreen('dm');
  };

  const sendQuote = () => {
    if (quote < 100) {
      youSay(`Rs ${quote} ok?`);
      setTimeout(() => {
        arjunSays('DONE! 🎉');
        arjunSays('(He would have paid Rs 400 — you underpriced by Rs 300)');
        setMood((m) => m - 5);
        setAgreed(quote);
        setChatPhase('paid');
        play('bad');
      }, 600);
      return;
    }
    if (quote > 2000) {
      youSay(`My quote: Rs ${quote}`);
      setTimeout(() => {
        arjunSays("That's too much for a small shop sorry 🙏");
        play('bad');
      }, 500);
      return;
    }
    youSay(`My quote: Rs ${quote} (2 hrs work + revisions)`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setTimeout(async () => {
      await arjunTyping(700);
      arjunSays('Bhai Rs 150 kar do, chhota sa kaam hai');
      setChatPhase('nego');
    }, 500);
  };

  useEffect(() => {
    if (screen === 'tutorial') return;
    if (chatPhase === 'paid' && agreed > 0) {
      const t = setTimeout(() => setScreen('lesson'), 2000);
      return () => clearTimeout(t);
    }
  }, [chatPhase, agreed, screen]);

  if (screen === 'tutorial') {
    return (
      <LabTutorial
        concept="FREELANCE"
        conceptMeta={SKILLS_CONCEPT}
        pages={SKILLS_TUTORIAL}
        canSkip={canSkip}
        onSkip={() => { setTutorialSeen(FLAG); startDm(); }}
        onComplete={() => { setTutorialSeen(FLAG); startDm(); }}
      />
    );
  }

  if (screen === 'lesson') {
    return (
      <LabScreenShell title="SELL YOUR SKILLS" onBack={back}>
        <LabLessonCard
          concept="PRICING & FREELANCE"
          text="Your skills have value. Setting a price isn't greedy — it's knowing what your time is worth. An invoice protects you."
          onContinue={async () => {
            await setLabFlagDone(FLAG);
            back();
          }}
        />
      </LabScreenShell>
    );
  }

  const quoteOverlay =
    chatPhase === 'quote' ? (
      <View style={styles.overlayPanel}>
        <Text style={styles.overlayTitle}>💼 BUILD YOUR QUOTE</Text>
        <LabNumericField large label="Hours" value={hours} onChange={setHours} prefix="" />
        <LabNumericField large label="Rate per hour" value={rate} onChange={setRate} />
        <Text style={styles.quotePreview}>Your price: Rs {quote} (×1.2 buffer)</Text>
        {quote < 100 ? <Text style={styles.warn}>Too low — he'll grab it instantly</Text> : null}
        {quote > 2000 ? <Text style={styles.warn}>Too high — he'll walk away</Text> : null}
        <Pressable
          onPress={sendQuote}
          disabled={h <= 0 || r <= 0}
          style={[styles.sendBtn, (h <= 0 || r <= 0) && styles.sendBtnOff]}
        >
          <Text style={styles.sendBtnText}>SEND QUOTE IN CHAT ▶</Text>
        </Pressable>
      </View>
    ) : null;

  const invoiceOverlay =
    chatPhase === 'invoice' ? (
      <View style={styles.overlayPanel}>
        <Text style={styles.overlayTitle}>🧾 SEND INVOICE · Rs {agreed}</Text>
        <LabTextField
          label="Your UPI ID"
          value={upi}
          onChange={setUpi}
          hint="e.g. yourname@oksbi"
        />
        <Pressable
          disabled={!upiOk}
          onPress={() => {
            youSay(`Invoice sent ✓ Rs ${agreed} · Pay to ${upi}`);
            play('coin');
            setTimeout(async () => {
              await arjunTyping(900);
              arjunSays(`Paid! Rs ${agreed} sent 🎉`);
              setChatPhase('paid');
              setMood((m) => m + 10);
              play('win');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            }, 500);
          }}
          style={[styles.sendBtn, !upiOk && styles.sendBtnOff]}
        >
          <Text style={styles.sendBtnText}>SEND INVOICE ▶</Text>
        </Pressable>
      </View>
    ) : null;

  let footer: React.ReactNode = null;

  if (chatPhase === 'intro') {
    footer = (
      <ChatQuickReplies
        options={[{
          label: 'Yes! I do Canva posters 🎨',
          color: FL_GREEN,
          onPress: () => {
            youSay('Yes! I do Canva posters 🎨');
            setChatPhase('quote');
          },
        }]}
      />
    );
  } else if (chatPhase === 'nego') {
    footer = (
      <ChatQuickReplies
        options={[
          {
            label: `Counter: Rs ${quote} — fair price 💪`,
            color: FL_GREEN,
            onPress: () => {
              const mid = Math.round((quote + 150) / 2);
              youSay(`Best I can do is Rs ${quote} — includes 2 revisions`);
              setTimeout(async () => {
                await arjunTyping(800);
                arjunSays(`Theek hai Rs ${mid} chalega?`);
                setTimeout(() => {
                  youSay(`Deal — Rs ${mid} 🤝`);
                  setAgreed(mid);
                  setMood((m) => m + 4);
                  setChatPhase('invoice');
                }, 400);
              }, 500);
            },
          },
          {
            label: 'Ok Rs 150 (too low 😬)',
            color: C.red,
            onPress: () => {
              youSay('Ok Rs 150 fine');
              setAgreed(150);
              setMood((m) => m - 3);
              setTimeout(() => arjunSays('Done! Send poster by Sunday'), 400);
              setChatPhase('invoice');
            },
          },
          {
            label: `Firm at Rs ${quote} — final`,
            color: C.yellow,
            onPress: () => {
              youSay(`Rs ${quote} is my final price — quality work guaranteed`);
              setTimeout(async () => {
                await arjunTyping(700);
                arjunSays(`Ok deal Rs ${quote}! 👍`);
                setAgreed(quote);
                setMood((m) => m + 8);
                setChatPhase('invoice');
              }, 500);
            },
          },
        ]}
      />
    );
  } else if (chatPhase === 'paid') {
    footer = (
      <Animated.View entering={ZoomIn} style={styles.paidBanner}>
        <Text style={styles.paidText}>Rs {agreed} RECEIVED · MOOD +{agreed >= 300 ? 10 : -3}</Text>
      </Animated.View>
    );
  }

  return (
    <LabWhatsAppChat
      title="arjun_kirana"
      subtitle="Instagram · Active now"
      members={[ARJUN]}
      messages={messages}
      typing={typing}
      onBack={back}
      footer={chatPhase === 'quote' || chatPhase === 'invoice' ? undefined : footer}
      overlay={quoteOverlay ?? invoiceOverlay}
    />
  );
}

const styles = StyleSheet.create({
  overlayPanel: {
    padding: 14,
    borderTopWidth: 3,
    borderTopColor: FL_YELLOW,
    backgroundColor: '#0a0a0a',
  },
  overlayTitle: {
    fontFamily: FONT.body,
    color: FL_YELLOW,
    fontSize: 22,
    marginBottom: 10,
  },
  quotePreview: {
    fontFamily: FONT.body,
    color: FL_GREEN,
    fontSize: 24,
    marginVertical: 8,
  },
  warn: { fontFamily: FONT.body, color: C.red, fontSize: 18, marginBottom: 8 },
  sendBtn: {
    backgroundColor: FL_GREEN,
    borderWidth: 3,
    borderColor: '#000',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  sendBtnOff: { opacity: 0.4, backgroundColor: '#444' },
  sendBtnText: { fontFamily: FONT.display, color: '#000', fontSize: 11 },
  paidBanner: {
    backgroundColor: '#0a2a1a',
    borderWidth: 2,
    borderColor: FL_GREEN,
    padding: 14,
    alignItems: 'center',
  },
  paidText: { fontFamily: FONT.display, color: FL_GREEN, fontSize: 11, letterSpacing: 1 },
});
