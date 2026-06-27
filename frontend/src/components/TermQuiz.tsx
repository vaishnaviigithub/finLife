import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FINANCIAL_TERMS, FinancialTerm } from '@/src/data/financialTerms';
import { C, FONT, pixelShadow } from '@/src/ui/theme';

type QuizQuestion = {
  term: FinancialTerm;
  options: string[];
};

type Props = {
  terms: FinancialTerm[];
  onDone: () => void;
};

function shuffle<T>(items: T[]) {
  return [...items]
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

function buildQuestions(terms: FinancialTerm[]): QuizQuestion[] {
  return terms.map((term) => {
    const distractors = shuffle(
      FINANCIAL_TERMS.filter((other) => other.id !== term.id).map((other) => other.definition),
    ).slice(0, 3);

    return {
      term,
      options: shuffle([term.definition, ...distractors]),
    };
  });
}

export default function TermQuiz({ terms, onDone }: Props) {
  const questions = useMemo(() => buildQuestions(terms), [terms]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const question = questions[questionIndex];
  const selected = question ? answers[question.term.id] : undefined;
  const isComplete = questions.length > 0 && Object.keys(answers).length >= questions.length;
  const score = questions.reduce(
    (total, item) => total + (answers[item.term.id] === item.term.definition ? 1 : 0),
    0,
  );

  if (!question) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>QUIZ READY SOON</Text>
        <Pressable style={styles.primaryBtn} onPress={onDone}>
          <Text style={styles.primaryText}>BACK TO TERMS</Text>
        </Pressable>
      </View>
    );
  }

  if (isComplete) {
    const perfect = score === questions.length;
    return (
      <View style={styles.wrap}>
        <Text style={styles.eyebrow}>MINI QUIZ COMPLETE</Text>
        <Text style={styles.score}>{score}/{questions.length} correct</Text>
        <Text style={styles.message}>
          {perfect ? 'Perfect run. Your money vocabulary is leveling up.' : 'Nice work. A quick review makes the next round easier.'}
        </Text>
        <Pressable style={styles.primaryBtn} onPress={onDone}>
          <Text style={styles.primaryText}>BACK TO TERMS</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>QUESTION {questionIndex + 1} / {questions.length}</Text>
      <Text style={styles.title}>What does {question.term.term} mean?</Text>
      <View style={styles.options}>
        {question.options.map((option) => {
          const isSelected = selected === option;
          return (
            <Pressable
              key={option}
              onPress={() => setAnswers((current) => ({ ...current, [question.term.id]: option }))}
              style={[styles.option, isSelected && styles.optionSelected]}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        disabled={!selected}
        style={[styles.primaryBtn, !selected && styles.disabledBtn]}
        onPress={() => setQuestionIndex((current) => Math.min(current + 1, questions.length - 1))}
      >
        <Text style={styles.primaryText}>NEXT</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  eyebrow: {
    fontFamily: FONT.display,
    color: C.yellow,
    fontSize: 10,
    letterSpacing: 2,
    textAlign: 'center',
  },
  title: {
    fontFamily: FONT.display,
    color: C.white,
    fontSize: 15,
    letterSpacing: 1,
    lineHeight: 24,
    textAlign: 'center',
  },
  score: {
    fontFamily: FONT.display,
    color: C.green,
    fontSize: 28,
    textAlign: 'center',
  },
  message: {
    fontFamily: FONT.body,
    color: '#DDD',
    fontSize: 19,
    lineHeight: 24,
    textAlign: 'center',
  },
  options: {
    gap: 10,
  },
  option: {
    backgroundColor: '#111',
    borderWidth: 3,
    borderColor: '#333',
    padding: 12,
  },
  optionSelected: {
    backgroundColor: C.yellow,
    borderColor: '#000',
  },
  optionText: {
    fontFamily: FONT.body,
    color: C.white,
    fontSize: 18,
    lineHeight: 22,
  },
  optionTextSelected: {
    color: C.black,
  },
  primaryBtn: {
    backgroundColor: C.green,
    borderWidth: 4,
    borderColor: '#000',
    paddingVertical: 13,
    alignItems: 'center',
    ...pixelShadow(4),
  },
  disabledBtn: {
    opacity: 0.45,
  },
  primaryText: {
    fontFamily: FONT.display,
    color: '#000',
    fontSize: 13,
    letterSpacing: 2,
  },
});
