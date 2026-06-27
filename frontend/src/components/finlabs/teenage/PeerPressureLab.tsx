import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp } from 'react-native-reanimated';
import {
  LabTutorial,
  LabLessonCard,
  LabStatBar,
  LabScreenShell,
  TutorialPage,
} from '@/src/components/finlabs/LabShared';
import {
  LabWhatsAppChat,
  ChatQuickReplies,
  ChatStatStrip,
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
import { OpportunityForkDemo } from '@/src/components/finlabs/LabTutorialDemos';
import { play } from '@/src/game/audio';

const FLAG = 'finlab_teenage_peer_done';
const START_WALLET = 800;

const PEER_CONCEPT = {
  acronym: 'PEER PRESSURE',
  fullForm: 'Social spending vs saving',
  definition:
    'Friends invite you via chats every weekend. Every yes costs money. Every no saves money but has a social cost. Balance both.',
};

const SQUAD: ChatMember[] = [
  { id: 'priya', name: 'Priya', avatar: '👩', color: '#4a2040' },
  { id: 'rohan', name: 'Rohan', avatar: '🧑', color: '#203a4a' },
  { id: 'arjun', name: 'Arjun', avatar: '😎', color: '#3a3a10' },
];

const MENU = [
  { id: 'burger', label: '🍔 Burger', price: 120 },
  { id: 'pizza', label: '🍕 Pizza', price: 90 },
  { id: 'drink', label: '🥤 Drink', price: 40 },
  { id: 'fries', label: '🍟 Fries', price: 60 },
  { id: 'momos', label: '🥟 Momos', price: 70 },
  { id: 'water', label: '💧 Water', price: 20 },
];

const PEER_TUTORIAL: TutorialPage[] = [
  {
    title: 'OPPORTUNITY COST',
    showConcept: true,
    terms: [
      {
        id: 'oc',
        label: 'OC',
        fullForm: 'Opportunity Cost',
        meaning: 'What you give up when you pick one plan over another.',
      },
    ],
    interactive: (onReady) => <OpportunityForkDemo onReady={onReady} />,
    formula: 'Rs 350/week × 52 = Rs 18,200/year saved if you skip every movie',
  },
  {
    title: 'IT STARTS IN THE GROUP CHAT',
    body: 'In this lab, your friends text you on WhatsApp all Saturday. Every reply changes your wallet AND your social standing.',
    terms: [
      {
        id: 'social',
        label: 'SOCIAL',
        fullForm: 'Friend-group standing (0–100)',
        meaning: 'Skip too much → friends stop inviting you. Say yes to everything → wallet hits zero.',
      },
    ],
  },
];

let msgCounter = 0;
function nextId() {
  msgCounter += 1;
  return `m${msgCounter}`;
}

export default function PeerPressureLab({ chapterId }: { chapterId: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<'tutorial' | 'sat' | 'report' | 'lesson'>('tutorial');
  const [canSkip, setCanSkip] = useState(false);
  const [wallet, setWallet] = useState(START_WALLET);
  const [mood, setMood] = useState(72);
  const [social, setSocial] = useState(60);
  const [step, setStep] = useState(0);
  const [goingMovie, setGoingMovie] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState<{ name: string; avatar: string } | null>(null);
  const introDone = useRef(false);
  const bdaySent = useRef(false);

  const back = () => router.replace(finLabsRoadmapHref(chapterId));
  const orderTotal = order.reduce((s, id) => s + (MENU.find((m) => m.id === id)?.price ?? 0), 0);

  const member = (id: string) => SQUAD.find((m) => m.id === id)!;

  const pushMsg = useCallback((msg: Omit<ChatMessage, 'id'>) => {
    setMessages((prev) => [...prev, { ...msg, id: nextId() }]);
  }, []);

  const friendSays = useCallback(
    (senderId: string, text: string) => {
      const m = member(senderId);
      play('tick');
      pushMsg({
        senderId,
        senderName: m.name,
        avatar: m.avatar,
        text,
        time: '10:15',
      });
    },
    [pushMsg],
  );

  const playerSays = useCallback(
    (text: string) => {
      play('click');
      pushMsg({
        senderId: 'you',
        senderName: 'You',
        avatar: '🙂',
        text,
        isPlayer: true,
        time: '10:16',
      });
    },
    [pushMsg],
  );

  const showTyping = (senderId: string, ms: number) =>
    new Promise<void>((resolve) => {
      const m = member(senderId);
      setTyping({ name: m.name, avatar: m.avatar });
      setTimeout(() => {
        setTyping(null);
        resolve();
      }, ms);
    });

  const runIntro = useCallback(async () => {
    if (introDone.current) return;
    introDone.current = true;
    play('whoosh');
    await showTyping('priya', 700);
    friendSays('priya', "yooo saturday squad 🎬 who's free today??");
    await new Promise((r) => setTimeout(r, 900));
    await showTyping('rohan', 600);
    friendSays('rohan', 'new movie dropped — show at 3 PM!');
    await new Promise((r) => setTimeout(r, 800));
    await showTyping('arjun', 600);
    friendSays('arjun', 'Rs 250 ticket + Rs 80 snacks each?? 🍿');
  }, [friendSays]);

  useEffect(() => {
    isTutorialSeen(FLAG).then((s) => {
      setCanSkip(s);
      if (s) setPhase('sat');
    });
  }, []);

  useEffect(() => {
    if (phase === 'sat' && messages.length === 0) {
      runIntro();
    }
  }, [phase, messages.length, runIntro]);

  const startSat = () => {
    introDone.current = false;
    bdaySent.current = false;
    msgCounter = 0;
    setMessages([]);
    setStep(0);
    setGoingMovie(false);
    setOrder([]);
    setWallet(START_WALLET);
    setSocial(60);
    setMood(72);
    setPhase('sat');
  };

  useEffect(() => {
    if (phase === 'sat' && step === 3 && !bdaySent.current) {
      bdaySent.current = true;
      const t = setTimeout(() => friendSays('priya', 'impromptu bday at CCD 🎂 Rs 200 each?'), 500);
      return () => clearTimeout(t);
    }
  }, [phase, step, friendSays]);

  if (phase === 'tutorial') {
    return (
      <LabTutorial
        concept="PEER PRESSURE"
        conceptMeta={PEER_CONCEPT}
        pages={PEER_TUTORIAL}
        canSkip={canSkip}
        onSkip={() => { setTutorialSeen(FLAG); startSat(); }}
        onComplete={() => { setTutorialSeen(FLAG); startSat(); }}
      />
    );
  }

  if (phase === 'lesson') {
    return (
      <LabScreenShell title="PEER PRESSURE" onBack={back}>
        <LabLessonCard
          concept="OPPORTUNITY COST"
          text="Every decision has a number attached. Social spending is real spending. A budget that ignores your social life isn't one you'll keep."
          onContinue={async () => {
            await setLabFlagDone(FLAG);
            back();
          }}
        />
      </LabScreenShell>
    );
  }

  if (phase === 'report') {
    const tag =
      wallet > 600 && social > 50 ? 'BALANCED WEEKEND 🎯' :
      wallet > 600 ? 'SAVER 🐷' :
      social > 80 ? 'SOCIAL BUTTERFLY 🦋' :
      wallet < 100 ? 'SPENT IT ALL 😅' :
      social < 30 ? 'LONE WOLF 🐺' : 'YOU SURVIVED 💪';
    return (
      <LabScreenShell title="SATURDAY REPORT" onBack={back}>
        <Text style={styles.reportTitle}>YOUR SATURDAY IN NUMBERS</Text>
        <LabStatBar label="WALLET" value={wallet} max={START_WALLET} color={FL_GREEN} />
        <LabStatBar label="SOCIAL" value={social} max={100} color={C.blue} />
        <View style={styles.tagBox}><Text style={styles.tagText}>{tag}</Text></View>
        <Pressable onPress={() => setPhase('lesson')} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>SEE LESSON ▶</Text>
        </Pressable>
      </LabScreenShell>
    );
  }

  const foodOverlay =
    step === 1 && goingMovie ? (
      <Animated.View entering={FadeInUp} style={styles.menuPanel}>
        <Text style={styles.menuTitle}>🍔 FOOD COURT · Budget Rs 200</Text>
        <Text style={styles.menuTotal}>Your order: Rs {orderTotal} / Rs 200</Text>
        <View style={styles.menuGrid}>
          {MENU.map((m) => {
            const canAdd = orderTotal + m.price <= 200;
            const count = order.filter((id) => id === m.id).length;
            return (
              <Pressable
                key={m.id}
                disabled={!canAdd}
                onPress={() => { setOrder((o) => [...o, m.id]); play('click'); }}
                style={[styles.menuItem, !canAdd && styles.menuOff, count > 0 && styles.menuSel]}
              >
                <Text style={styles.menuItemText}>{m.label}</Text>
                <Text style={styles.menuPrice}>Rs {m.price}</Text>
                {count > 0 ? <Text style={styles.menuCount}>×{count}</Text> : null}
              </Pressable>
            );
          })}
        </View>
        <Pressable
          onPress={() => {
            setWallet((w) => w - orderTotal);
            setMood((m) => m + order.length * 3);
            playerSays(`Ordered food · Rs ${orderTotal} 🍔`);
            setTimeout(() => friendSays('rohan', 'nice order 😋 see u at the movie'), 400);
            setStep(2);
          }}
          style={styles.menuConfirm}
        >
          <Text style={styles.menuConfirmText}>CONFIRM ORDER ▶</Text>
        </Pressable>
      </Animated.View>
    ) : null;

  let footer: React.ReactNode = null;

  if (step === 0) {
    footer = (
      <ChatQuickReplies
        options={[
          {
            label: "I'm in! Rs 330 total 🎬",
            color: FL_GREEN,
            onPress: () => {
              setWallet((w) => w - 330);
              setMood((m) => m + 8);
              setSocial((s) => s + 10);
              setGoingMovie(true);
              playerSays("I'm in! Rs 330 total 🎬");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              setTimeout(() => {
                friendSays('priya', 'yayy see u at 1 PM food court first!');
                setTimeout(() => friendSays('rohan', 'lessgoo 🔥🔥'), 500);
                setStep(1);
              }, 400);
            },
          },
          {
            label: "Can't today, sorry 🙏",
            onPress: () => {
              setMood((m) => m - 3);
              setSocial((s) => s - 5);
              playerSays("Can't today, sorry 🙏");
              setTimeout(() => {
                friendSays('arjun', 'bro why 😭');
                setTimeout(() => friendSays('priya', 'all good, next time!'), 600);
                setStep(2);
              }, 400);
            },
          },
        ]}
      />
    );
  } else if (step === 2) {
    footer = (
      <View>
        <Text style={styles.sceneLabel}>📍 At the mall — Arjun spotted a jacket on you</Text>
        <ChatQuickReplies
          options={[
            ...(wallet >= 1299
              ? [{
                  label: 'Buy jacket Rs 1,299 🧥',
                  color: C.red,
                  onPress: () => {
                    setWallet((w) => w - 1299);
                    setMood((m) => m + 10);
                    setSocial((s) => s + 5);
                    playerSays('Fine, buying the jacket 🧥');
                    setStep(3);
                  },
                }]
              : []),
            ...(wallet >= 699
              ? [{
                  label: 'Cheaper jacket Rs 699',
                  color: C.yellow,
                  onPress: () => {
                    setWallet((w) => w - 699);
                    setMood((m) => m + 6);
                    playerSays('Getting the Rs 699 one');
                    setStep(3);
                  },
                }]
              : []),
            {
              label: "Nah I'm good 👍",
              onPress: () => {
                setSocial((s) => s - 3);
                playerSays("Nah I'm good 👍");
                setStep(3);
              },
            },
          ]}
        />
      </View>
    );
  } else if (step === 3) {
    footer = (
      <ChatQuickReplies
        options={
          wallet >= 200
            ? [
                {
                  label: 'Ok coming! Rs 200 🎂',
                  color: FL_GREEN,
                  onPress: () => {
                    setWallet((w) => w - 200);
                    setSocial((s) => s + 8);
                    setMood((m) => m + 6);
                    playerSays('Ok coming! Rs 200 🎂');
                    play('win');
                    setTimeout(() => setPhase('report'), 800);
                  },
                },
                {
                  label: 'Too tired, skip 😴',
                  onPress: () => {
                    setSocial((s) => s - 8);
                    playerSays('Too tired, skip 😴');
                    setPhase('report');
                  },
                },
              ]
            : [
                {
                  label: "Sorry guys, I'm broke 😅",
                  onPress: () => {
                    setSocial((s) => s - 8);
                    playerSays("Sorry guys, I'm broke 😅");
                    setTimeout(() => friendSays('priya', 'no worries bro 💙'), 400);
                    setPhase('report');
                  },
                },
              ]
        }
      />
    );
  } else if (step === 1 && !goingMovie) {
    footer = (
      <Pressable onPress={() => setStep(2)} style={styles.primaryBtn}>
        <Text style={styles.primaryBtnText}>CONTINUE SATURDAY ▶</Text>
      </Pressable>
    );
  }

  return (
    <LabWhatsAppChat
      title="Saturday Squad 🎬"
      subtitle="3 members online"
      members={SQUAD}
      messages={messages}
      typing={typing}
      onBack={back}
      headerExtra={<ChatStatStrip wallet={wallet} social={social} mood={mood} />}
      footer={step === 1 && goingMovie ? undefined : footer}
      overlay={foodOverlay}
    />
  );
}

const styles = StyleSheet.create({
  reportTitle: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  tagBox: { borderWidth: 2, borderColor: C.yellow, padding: 12, marginVertical: 16 },
  tagText: { fontFamily: FONT.display, color: C.yellow, fontSize: 10, textAlign: 'center' },
  sceneLabel: {
    fontFamily: FONT.body,
    color: '#888',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  menuPanel: { padding: 12 },
  menuTitle: { fontFamily: FONT.body, color: FL_YELLOW, fontSize: 22, marginBottom: 4 },
  menuTotal: { fontFamily: FONT.body, color: FL_GREEN, fontSize: 20, marginBottom: 10 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  menuItem: {
    width: '47%',
    borderWidth: 2,
    borderColor: '#444',
    padding: 10,
    backgroundColor: '#111',
  },
  menuOff: { opacity: 0.35 },
  menuSel: { borderColor: FL_GREEN, backgroundColor: '#0a1a12' },
  menuItemText: { fontFamily: FONT.body, color: '#ddd', fontSize: 18 },
  menuPrice: { fontFamily: FONT.body, color: '#888', fontSize: 16 },
  menuCount: { fontFamily: FONT.display, color: FL_GREEN, fontSize: 8, marginTop: 2 },
  menuConfirm: {
    backgroundColor: FL_GREEN,
    borderWidth: 3,
    borderColor: '#000',
    paddingVertical: 12,
    alignItems: 'center',
  },
  menuConfirmText: { fontFamily: FONT.display, color: '#000', fontSize: 11 },
  primaryBtn: {
    backgroundColor: FL_GREEN,
    borderWidth: 3,
    borderColor: '#000',
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { fontFamily: FONT.display, color: '#000', fontSize: 11 },
});
