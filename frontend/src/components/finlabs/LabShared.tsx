import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInRight,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { C, FONT } from '@/src/ui/theme';
import { FL_BG, FL_GREEN, FL_YELLOW } from '@/src/finlabs/storage';
import { play } from '@/src/game/audio';
import ArtifactImage from '@/src/components/ArtifactImage';
import { ARTIFACTS } from '@/src/game/artifacts';

const { width: SCREEN_W } = Dimensions.get('window');

export type ConceptMeta = {
  acronym: string;
  fullForm: string;
  definition: string;
};

export type TutorialTerm = {
  id: string;
  label: string;
  fullForm: string;
  meaning: string;
};

export type TutorialPage = {
  title: string;
  subtitle?: string;
  body?: string;
  formula?: string;
  animation?: React.ReactNode;
  /** Player must finish this demo before NEXT / GOT IT unlocks */
  interactive?: (onReady: () => void) => React.ReactNode;
  warning?: string;
  /** Tap each chip to reveal — all must be tapped to proceed */
  terms?: TutorialTerm[];
  /** Show main concept banner on this page only */
  showConcept?: boolean;
};

export function LabToast({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.toast}>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

function LabTermChip({
  term,
  revealed,
  onReveal,
}: {
  term: TutorialTerm;
  revealed: boolean;
  onReveal: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        if (!revealed) {
          play('click');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onReveal();
        }
      }}
      style={[styles.termChip, revealed && styles.termChipOn]}
    >
      <Text style={[styles.termChipLabel, revealed && styles.termChipLabelOn]}>{term.label}</Text>
      {revealed ? (
        <Animated.View entering={FadeIn.duration(200)}>
          <Text style={styles.termFull}>{term.fullForm}</Text>
          <Text style={styles.termMean}>{term.meaning}</Text>
        </Animated.View>
      ) : (
        <Text style={styles.termTap}>TAP TO DEFINE ▼</Text>
      )}
    </Pressable>
  );
}

export function LabTutorial({
  concept,
  conceptMeta,
  pages,
  onComplete,
  onSkip,
  canSkip,
}: {
  concept: string;
  conceptMeta?: ConceptMeta;
  pages: TutorialPage[];
  onComplete: () => void;
  onSkip?: () => void;
  canSkip: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [seen, setSeen] = useState<Set<number>>(new Set([0]));
  const [pageReady, setPageReady] = useState(false);
  const [revealedTerms, setRevealedTerms] = useState<Set<string>>(new Set());
  const [interactiveDone, setInteractiveDone] = useState(false);
  const page = pages[idx];

  const pagesRef = useRef(pages);
  pagesRef.current = pages;

  const markReady = useCallback(() => setInteractiveDone(true), []);

  const interactiveNode = useMemo(() => {
    const p = pagesRef.current[idx];
    if (!p?.interactive) return null;
    return p.interactive(markReady);
  }, [idx, markReady]);

  useEffect(() => {
    setRevealedTerms(new Set());
    setInteractiveDone(false);
    setSeen((s) => new Set(s).add(idx));
  }, [idx]);

  useEffect(() => {
    const termsOk = !page.terms?.length || revealedTerms.size >= page.terms.length;
    const interactiveOk = !page.interactive || interactiveDone;
    setPageReady(termsOk && interactiveOk);
  }, [revealedTerms, interactiveDone, page.terms, page.interactive]);

  const revealTerm = (id: string) => {
    setRevealedTerms((prev) => new Set(prev).add(id));
  };

  const goNext = () => {
    if (!pageReady || idx >= pages.length - 1) return;
    const next = idx + 1;
    setIdx(next);
    setSeen((s) => new Set(s).add(next));
    play('tick');
  };

  const termsLeft = page.terms ? page.terms.length - revealedTerms.size : 0;
  const canProceed = pageReady;
  const showConceptBanner = conceptMeta && (page.showConcept ?? idx === 0);

  return (
    <SafeAreaView style={styles.tutorialRoot} edges={['bottom']}>
      {canSkip && onSkip ? (
        <Pressable onPress={onSkip} style={styles.skipPill}>
          <Text style={styles.skipText}>SKIP TUTORIAL ▶</Text>
        </Pressable>
      ) : null}

      <View style={styles.tutorialCard}>
        <View style={styles.tutorialTop}>
          <View style={styles.conceptPill}>
            <Text style={styles.conceptPillText}>CONCEPT: {concept}</Text>
          </View>
          <Text style={styles.stepCounter}>
            STEP {idx + 1} / {pages.length}
          </Text>
        </View>

        {showConceptBanner ? (
          <View style={styles.defBanner}>
            <Text style={styles.defAcronym}>{conceptMeta!.acronym}</Text>
            <Text style={styles.defFullForm}>= {conceptMeta!.fullForm}</Text>
            <Text style={styles.defBody}>{conceptMeta!.definition}</Text>
          </View>
        ) : null}

        <ScrollView
          style={styles.tutorialScroll}
          contentContainerStyle={styles.tutorialScrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View key={idx} entering={FadeInRight.duration(280)}>
            <Text style={styles.tutorialTitle}>{page.title}</Text>
            {page.subtitle ? <Text style={styles.tutorialSubtitle}>{page.subtitle}</Text> : null}
            {interactiveNode}
            {!page.interactive && page.animation}
            {page.terms?.length ? (
              <View style={styles.termsSection}>
                <Text style={styles.termsHint}>
                  {termsLeft > 0
                    ? `TAP EACH BUTTON (${page.terms.length - termsLeft}/${page.terms.length})`
                    : '✓ ALL TERMS UNLOCKED'}
                </Text>
                {page.terms.map((t) => (
                  <LabTermChip
                    key={t.id}
                    term={t}
                    revealed={revealedTerms.has(t.id)}
                    onReveal={() => revealTerm(t.id)}
                  />
                ))}
              </View>
            ) : null}
            {page.body ? <Text style={styles.tutorialBody}>{page.body}</Text> : null}
            {page.formula ? (
              <View style={styles.formulaBox}>
                <Text style={styles.formulaText}>{page.formula}</Text>
              </View>
            ) : null}
            {page.warning ? (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>{page.warning}</Text>
              </View>
            ) : null}
          </Animated.View>
        </ScrollView>

        <View style={styles.tutorialFooter}>
          <View style={styles.dots}>
            {pages.map((_, i) => (
              <View key={i} style={[styles.dot, i === idx && styles.dotActive, seen.has(i) && styles.dotSeen]} />
            ))}
          </View>

          {!canProceed ? (
            <Text style={styles.proceedHint}>
              {!interactiveDone && page.interactive ? '↑ FINISH THE ACTIVITY FIRST' :
               termsLeft > 0 ? `↑ TAP ${termsLeft} MORE BUTTON${termsLeft > 1 ? 'S' : ''}` :
               '↑ READ THIS STEP'}
            </Text>
          ) : (
            <Text style={styles.proceedReady}>✓ READY — TAP NEXT</Text>
          )}

          <View style={styles.tutorialNav}>
            {idx > 0 ? (
              <Pressable onPress={() => setIdx((i) => i - 1)} style={styles.tutorialNavBtn}>
                <Text style={styles.tutorialNavText}>◀</Text>
              </Pressable>
            ) : (
              <View style={styles.tutorialNavBtn} />
            )}
            {idx < pages.length - 1 ? (
              <Pressable
                disabled={!canProceed}
                onPress={goNext}
                style={[
                  styles.tutorialNavBtnWide,
                  canProceed ? styles.tutorialNavBtnReady : styles.tutorialNavBtnOff,
                ]}
              >
                <Text style={canProceed ? styles.tutorialNavTextReady : styles.tutorialNavTextDisabled}>
                  NEXT ▶
                </Text>
              </Pressable>
            ) : (
              <Pressable
                disabled={!canProceed}
                onPress={() => {
                  play('coin');
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                  onComplete();
                }}
                style={[styles.gotItBtn, !canProceed && styles.gotItBtnOff]}
              >
                <Text style={styles.gotItText}>GOT IT ▶</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

export function LabLessonCard({
  concept,
  text,
  onContinue,
  buttonLabel = 'CONTINUE ▶',
}: {
  concept: string;
  text: string;
  onContinue: () => void;
  buttonLabel?: string;
}) {
  return (
    <View style={styles.lessonRoot}>
      <View style={styles.lessonTagWrap}>
        <View style={styles.lessonTag}>
          <Text style={styles.lessonTagText}>CONCEPT</Text>
        </View>
        <Text style={styles.lessonConcept}>{concept.toUpperCase()}</Text>
      </View>
      <View style={styles.lessonCard}>
        <ArtifactImage source={ARTIFACTS.book} size={48} containerStyle={{ alignSelf: 'center' }} />
        <Text style={styles.lessonEyebrow}>THE LESSON</Text>
        <Text style={styles.lessonText}>{text}</Text>
      </View>
      <Pressable
        onPress={() => {
          play('coin');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          onContinue();
        }}
        style={({ pressed }) => [styles.lessonBtn, pressed && { transform: [{ translateX: 2 }, { translateY: 2 }] }]}
      >
        <Text style={styles.lessonBtnText}>{buttonLabel}</Text>
      </Pressable>
    </View>
  );
}

export function LabHud({
  wallet,
  mood,
  social,
  age,
}: {
  wallet?: number;
  mood?: number;
  social?: number;
  age?: number;
}) {
  return (
    <View style={styles.hud}>
      {age !== undefined ? (
        <HudChip label="AGE" value={`${age}`} color={C.yellow} />
      ) : null}
      {wallet !== undefined ? (
        <HudChip label="WALLET" value={`Rs ${Math.round(wallet).toLocaleString('en-IN')}`} color={FL_GREEN} />
      ) : null}
      {mood !== undefined ? (
        <HudChip label="MOOD" value={`${Math.round(mood)}/100`} color={C.orange} />
      ) : null}
      {social !== undefined ? (
        <HudChip label="SOCIAL" value={`${Math.round(social)}/100`} color={C.blue} />
      ) : null}
    </View>
  );
}

function HudChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.hudChip}>
      <Text style={[styles.hudChipLabel, { color }]}>{label}</Text>
      <Text style={styles.hudChipValue}>{value}</Text>
    </View>
  );
}

export function LabStatBar({
  label,
  value,
  max,
  color = FL_GREEN,
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <View style={styles.statBarWrap}>
      <Text style={styles.statBarLabel}>{label}</Text>
      <View style={styles.statBarTrack}>
        <View style={[styles.statBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.statBarVal}>{value}{max <= 100 && !label.includes('Rs ') ? `/${max}` : ''}</Text>
    </View>
  );
}

export function LabNumericField({
  label,
  value,
  onChange,
  correct,
  error,
  hint,
  wrongHint,
  prefix = 'Rs ',
  editable = true,
  large = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  correct?: boolean;
  error?: string;
  hint?: string;
  wrongHint?: string;
  prefix?: string;
  editable?: boolean;
  large?: boolean;
}) {
  const hasValue = value.trim().length > 0;
  const showWrong = hasValue && correct === false && wrongHint;
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, large && styles.fieldLabelLarge]}>{label.toUpperCase()}</Text>
      {hint ? <Text style={styles.fieldHintLarge}>{hint}</Text> : null}
      <View
        style={[
          styles.fieldInputRow,
          large && styles.fieldInputRowLarge,
          correct && styles.fieldOk,
          (error || showWrong) && styles.fieldBad,
          !editable && styles.fieldLocked,
        ]}
      >
        {prefix ? <Text style={[styles.fieldPrefix, large && styles.fieldPrefixLarge]}>{prefix}</Text> : null}
        <TextInput
          style={[styles.fieldInput, large && styles.fieldInputLarge]}
          value={value}
          onChangeText={(t) => onChange(t.replace(/[^\d.]/g, ''))}
          keyboardType="decimal-pad"
          editable={editable}
          placeholder="type amount"
          placeholderTextColor="#555"
        />
        {correct ? <Text style={styles.fieldCheck}>✓</Text> : null}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
      {showWrong ? <Text style={styles.fieldWrongHint}>💡 {wrongHint}</Text> : null}
    </View>
  );
}

export function LabTextField({
  label,
  value,
  onChange,
  correct,
  error,
  multiline,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  correct?: boolean;
  error?: string;
  multiline?: boolean;
  hint?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      <View style={[styles.fieldInputRow, correct && styles.fieldOk, error && styles.fieldBad]}>
        <TextInput
          style={[styles.fieldInput, multiline && styles.fieldMultiline]}
          value={value}
          onChangeText={onChange}
          multiline={multiline}
          placeholder="..."
          placeholderTextColor="#555"
        />
        {correct ? <Text style={styles.fieldCheck}>✓</Text> : null}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function LabChoiceCard({
  label,
  hint,
  color,
  selected,
  onPress,
}: {
  label: string;
  hint?: string;
  color: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        play('click');
        onPress();
      }}
      style={({ pressed }) => [
        styles.choiceCard,
        { backgroundColor: color },
        selected && styles.choiceSelected,
        pressed && { opacity: 0.9 },
      ]}
    >
      <Text style={styles.choiceLabel}>{label}</Text>
      {hint ? <Text style={styles.choiceHint}>{hint}</Text> : null}
    </Pressable>
  );
}

export function LabChatBubble({
  text,
  isPlayer,
  name,
}: {
  text: string;
  isPlayer?: boolean;
  name?: string;
}) {
  return (
    <View style={[styles.chatRow, isPlayer && styles.chatRowPlayer]}>
      {!isPlayer && name ? <Text style={styles.chatName}>{name}</Text> : null}
      <View style={[styles.chatBubble, isPlayer ? styles.chatBubblePlayer : styles.chatBubbleOther]}>
        <Text style={[styles.chatText, isPlayer && styles.chatTextPlayer]}>{text}</Text>
      </View>
    </View>
  );
}

export function LabPixelBars({
  items,
}: {
  items: { label: string; value: number; display: string }[];
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <View style={styles.barsWrap}>
      {items.map((item) => (
        <View key={item.label} style={styles.barRow}>
          <Text style={styles.barLabel}>{item.label}</Text>
          <View style={styles.barTrack}>
            {Array.from({ length: 14 }).map((_, i) => {
              const threshold = (i + 1) / 14;
              const filled = item.value / max >= threshold;
              return (
                <View
                  key={i}
                  style={[styles.barBlock, filled && { backgroundColor: i % 2 === 0 ? FL_GREEN : FL_YELLOW }]}
                />
              );
            })}
          </View>
          <Text style={styles.barVal}>{item.display}</Text>
        </View>
      ))}
    </View>
  );
}

export function LabScreenShell({
  title,
  subtitle,
  onBack,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <View style={styles.shell}>
      <View style={styles.shellHeader}>
        <Pressable onPress={onBack} style={styles.shellBack}>
          <Text style={styles.shellBackText}>◀</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.shellTitle}>{title}</Text>
          {subtitle ? <Text style={styles.shellSub}>{subtitle}</Text> : null}
        </View>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.shellScroll}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
        {footer ? (
          <SafeAreaView edges={['bottom']} style={styles.shellFooter}>
            {footer}
          </SafeAreaView>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: '#111',
    borderWidth: 2,
    borderColor: FL_YELLOW,
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 100,
  },
  toastText: {
    fontFamily: FONT.display,
    color: FL_YELLOW,
    fontSize: 9,
    letterSpacing: 1,
  },
  tutorialRoot: { flex: 1, backgroundColor: FL_BG, padding: 14 },
  skipPill: {
    alignSelf: 'flex-end',
    borderWidth: 2,
    borderColor: '#555',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  skipText: {
    fontFamily: FONT.display,
    color: '#888',
    fontSize: 8,
  },
  tutorialCard: {
    flex: 1,
    backgroundColor: FL_BG,
    borderWidth: 1,
    borderColor: FL_GREEN,
    padding: 12,
  },
  tutorialTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stepCounter: {
    fontFamily: FONT.display,
    color: '#666',
    fontSize: 8,
    letterSpacing: 1,
  },
  conceptPill: {
    backgroundColor: FL_YELLOW,
    borderWidth: 3,
    borderColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  conceptPillText: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 9,
    letterSpacing: 1,
  },
  tutorialPage: { flex: 1 },
  tutorialScroll: { flex: 1 },
  tutorialScrollContent: { paddingBottom: 4, flexGrow: 1 },
  tutorialFooter: {
    borderTopWidth: 2,
    borderTopColor: '#222',
    paddingTop: 10,
    marginTop: 4,
  },
  defBanner: {
    borderWidth: 2,
    borderColor: FL_GREEN,
    backgroundColor: '#0a1a12',
    padding: 10,
    marginBottom: 10,
  },
  defAcronym: {
    fontFamily: FONT.display,
    color: FL_YELLOW,
    fontSize: 16,
    letterSpacing: 2,
    textAlign: 'center',
  },
  defFullForm: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 9,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 6,
  },
  defBody: {
    fontFamily: FONT.body,
    color: '#bbb',
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  defCollapse: {
    fontFamily: FONT.display,
    color: '#666',
    fontSize: 7,
    textAlign: 'center',
    marginTop: 4,
  },
  termsSection: { marginVertical: 8 },
  termsHint: {
    fontFamily: FONT.display,
    color: '#666',
    fontSize: 7,
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  termChip: {
    borderWidth: 2,
    borderColor: '#444',
    backgroundColor: '#111',
    padding: 10,
    marginBottom: 6,
  },
  termChipOn: {
    borderColor: FL_GREEN,
    backgroundColor: '#0a1a12',
  },
  termChipLabel: {
    fontFamily: FONT.display,
    color: '#888',
    fontSize: 10,
    letterSpacing: 1,
  },
  termChipLabelOn: { color: FL_GREEN },
  termTap: {
    fontFamily: FONT.display,
    color: '#555',
    fontSize: 7,
    marginTop: 4,
  },
  termFull: {
    fontFamily: FONT.display,
    color: FL_YELLOW,
    fontSize: 8,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  termMean: {
    fontFamily: FONT.body,
    color: '#ccc',
    fontSize: 15,
    lineHeight: 19,
    marginTop: 4,
  },
  proceedHint: {
    fontFamily: FONT.display,
    color: FL_YELLOW,
    fontSize: 7,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  proceedReady: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 8,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 8,
  },
  tutorialNavBtnOff: { opacity: 0.4, borderColor: '#333', backgroundColor: '#111' },
  tutorialNavBtnReady: {
    backgroundColor: FL_GREEN,
    borderColor: '#000',
    borderWidth: 3,
  },
  tutorialNavTextReady: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 12,
    letterSpacing: 1,
  },
  tutorialNavTextDisabled: {
    fontFamily: FONT.display,
    color: '#555',
    fontSize: 11,
  },
  tutorialTitle: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 12,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 6,
  },
  tutorialSubtitle: {
    fontFamily: FONT.body,
    color: '#888',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 10,
  },
  tutorialBody: {
    fontFamily: FONT.body,
    color: '#ccc',
    fontSize: 18,
    lineHeight: 22,
    marginTop: 8,
  },
  formulaBox: {
    borderLeftWidth: 4,
    borderLeftColor: FL_GREEN,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333',
    padding: 12,
    marginTop: 12,
  },
  formulaText: {
    fontFamily: 'VT323',
    color: '#ddd',
    fontSize: 16,
    lineHeight: 20,
  },
  warningBox: {
    borderWidth: 2,
    borderColor: C.red,
    backgroundColor: '#1a0505',
    padding: 10,
    marginTop: 12,
  },
  warningText: {
    fontFamily: FONT.body,
    color: C.red,
    fontSize: 16,
    lineHeight: 20,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: '#444',
    borderRadius: 4,
  },
  dotActive: { backgroundColor: FL_GREEN },
  dotSeen: { backgroundColor: '#2a6a4a' },
  tutorialNav: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  tutorialNavBtn: {
    width: 48,
    borderWidth: 2,
    borderColor: '#444',
    paddingVertical: 12,
    alignItems: 'center',
  },
  tutorialNavBtnWide: {
    flex: 1,
    borderWidth: 2,
    borderColor: FL_GREEN,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tutorialNavText: {
    fontFamily: FONT.display,
    color: '#888',
    fontSize: 12,
  },
  tutorialNavTextWide: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 11,
  },
  gotItBtn: {
    flex: 1,
    backgroundColor: FL_GREEN,
    borderWidth: 3,
    borderColor: '#000',
    paddingVertical: 14,
    alignItems: 'center',
  },
  gotItBtnOff: { opacity: 0.35, backgroundColor: '#444' },
  gotItText: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 12,
    letterSpacing: 1,
  },
  lessonRoot: { padding: 16, paddingBottom: 32 },
  lessonTagWrap: { alignItems: 'center', marginBottom: 12 },
  lessonTag: {
    backgroundColor: FL_YELLOW,
    borderWidth: 3,
    borderColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  lessonTagText: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 9,
    letterSpacing: 2,
  },
  lessonConcept: {
    fontFamily: FONT.display,
    color: C.white,
    fontSize: 18,
    letterSpacing: 2,
    marginTop: 10,
    textAlign: 'center',
  },
  lessonCard: {
    backgroundColor: '#FFF',
    borderWidth: 4,
    borderColor: '#000',
    padding: 20,
    marginTop: 12,
  },
  lessonEyebrow: {
    fontFamily: FONT.display,
    color: C.red,
    fontSize: 10,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 8,
  },
  lessonText: {
    fontFamily: FONT.body,
    color: '#000',
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 12,
  },
  lessonBtn: {
    backgroundColor: C.green,
    borderWidth: 4,
    borderColor: '#000',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  lessonBtnText: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 13,
    letterSpacing: 2,
  },
  hud: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#000',
    borderBottomWidth: 3,
    borderBottomColor: FL_YELLOW,
    padding: 8,
  },
  hudChip: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#333',
    padding: 6,
    alignItems: 'center',
  },
  hudChipLabel: {
    fontFamily: FONT.display,
    fontSize: 7,
    letterSpacing: 1,
  },
  hudChipValue: {
    fontFamily: FONT.display,
    color: C.white,
    fontSize: 11,
    marginTop: 2,
  },
  statBarWrap: { marginBottom: 10 },
  statBarLabel: {
    fontFamily: FONT.display,
    color: '#888',
    fontSize: 8,
    marginBottom: 4,
  },
  statBarTrack: {
    height: 12,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#444',
    flexDirection: 'row',
  },
  statBarFill: { height: '100%' },
  statBarVal: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 9,
    marginTop: 4,
  },
  fieldWrap: { marginBottom: 12 },
  fieldLabel: {
    fontFamily: FONT.display,
    color: '#888',
    fontSize: 8,
    letterSpacing: 1,
    marginBottom: 4,
  },
  fieldLabelLarge: {
    fontFamily: FONT.body,
    color: FL_GREEN,
    fontSize: 22,
    letterSpacing: 0,
    marginBottom: 6,
  },
  fieldHintLarge: {
    fontFamily: FONT.body,
    color: '#999',
    fontSize: 20,
    lineHeight: 22,
    marginBottom: 8,
  },
  fieldWrongHint: {
    fontFamily: FONT.body,
    color: C.yellow,
    fontSize: 20,
    lineHeight: 22,
    marginTop: 6,
  },
  fieldHint: {
    fontFamily: FONT.body,
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
  },
  fieldInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#444',
    backgroundColor: '#111',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  fieldInputRowLarge: {
    borderWidth: 3,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#0a0a0a',
  },
  fieldOk: { borderColor: C.green },
  fieldBad: { borderColor: C.red },
  fieldLocked: { opacity: 0.6 },
  fieldPrefix: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 18,
  },
  fieldPrefixLarge: {
    fontFamily: FONT.body,
    fontSize: 32,
  },
  fieldInput: {
    flex: 1,
    fontFamily: FONT.display,
    color: C.white,
    fontSize: 20,
    padding: 0,
    minHeight: 32,
  },
  fieldInputLarge: {
    fontFamily: FONT.body,
    fontSize: 36,
    minHeight: 44,
    letterSpacing: 1,
  },
  fieldMultiline: { minHeight: 60, textAlignVertical: 'top' },
  fieldCheck: {
    fontFamily: FONT.display,
    color: C.green,
    fontSize: 16,
  },
  fieldError: {
    fontFamily: FONT.body,
    color: C.red,
    fontSize: 14,
    marginTop: 4,
  },
  choiceCard: {
    borderWidth: 4,
    borderColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  choiceSelected: {
    borderColor: FL_YELLOW,
    borderWidth: 4,
  },
  choiceLabel: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 11,
    letterSpacing: 1,
  },
  choiceHint: {
    fontFamily: FONT.body,
    color: '#000',
    fontSize: 16,
    marginTop: 2,
    opacity: 0.85,
  },
  chatRow: { marginBottom: 10, maxWidth: '88%' },
  chatRowPlayer: { alignSelf: 'flex-end' },
  chatName: {
    fontFamily: FONT.display,
    color: '#888',
    fontSize: 7,
    marginBottom: 2,
  },
  chatBubble: {
    borderWidth: 2,
    padding: 10,
  },
  chatBubbleOther: {
    backgroundColor: '#1a1a1a',
    borderColor: '#444',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  chatBubblePlayer: {
    backgroundColor: '#0d2a1a',
    borderColor: FL_GREEN,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  chatText: {
    fontFamily: FONT.body,
    color: '#ddd',
    fontSize: 17,
    lineHeight: 20,
  },
  chatTextPlayer: { color: FL_GREEN },
  barsWrap: { gap: 12, marginVertical: 12 },
  barRow: { gap: 4 },
  barLabel: {
    fontFamily: FONT.display,
    color: '#888',
    fontSize: 8,
  },
  barTrack: {
    flexDirection: 'row',
    gap: 2,
    height: 16,
  },
  barBlock: {
    flex: 1,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#333',
  },
  barVal: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 10,
  },
  shell: { flex: 1, backgroundColor: FL_BG },
  shellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 3,
    borderBottomColor: FL_GREEN,
    backgroundColor: '#000',
  },
  shellBack: {
    width: 36,
    height: 36,
    borderWidth: 2,
    borderColor: FL_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shellBackText: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 14,
  },
  shellTitle: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 11,
    letterSpacing: 1,
  },
  shellSub: {
    fontFamily: FONT.body,
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  shellScroll: { padding: 14, paddingBottom: 16 },
  shellFooter: {
    borderTopWidth: 3,
    borderTopColor: '#222',
    backgroundColor: FL_BG,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
});
