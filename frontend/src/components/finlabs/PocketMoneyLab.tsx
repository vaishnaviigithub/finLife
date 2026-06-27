import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import LabHeader from '@/src/components/finlabs/LabHeader';
import {
  LabAccelPlayer,
  LabBeatHeader,
  LabDecisionBlock,
  LabMiniHud,
  LabPrimaryBtn,
  LabSituationBlock,
  LabAccelEvent,
} from '@/src/components/finlabs/LabUI';
import DialogBox from '@/src/components/DialogBox';
import ChoiceButton from '@/src/components/ChoiceButton';
import { FL_BG, FL_GREEN, setLabDone } from '@/src/finlabs/storage';
import { finLabsRoadmapHref } from '@/src/finlabs/routes';
import {
  START_WALLET,
  START_MOOD,
  WEEK_DAYS,
  Plan,
  calcPlannedSpend,
  buildDayOutcomes,
  getResultTag,
  getTotalSpent,
} from '@/src/finlabs/pocketMoneyLogic';
import { C, FONT } from '@/src/ui/theme';
import { play } from '@/src/game/audio';

type Phase = 'tutorial' | 'intro' | 'plan' | 'week' | 'recap' | 'summary';

function fmt(n: number) {
  return `Rs ${Math.round(n).toLocaleString('en-IN')}`;
}

function TogglePair({
  left,
  right,
  value,
  onChange,
  disabled,
}: {
  left: string;
  right: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.toggleRow}>
      <Pressable
        disabled={disabled}
        onPress={() => {
          play('click');
          onChange(true);
        }}
        style={[styles.toggleBtn, value && styles.toggleActive, disabled && styles.toggleDisabled]}
      >
        <Text style={[styles.toggleText, value && styles.toggleTextActive]}>{left}</Text>
      </Pressable>
      <Pressable
        disabled={disabled}
        onPress={() => {
          play('click');
          onChange(false);
        }}
        style={[styles.toggleBtn, !value && styles.toggleActive, disabled && styles.toggleDisabled]}
      >
        <Text style={[styles.toggleText, !value && styles.toggleTextActive]}>{right}</Text>
      </Pressable>
    </View>
  );
}

function StepPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const steps = [0, 10, 20, 30, 40, 50, 60];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {steps.map((v) => (
        <Pressable
          key={v}
          onPress={() => {
            play('tick');
            onChange(v);
          }}
          style={[styles.stepBtn, value === v && styles.stepBtnActive]}
        >
          <Text style={[styles.stepText, value === v && styles.stepTextActive]}>{fmt(v)}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

type Props = {
  chapterId: string;
};

export default function PocketMoneyLab({ chapterId }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('tutorial');
  const [tutorialDone, setTutorialDone] = useState(false);
  const [plan, setPlan] = useState<Plan>({
    buyPen: true,
    canteen: 0,
    chipGift: true,
    goPark: true,
  });
  const [dayIdx, setDayIdx] = useState(0);
  const [summaryStep, setSummaryStep] = useState(0);

  const plannedSpend = calcPlannedSpend(plan);
  const remaining = START_WALLET - plannedSpend;
  const canAffordPark = START_WALLET - (plannedSpend - (plan.goPark ? 30 : 0)) >= 30;

  React.useEffect(() => {
    if (!canAffordPark && plan.goPark) {
      setPlan((p) => ({ ...p, goPark: false }));
    }
  }, [canAffordPark, plan.goPark]);

  const outcomes = useMemo(() => buildDayOutcomes(plan), [plan]);
  const final = outcomes[outcomes.length - 1];
  const totalSpent = getTotalSpent(plan, final.wallet);

  const summaryEvents: LabAccelEvent[] = useMemo(
    () => [
      {
        kind: 'stat',
        title: 'FINAL WALLET',
        emoji: '💰',
        label: 'WALLET',
        text: `You ended the week with ${fmt(final.wallet)} in your pocket.`,
        from: START_WALLET,
        to: final.wallet,
        format: 'inr',
        positive: final.wallet >= START_WALLET / 2,
      },
      {
        kind: 'stat',
        title: 'MOOD',
        emoji: '😊',
        label: 'MOOD',
        text: `Your mood ended at ${final.mood} out of 100.`,
        from: START_MOOD,
        to: final.mood,
        format: 'mood',
        positive: final.mood >= START_MOOD,
      },
      {
        kind: 'stat',
        title: 'TOTAL SPENT',
        emoji: '📊',
        label: 'SPENT',
        text: `You spent ${fmt(totalSpent)} this week. ${fmt(final.wallet)} is left over.`,
        from: 0,
        to: totalSpent,
        format: 'inr',
        positive: false,
      },
    ],
    [final, totalSpent],
  );

  const handleComplete = async () => {
    play('win');
    await setLabDone(chapterId, 1);
    router.replace(finLabsRoadmapHref(chapterId));
  };

  // ── TUTORIAL ──
  if (phase === 'tutorial') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <LabHeader title="QUICK TUTORIAL" subtitle="Learn how this lab works" onBack={() => router.replace(finLabsRoadmapHref(chapterId))} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <LabBeatHeader num="ⓘ" label="PRACTICE ROUND" color={C.yellow} />
          <DialogBox
            speaker="MINI SCENARIO"
            text="You have Rs 50 pocket money. Your friend asks you to split a Rs 20 snack. What do you do?"
          />
          <LabBeatHeader num="②" label="TRY ONE DECISION" color={FL_GREEN} style={{ marginTop: 16 }} />
          {!tutorialDone ? (
            <View style={styles.choices}>
              <ChoiceButton
                label="SPLIT THE SNACK Rs 20"
                hint="Fun now, less left over"
                color={C.blue}
                onPress={() => {
                  setTutorialDone(true);
                  play('coin');
                }}
              />
              <ChoiceButton
                label="KEEP YOUR Rs 50"
                hint="Save it all, skip the snack"
                color={C.green}
                onPress={() => {
                  setTutorialDone(true);
                  play('coin');
                }}
              />
            </View>
          ) : (
            <Animated.View entering={FadeInDown.duration(400)}>
              <View style={styles.tutorialResult}>
                <Text style={styles.tutorialResultTitle}>WHAT HAPPENED</Text>
                <Text style={styles.tutorialResultText}>
                  Every choice changes your wallet AND your mood. In the real lab you will plan a full
                  week, then watch each day play out — just like the main game.
                </Text>
              </View>
              <LabPrimaryBtn label="START THE REAL WEEK ▶" onPress={() => setPhase('intro')} />
            </Animated.View>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <LabMiniHud wallet={START_WALLET} mood={START_MOOD} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.chapterStrip}>FIN LAB · POCKET MONEY · AGE 10</Text>
          <LabSituationBlock
            tag="YOUR WEEK"
            situation="Maa gave you Rs 200 for the school week. Five days, five small money moments — a pen, canteen lunch, a gift pool, a quiet Thursday, and a park trip on Friday. Plan how to spend it BEFORE the week starts."
          />
          <View style={styles.introFacts}>
            <Text style={styles.introFact}>💰 Starting wallet: {fmt(START_WALLET)}</Text>
            <Text style={styles.introFact}>😊 Starting mood: {START_MOOD}/100</Text>
            <Text style={styles.introFact}>📅 5 days · plan each one</Text>
          </View>
          <LabPrimaryBtn
            label="PLAN MY WEEK ▶"
            onPress={() => {
              play('click');
              setPhase('plan');
            }}
          />
        </ScrollView>
      </View>
    );
  }

  // ── PLAN ──
  if (phase === 'plan') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <LabMiniHud wallet={remaining} mood={START_MOOD} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.planTitle}>YOU HAVE {fmt(START_WALLET)}. PLAN YOUR WEEK.</Text>

          {WEEK_DAYS.map((day) => (
            <View key={day.id} style={styles.dayCard}>
              <LabSituationBlock tag={day.tag} situation={day.situation} />
              <LabDecisionBlock>
                {day.id === 'mon' && (
                  <TogglePair
                    left="Buy Pen Rs 15"
                    right="Skip — risk it"
                    value={plan.buyPen}
                    onChange={(buyPen) => setPlan((p) => ({ ...p, buyPen }))}
                  />
                )}
                {day.id === 'tue' && (
                  <>
                    <Text style={styles.inputHint}>How much for canteen?</Text>
                    <StepPicker value={plan.canteen} onChange={(canteen) => setPlan((p) => ({ ...p, canteen }))} />
                  </>
                )}
                {day.id === 'wed' && (
                  <TogglePair
                    left="Chip in Rs 20"
                    right="Skip"
                    value={plan.chipGift}
                    onChange={(chipGift) => setPlan((p) => ({ ...p, chipGift }))}
                  />
                )}
                {day.id === 'thu' && <Text style={styles.freeDay}>No spending today — rest day 😌</Text>}
                {day.id === 'fri' && (
                  <>
                    <TogglePair
                      left="Go Rs 30"
                      right="Skip"
                      value={plan.goPark}
                      onChange={(goPark) => setPlan((p) => ({ ...p, goPark }))}
                      disabled={!canAffordPark}
                    />
                    {!canAffordPark ? (
                      <Text style={styles.forcedSkip}>Only {fmt(remaining + (plan.goPark ? 30 : 0))} left — park costs Rs 30</Text>
                    ) : null}
                  </>
                )}
              </LabDecisionBlock>
            </View>
          ))}

          <Text style={[styles.totals, remaining < 0 && styles.totalsBad]}>
            PLANNED SPEND: {fmt(plannedSpend)} · REMAINING: {fmt(remaining)}
          </Text>
          <LabPrimaryBtn
            label="START YOUR WEEK ▶"
            disabled={remaining < 0}
            onPress={() => {
              play('whoosh');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              setDayIdx(0);
              setPhase('week');
            }}
          />
        </ScrollView>
      </View>
    );
  }

  // ── WEEK (day-by-day accel) ──
  if (phase === 'week') {
    const day = outcomes[dayIdx];
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <LabMiniHud wallet={day.walletFrom} mood={day.moodFrom} />
        <LabAccelPlayer
          key={dayIdx}
          events={day.events}
          stepPrefix={`DAY ${dayIdx + 1}/${outcomes.length}`}
          onDone={() => {
            if (dayIdx < outcomes.length - 1) {
              setDayIdx((i) => i + 1);
            } else {
              setPhase('recap');
            }
          }}
        />
      </View>
    );
  }

  // ── WEEK RECAP ──
  if (phase === 'recap') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.recapTitle}>YOUR FULL WEEK</Text>
            <Text style={styles.recapSub}>Every day added up. Here is the full picture.</Text>

            {outcomes.map((o, i) => (
              <Animated.View key={o.day} entering={FadeIn.delay(i * 80).duration(300)} style={styles.recapRow}>
                <Text style={styles.recapEmoji}>{o.emoji}</Text>
                <View style={styles.recapBody}>
                  <Text style={styles.recapDay}>{o.day}</Text>
                  <Text style={styles.recapHeadline}>{o.headline}</Text>
                  <View style={styles.recapStats}>
                    {o.walletDelta !== 0 ? (
                      <Text style={[styles.recapDelta, o.walletDelta < 0 && styles.recapDeltaBad]}>
                        💰 {o.walletDelta > 0 ? '+' : '−'}Rs {Math.abs(o.walletDelta)}
                      </Text>
                    ) : null}
                    {o.moodDelta !== 0 ? (
                      <Text style={[styles.recapDelta, o.moodDelta < 0 && styles.recapDeltaBad]}>
                        😊 {o.moodDelta > 0 ? '+' : '−'}{Math.abs(o.moodDelta)} mood
                      </Text>
                    ) : null}
                    <Text style={styles.recapEnd}>→ {fmt(o.wallet)} · {o.mood}/100</Text>
                  </View>
                </View>
              </Animated.View>
            ))}

            <View style={styles.recapTotals}>
              <Text style={styles.recapTotalLine}>STARTED: {fmt(START_WALLET)} · MOOD {START_MOOD}/100</Text>
              <Text style={styles.recapTotalLine}>ENDED: {fmt(final.wallet)} · MOOD {final.mood}/100</Text>
              <Text style={styles.recapTotalLine}>SPENT: {fmt(totalSpent)} · SAVED: {fmt(final.wallet)}</Text>
            </View>

            <LabPrimaryBtn
              label="SEE FINAL SCORE ▶"
              onPress={() => {
                setSummaryStep(0);
                setPhase('summary');
              }}
            />
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ── SUMMARY (stat-by-stat) ──
  const tag = getResultTag(final.wallet, final.mood);

  if (summaryStep < summaryEvents.length) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <LabAccelPlayer
          events={[summaryEvents[summaryStep]]}
          stepPrefix="WEEK SUMMARY"
          onDone={() => setSummaryStep((s) => s + 1)}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.summaryTitle}>YOUR WEEK IN NUMBERS</Text>
        <View style={styles.finalGrid}>
          <View style={styles.finalStat}>
            <Text style={styles.finalLabel}>💰 WALLET</Text>
            <Text style={styles.finalValue}>{fmt(final.wallet)}</Text>
          </View>
          <View style={styles.finalStat}>
            <Text style={styles.finalLabel}>😊 MOOD</Text>
            <Text style={styles.finalValue}>{final.mood}/100</Text>
          </View>
          <View style={styles.finalStat}>
            <Text style={styles.finalLabel}>📊 SPENT</Text>
            <Text style={styles.finalValue}>{fmt(totalSpent)}</Text>
          </View>
        </View>
        <View style={styles.tagBox}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
        <View style={styles.conceptCard}>
          <Text style={styles.conceptLabel}>WEEKLY BUDGETING</Text>
          <Text style={styles.conceptText}>
            A budget is a plan, not a punishment. The goal is to cover your needs, keep some joy, and
            have something left over.
          </Text>
        </View>
        <LabPrimaryBtn label="WELL DONE ▶" onPress={handleComplete} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: FL_BG },
  scroll: { padding: 14, paddingBottom: 32 },
  chapterStrip: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 10,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 12,
  },
  choices: { gap: 12, marginTop: 8 },
  tutorialResult: {
    borderWidth: 4,
    borderColor: C.yellow,
    backgroundColor: '#1A1A1A',
    padding: 16,
    marginTop: 12,
  },
  tutorialResultTitle: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 12,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 10,
  },
  tutorialResultText: {
    fontFamily: FONT.body,
    color: C.white,
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'center',
  },
  introFacts: {
    borderWidth: 2,
    borderColor: '#333',
    padding: 12,
    gap: 6,
    marginTop: 8,
  },
  introFact: {
    fontFamily: FONT.body,
    color: '#ccc',
    fontSize: 18,
  },
  planTitle: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 11,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 12,
  },
  dayCard: {
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#222',
    padding: 10,
    backgroundColor: '#0a0a0a',
  },
  inputHint: {
    fontFamily: FONT.body,
    color: '#888',
    fontSize: 16,
    marginBottom: 6,
  },
  freeDay: {
    fontFamily: FONT.body,
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 8,
  },
  toggleRow: { flexDirection: 'row', gap: 6 },
  toggleBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#444',
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  toggleActive: {
    borderColor: FL_GREEN,
    backgroundColor: 'rgba(0,255,156,0.12)',
  },
  toggleDisabled: { opacity: 0.4 },
  toggleText: {
    fontFamily: FONT.display,
    color: '#888',
    fontSize: 7,
    textAlign: 'center',
  },
  toggleTextActive: { color: FL_GREEN },
  stepBtn: {
    borderWidth: 2,
    borderColor: '#444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 6,
  },
  stepBtnActive: {
    borderColor: FL_GREEN,
    backgroundColor: 'rgba(0,255,156,0.12)',
  },
  stepText: {
    fontFamily: FONT.display,
    color: '#888',
    fontSize: 9,
  },
  stepTextActive: { color: FL_GREEN },
  forcedSkip: {
    fontFamily: FONT.body,
    color: C.red,
    fontSize: 14,
    marginTop: 6,
  },
  totals: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  totalsBad: { color: C.red },
  recapTitle: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 14,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 8,
  },
  recapSub: {
    fontFamily: FONT.body,
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  recapRow: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 2,
    borderColor: '#333',
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#111',
  },
  recapEmoji: { fontSize: 28, marginTop: 2 },
  recapBody: { flex: 1 },
  recapDay: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 9,
    letterSpacing: 1,
  },
  recapHeadline: {
    fontFamily: FONT.body,
    color: C.white,
    fontSize: 16,
    marginTop: 2,
  },
  recapStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  recapDelta: {
    fontFamily: FONT.display,
    color: C.green,
    fontSize: 8,
  },
  recapDeltaBad: { color: C.red },
  recapEnd: {
    fontFamily: FONT.display,
    color: '#888',
    fontSize: 8,
  },
  recapTotals: {
    borderWidth: 2,
    borderColor: C.yellow,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
    gap: 4,
  },
  recapTotalLine: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 9,
    textAlign: 'center',
  },
  summaryTitle: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 14,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  finalGrid: { gap: 10, marginBottom: 12 },
  finalStat: {
    borderWidth: 2,
    borderColor: FL_GREEN,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#111',
  },
  finalLabel: {
    fontFamily: FONT.display,
    color: '#888',
    fontSize: 9,
    letterSpacing: 2,
  },
  finalValue: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 24,
    marginTop: 4,
  },
  tagBox: {
    borderWidth: 2,
    borderColor: C.yellow,
    backgroundColor: '#1a1a00',
    padding: 12,
    marginBottom: 12,
  },
  tagText: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 16,
  },
  conceptCard: {
    borderWidth: 2,
    borderColor: '#444',
    backgroundColor: '#0a0a0a',
    padding: 14,
    marginBottom: 8,
  },
  conceptLabel: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 8,
  },
  conceptText: {
    fontFamily: FONT.body,
    color: '#ccc',
    fontSize: 18,
    lineHeight: 22,
  },
});
