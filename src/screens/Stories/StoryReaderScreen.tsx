import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Animated, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { STORIES, CATEGORY_TEXT_COLORS, type Story } from '../../data/stories';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

type NavProp     = NativeStackNavigationProp<RootStackParamList>;
type ReaderRoute = RouteProp<RootStackParamList, 'StoryReader'>;

const GOLD  = '#C9A96B';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

type ViewState = 'story' | 'quiz';

export default function StoryReaderScreen() {
  const navigation = useNavigation<NavProp>();
  const route   = useRoute<ReaderRoute>();
  const t       = useTheme();
  const insets  = useSafeAreaInsets();
  const { storyId } = route.params;

  const isDark = t.statusBar === 'light-content';
  const C = {
    bg:          isDark ? '#0D0F1A' : '#F2EDE0',
    card:        isDark ? 'rgba(255,255,255,0.05)'  : 'rgba(255,255,255,0.72)',
    cardBorder:  isDark ? 'rgba(255,255,255,0.09)'  : 'rgba(255,255,255,0.85)',
    text:        isDark ? 'rgba(255,255,255,0.92)'  : 'rgba(24,18,8,0.92)',
    textSub:     isDark ? 'rgba(255,255,255,0.62)'  : 'rgba(24,18,8,0.62)',
    textMuted:   isDark ? 'rgba(255,255,255,0.36)'  : 'rgba(24,18,8,0.36)',
    divider:     isDark ? 'rgba(255,255,255,0.08)'  : 'rgba(0,0,0,0.08)',
    success:     isDark ? 'rgba(42,92,63,0.85)'     : 'rgba(200,240,215,0.85)',
    successText: isDark ? '#5DBF8A'                 : '#1B6A3F',
    error:       isDark ? 'rgba(58,26,26,0.85)'     : 'rgba(255,220,220,0.85)',
    errorText:   isDark ? '#E07070'                 : '#9B2020',
    goldDim:     isDark ? 'rgba(201,169,107,0.10)'  : 'rgba(201,169,107,0.14)',
  };

  const story = STORIES.find((s) => s.id === storyId);

  const [viewState, setViewState] = useState<ViewState>('story');
  const [currentQ,  setCurrentQ]  = useState(0);
  const [selected,  setSelected]  = useState<number | null>(null);
  const [answers,   setAnswers]   = useState<boolean[]>([]);
  const [quizDone,  setQuizDone]  = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setViewState('story');
    setCurrentQ(0);
    setSelected(null);
    setAnswers([]);
    setQuizDone(false);
  }, [storyId]);

  const fadeTransition = useCallback((fn: () => void) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      fn();
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  const openQuiz = () => {
    fadeTransition(() => {
      setViewState('quiz');
      setCurrentQ(0);
      setSelected(null);
      setAnswers([]);
      setQuizDone(false);
    });
  };

  const handleSelectAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
  };

  const handleNextQuestion = () => {
    if (!story || selected === null) return;
    const correct = selected === story.quiz[currentQ].correct;
    const newAnswers = [...answers, correct];
    setAnswers(newAnswers);
    if (currentQ + 1 >= story.quiz.length) {
      fadeTransition(() => { setAnswers(newAnswers); setQuizDone(true); });
    } else {
      fadeTransition(() => { setCurrentQ(q => q + 1); setSelected(null); });
    }
  };

  const handleRetryQuiz = () => {
    fadeTransition(() => { setCurrentQ(0); setSelected(null); setAnswers([]); setQuizDone(false); });
  };

  const handleBackToStory = () => fadeTransition(() => setViewState('story'));

  if (!story) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Text style={{ color: C.textSub, fontSize: 15 }}>Story not found.</Text>
        <TouchableOpacity
          style={{ backgroundColor: C.goldDim, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 28, borderWidth: 1, borderColor: GOLD + '55' }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: GOLD }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const categoryColor = CATEGORY_TEXT_COLORS[story.category];
  const score = answers.filter(Boolean).length;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={[s.header, {
        paddingTop: insets.top + 6,
        borderBottomColor: C.divider,
        backgroundColor: C.bg,
      }]}>
        <TouchableOpacity
          style={[s.headerIconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}
          onPress={() => navigation.goBack()}
          hitSlop={10}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={isDark ? 'rgba(255,255,255,0.88)' : 'rgba(24,18,8,0.88)'} />
        </TouchableOpacity>

        <Text style={[s.headerTitle, { color: C.textMuted }]} numberOfLines={1}>
          {viewState === 'quiz' ? 'QUIZ' : story.title.toUpperCase()}
        </Text>

        <TouchableOpacity
          style={[s.quizSwitchBtn, { backgroundColor: isDark ? 'rgba(201,169,107,0.12)' : 'rgba(201,169,107,0.14)', borderColor: 'rgba(201,169,107,0.30)' }]}
          onPress={viewState === 'story' ? openQuiz : handleBackToStory}
          activeOpacity={0.8}
        >
          <Ionicons
            name={viewState === 'story' ? 'help-circle-outline' : 'book-outline'}
            size={14}
            color={GOLD}
          />
          <Text style={[s.quizSwitchText]}>{viewState === 'story' ? 'Quiz' : 'Story'}</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {viewState === 'story' ? (
          /* ── Story view ─────────────────────────────────────────────────── */
          <ScrollView
            contentContainerStyle={[s.storyContent, { paddingBottom: Math.max(insets.bottom, 16) + 40 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Category + reference */}
            <View style={s.storyMeta}>
              <Text style={[s.storyCategory, { color: categoryColor }]}>{story.category.toUpperCase()}</Text>
              <View style={[s.metaDot, { backgroundColor: C.textMuted }]} />
              <Text style={[s.storyRef, { color: C.textMuted }]}>{story.reference}</Text>
            </View>

            <Text style={[s.storyTitle, { color: C.text, fontFamily: SERIF }]}>{story.title}</Text>
            <Text style={[s.storySubtitle, { color: C.textSub, fontFamily: SERIF }]}>{story.subtitle}</Text>

            <View style={[s.divider, { backgroundColor: C.divider }]} />

            {story.body.map((para, i) => (
              <Text key={i} style={[s.bodyPara, { color: C.textSub, fontFamily: SERIF }]}>{para}</Text>
            ))}

            {/* Devotional note — glass card with gold accent */}
            <View style={[s.devotionalCard, {
              backgroundColor: C.goldDim,
              borderColor: GOLD + '35',
            }]}>
              <View style={[s.devotionalAccent]} />
              <View style={s.devotionalBody}>
                <Text style={s.devotionalLabel}>DEVOTIONAL NOTE</Text>
                <Text style={[s.devotionalText, { color: isDark ? '#E8D87F' : '#7A5C10', fontFamily: SERIF }]}>
                  {story.devotionalNote}
                </Text>
              </View>
            </View>

            {/* Quiz CTA */}
            <TouchableOpacity
              style={[s.quizCta, { backgroundColor: C.card, borderColor: GOLD + '55' }]}
              onPress={openQuiz}
              activeOpacity={0.85}
            >
              <Ionicons name="help-circle-outline" size={20} color={GOLD} />
              <View style={{ flex: 1 }}>
                <Text style={[s.quizCtaText]}>{story.quiz.length} Questions</Text>
                <Text style={[s.quizCtaSub, { color: C.textSub }]}>Test your understanding of this story</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={GOLD} />
            </TouchableOpacity>
          </ScrollView>
        ) : (
          /* ── Quiz view ──────────────────────────────────────────────────── */
          <View style={[s.quizContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            {!quizDone ? (
              <>
                {/* Progress dots */}
                <View style={s.progressDots}>
                  {story.quiz.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        s.dot,
                        { backgroundColor: C.divider },
                        i === currentQ && { backgroundColor: GOLD, width: 24 },
                        i < currentQ && answers[i] && { backgroundColor: C.successText },
                        i < currentQ && !answers[i] && { backgroundColor: C.errorText },
                      ]}
                    />
                  ))}
                </View>

                <Text style={[s.questionCount, { color: C.textMuted }]}>
                  Question {currentQ + 1} of {story.quiz.length}
                </Text>
                <Text style={[s.questionText, { color: C.text, fontFamily: SERIF }]}>
                  {story.quiz[currentQ].question}
                </Text>

                <View style={s.optionsContainer}>
                  {story.quiz[currentQ].options.map((opt, idx) => {
                    const isSelected = selected === idx;
                    const correct    = story.quiz[currentQ].correct;
                    const showResult = selected !== null;
                    const isCorrect  = idx === correct;
                    const isWrong    = isSelected && !isCorrect;

                    let bg:     string = C.card;
                    let border: string = C.cardBorder;
                    let textClr = C.text;

                    if (showResult && isCorrect) { bg = C.success; border = C.successText; textClr = C.successText; }
                    else if (showResult && isWrong) { bg = C.error; border = C.errorText; textClr = C.errorText; }
                    else if (isSelected) { bg = C.goldDim; border = GOLD; }

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[s.option, { backgroundColor: bg, borderColor: border }]}
                        onPress={() => handleSelectAnswer(idx)}
                        activeOpacity={selected !== null ? 1 : 0.8}
                      >
                        <View style={[s.optionLetter, { backgroundColor: isDark ? 'rgba(0,0,0,0.40)' : 'rgba(0,0,0,0.06)' }]}>
                          <Text style={[s.optionLetterText, { color: C.textMuted }]}>
                            {['A', 'B', 'C', 'D'][idx]}
                          </Text>
                        </View>
                        <Text style={[s.optionText, { color: textClr }]}>{opt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {selected !== null && (
                  <TouchableOpacity style={s.nextBtn} onPress={handleNextQuestion} activeOpacity={0.85}>
                    <LinearGradient
                      colors={[GOLD, '#B8904A']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={s.nextBtnGradient}
                    >
                      <Text style={s.nextBtnText}>
                        {currentQ + 1 < story.quiz.length ? 'Next Question' : 'See Results'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              /* ── Results ─────────────────────────────────────────────────── */
              <ScrollView contentContainerStyle={s.resultsContainer} showsVerticalScrollIndicator={false}>
                {/* Score display */}
                <View style={[s.scoreCircle, { borderColor: GOLD + '35', backgroundColor: C.goldDim }]}>
                  <Text style={s.resultScore}>{score}/{story.quiz.length}</Text>
                  <Text style={[s.resultScoreLabel, { color: C.textMuted }]}>SCORE</Text>
                </View>

                <Text style={[s.resultSubtitle, { color: C.textSub, fontFamily: SERIF, fontStyle: 'italic' }]}>
                  {score === story.quiz.length
                    ? 'Perfect! You know this story well.'
                    : score >= story.quiz.length / 2
                    ? "Well done! Keep studying God's word."
                    : 'Keep going — every reading makes it clearer.'}
                </Text>

                <View style={s.resultBreakdown}>
                  {story.quiz.map((q, i) => (
                    <View key={i} style={[s.resultRow, { borderColor: C.divider }]}>
                      <Ionicons
                        name={answers[i] ? 'checkmark-circle' : 'close-circle'}
                        size={16}
                        color={answers[i] ? C.successText : C.errorText}
                      />
                      <Text style={[s.resultRowText, { color: C.textSub }]} numberOfLines={2}>{q.question}</Text>
                    </View>
                  ))}
                </View>

                <View style={s.resultActions}>
                  <TouchableOpacity
                    style={[s.retryBtn, { backgroundColor: C.card, borderColor: C.cardBorder }]}
                    onPress={handleRetryQuiz}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="refresh-outline" size={16} color={C.textSub} />
                    <Text style={[s.retryBtnText, { color: C.textSub }]}>Try Again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.storyBtn, { backgroundColor: C.goldDim, borderColor: GOLD + '55' }]}
                    onPress={handleBackToStory}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="book-outline" size={16} color={GOLD} />
                    <Text style={s.storyBtnText}>Back to Story</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textAlign: 'center',
  },
  quizSwitchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, borderWidth: 1,
  },
  quizSwitchText: { fontSize: 13, fontWeight: '700', color: GOLD },

  // ── Story
  storyContent: { paddingHorizontal: 22, paddingTop: 20 },
  storyMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  storyCategory: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  metaDot: { width: 3, height: 3, borderRadius: 1.5 },
  storyRef: { fontSize: 11, fontWeight: '500' },
  storyTitle: { fontSize: 28, fontWeight: '400', lineHeight: 36, letterSpacing: -0.3, marginBottom: 8 },
  storySubtitle: { fontSize: 14, fontStyle: 'italic', marginBottom: 22 },
  divider: { height: 1, marginBottom: 22 },
  bodyPara: { fontSize: 16, lineHeight: 28, marginBottom: 20, letterSpacing: 0.1 },

  devotionalCard: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 24 },
  devotionalAccent: { width: 3, backgroundColor: GOLD },
  devotionalBody: { flex: 1, padding: 16 },
  devotionalLabel: { fontSize: 9, fontWeight: '800', color: GOLD, letterSpacing: 1.4, marginBottom: 10 },
  devotionalText: { fontSize: 14, lineHeight: 24, fontStyle: 'italic' },

  quizCta: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 8,
  },
  quizCtaText: { fontSize: 15, fontWeight: '700', color: GOLD, marginBottom: 2 },
  quizCtaSub:  { fontSize: 12 },

  // ── Quiz
  quizContainer: { flex: 1, paddingHorizontal: 22, paddingTop: 20 },
  progressDots: { flexDirection: 'row', gap: 8, marginBottom: 24, justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  questionCount: { fontSize: 11, fontWeight: '600', letterSpacing: 0.6, marginBottom: 12 },
  questionText: { fontSize: 20, fontWeight: '400', lineHeight: 30, marginBottom: 28 },
  optionsContainer: { gap: 12 },
  option: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 12,
  },
  optionLetter: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  optionLetterText: { fontSize: 12, fontWeight: '700' },
  optionText: { flex: 1, fontSize: 14, lineHeight: 20 },
  nextBtn: { marginTop: 24, borderRadius: 14, overflow: 'hidden' },
  nextBtnGradient: { paddingVertical: 15, alignItems: 'center' },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: '#08071A' },

  // ── Results
  resultsContainer: { alignItems: 'center', paddingTop: 20, paddingHorizontal: 22, paddingBottom: 40 },
  scoreCircle: {
    width: 120, height: 120, borderRadius: 60, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  resultScore:      { fontSize: 42, fontWeight: '800', color: GOLD, lineHeight: 48 },
  resultScoreLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.4 },
  resultSubtitle: { fontSize: 15, textAlign: 'center', paddingHorizontal: 16, marginBottom: 28, lineHeight: 24 },
  resultBreakdown: { width: '100%', gap: 0, marginBottom: 28 },
  resultRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultRowText: { flex: 1, fontSize: 13, lineHeight: 20 },
  resultActions: { flexDirection: 'row', gap: 12, width: '100%' },
  retryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  retryBtnText: { fontSize: 14, fontWeight: '600' },
  storyBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  storyBtnText: { fontSize: 14, fontWeight: '700', color: GOLD },
});
