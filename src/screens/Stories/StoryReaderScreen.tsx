import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { STORIES, CATEGORY_TEXT_COLORS, type Story } from '../../data/stories';
import { LinearGradient } from 'expo-linear-gradient';
import { speakText } from '../../services/ttsService';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type ReaderRoute = RouteProp<RootStackParamList, 'StoryReader'>;

const C = {
  bg: '#0D0F1A',
  card: '#151828',
  cardBorder: '#1F2240',
  gold: '#D4AF37',
  goldDim: '#3A2E10',
  text: '#F0EFE9',
  textSub: '#8B8FA8',
  textMuted: '#555870',
  success: '#2A5C3F',
  successText: '#5DBF8A',
  error: '#3A1A1A',
  errorText: '#E07070',
};


type SpeechState = 'idle' | 'playing' | 'paused';
type ViewState = 'story' | 'quiz';

function sanitizeForSpeech(raw: string): string {
  return raw
    // En dash (–) in verse/chapter ranges → " to "
    .replace(/–/g, ' to ')
    // Em dash (—) → natural comma pause
    .replace(/—/g, ', ')
    // Bible verse colon pattern (e.g. "3:16", "22:21") → "chapter 3 verse 16"
    .replace(/\b(\d+):(\d+)\b/g, 'chapter $1 verse $2')
    // Parenthetical content → ", content," — drops brackets, keeps a breath pause
    .replace(/\s*\(([^)]+)\)\s*/g, ', $1, ')
    // Curly/smart double quotes → nothing (quoted speech flows naturally without markers)
    .replace(/[""]/g, '')
    // Curly single quotes / apostrophes → straight apostrophe
    .replace(/['']/g, "'")
    // Ellipsis character or three dots → brief pause
    .replace(/…|\.\.\./g, ', ')
    // Semicolons → comma (shorter pause than a period)
    .replace(/;/g, ',')
    // Digit hyphen digit (remaining ranges after en dash pass) → " to "
    .replace(/(\d+)-(\d+)/g, '$1 to $2')
    // Tidy up: multiple commas, trailing commas before period, extra spaces
    .replace(/,\s*,/g, ',')
    .replace(/,\s*([.!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSpeechChunks(story: Story): string[] {
  const end = (s: string) => {
    const t = sanitizeForSpeech(s).replace(/[,\s]+$/, '');
    return /[.!?]$/.test(t) ? t : t + '.';
  };
  return [
    `${end(story.title)}. ${end(story.subtitle)}`,
    end(story.reference),
    ...story.body.map(end),
    `Devotional note. ${end(story.devotionalNote)}`,
  ];
}

// chunk index → which body paragraph is highlighted (-1 = none)
function chunkToBodyIndex(chunkIdx: number, bodyLength: number): number {
  // chunks: [0]=title+sub, [1]=reference, [2..2+N-1]=body, [2+N]=devotional
  if (chunkIdx >= 2 && chunkIdx < 2 + bodyLength) return chunkIdx - 2;
  return -1;
}

export default function StoryReaderScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ReaderRoute>();
  const { storyId } = route.params;

  const story = STORIES.find((s) => s.id === storyId);

  const [viewState, setViewState] = useState<ViewState>('story');
  const [speechState, setSpeechState] = useState<SpeechState>('idle');
  const [speechRate, setSpeechRate] = useState(0.9);
  const [activeChunk, setActiveChunk] = useState(-1);

  const activeRef = useRef(false);
  const chunkIdxRef = useRef(0);
  const chunksRef = useRef<string[]>([]);
  const rateRef = useRef(0.9);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Quiz state
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [quizDone, setQuizDone] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => { rateRef.current = speechRate; }, [speechRate]);

  // Clean up speech when leaving screen
  useEffect(() => {
    return () => {
      activeRef.current = false;
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    };
  }, []);

  // Reset TTS + quiz whenever story changes
  useEffect(() => {
    activeRef.current = false;
    soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;
    setViewState('story');
    setSpeechState('idle');
    setActiveChunk(-1);
    chunkIdxRef.current = 0;
    setCurrentQ(0);
    setSelected(null);
    setAnswers([]);
    setQuizDone(false);
  }, [storyId]);

  const fadeTransition = useCallback(
    (fn: () => void) => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
        fn();
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      });
    },
    [fadeAnim]
  );

  // ── TTS ──────────────────────────────────────────────────────────────────
  const speakChunk = useCallback(async (chunks: string[], idx: number) => {
    if (!activeRef.current || idx >= chunks.length) {
      activeRef.current = false;
      setSpeechState('idle');
      setActiveChunk(-1);
      return;
    }
    chunkIdxRef.current = idx;
    setActiveChunk(idx);
    const sound = await speakText(chunks[idx], `story-${storyId}-${idx}`);
    sound.setRateAsync(rateRef.current, true).catch(() => {});
    soundRef.current = sound;
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        soundRef.current?.unloadAsync().catch(() => {});
        soundRef.current = null;
        if (!activeRef.current) return;
        setTimeout(() => { void speakChunk(chunks, idx + 1); }, 350);
      }
    });
  }, [storyId]);

  const handlePlay = () => {
    if (!story) return;
    const chunks = buildSpeechChunks(story);
    chunksRef.current = chunks;
    activeRef.current = true;
    setSpeechState('playing');
    const startIdx = speechState === 'paused' ? chunkIdxRef.current : 0;
    void speakChunk(chunks, startIdx).catch(() => {
      activeRef.current = false;
      setSpeechState('idle');
      setActiveChunk(-1);
    });
  };

  const handlePause = async () => {
    activeRef.current = false;
    await soundRef.current?.pauseAsync().catch(() => {});
    setSpeechState('paused');
  };

  const handleStop = async () => {
    activeRef.current = false;
    await soundRef.current?.stopAsync().catch(() => {});
    await soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;
    setSpeechState('idle');
    setActiveChunk(-1);
    chunkIdxRef.current = 0;
  };

  const cycleRate = () => {
    const rates = [0.75, 0.9, 1.0, 1.25];
    const next = rates[(rates.indexOf(speechRate) + 1) % rates.length];
    setSpeechRate(next);
    rateRef.current = next;
    soundRef.current?.setRateAsync(next, true).catch(() => {});
    if (speechState === 'playing') {
      activeRef.current = false;
      soundRef.current?.stopAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
      activeRef.current = true;
      setTimeout(() => { void speakChunk(chunksRef.current, chunkIdxRef.current); }, 100);
    }
  };

  const rateLabel = speechRate === 0.75 ? '0.75×' : speechRate === 0.9 ? '0.9×' : speechRate === 1.0 ? '1×' : '1.25×';
  const activeBodyIdx = story ? chunkToBodyIndex(activeChunk, story.body.length) : -1;

  // ── Quiz ─────────────────────────────────────────────────────────────────
  const openQuiz = () => {
    activeRef.current = false;
    soundRef.current?.stopAsync().catch(() => {});
    soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;
    setSpeechState('idle');
    fadeTransition(() => {
      setViewState('quiz');
      setCurrentQ(0);
      setSelected(null);
      setAnswers([]);
      setQuizDone(false);
    });
  };

  const handleSelectAnswer = (idx: number) => {
    if (selected !== null) return; // already answered
    setSelected(idx);
  };

  const handleNextQuestion = () => {
    if (!story || selected === null) return;
    const correct = selected === story.quiz[currentQ].correct;
    const newAnswers = [...answers, correct];
    setAnswers(newAnswers);

    if (currentQ + 1 >= story.quiz.length) {
      fadeTransition(() => {
        setAnswers(newAnswers);
        setQuizDone(true);
      });
    } else {
      fadeTransition(() => {
        setCurrentQ((q) => q + 1);
        setSelected(null);
      });
    }
  };

  const handleRetryQuiz = () => {
    fadeTransition(() => {
      setCurrentQ(0);
      setSelected(null);
      setAnswers([]);
      setQuizDone(false);
    });
  };

  const handleBackToStory = () => {
    fadeTransition(() => setViewState('story'));
  };

  if (!story) {
    return (
      <LinearGradient colors={['#5C3A10', '#080604']} style={{ flex: 1 }}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.center}>
          <Text style={s.errorText}>Story not found.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.goldBtn}>
            <Text style={s.goldBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      </LinearGradient>
    );
  }

  const categoryColor = CATEGORY_TEXT_COLORS[story.category];
  const score = answers.filter(Boolean).length;

  return (
    <LinearGradient colors={['#5C3A10', '#080604']} style={{ flex: 1 }}>
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          {viewState === 'quiz' ? 'QUIZ' : story.title.toUpperCase()}
        </Text>
        {viewState === 'story' ? (
          <TouchableOpacity onPress={openQuiz} style={s.quizBtn}>
            <Text style={s.quizBtnText}>Quiz</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleBackToStory} style={s.quizBtn}>
            <Text style={s.quizBtnText}>Story</Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        {viewState === 'story' ? (
          <>
            {/* Story content */}
            <ScrollView
              contentContainerStyle={s.storyContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Category + reference */}
              <View style={s.storyMeta}>
                <Text style={[s.storyCategory, { color: categoryColor }]}>
                  {story.category.toUpperCase()}
                </Text>
                <Text style={s.storySeparator}>·</Text>
                <Text style={s.storyRef}>{story.reference}</Text>
              </View>

              <Text style={s.storyTitle}>{story.title}</Text>
              <Text style={s.storySubtitle}>{story.subtitle}</Text>

              <View style={s.divider} />

              {story.body.map((para, i) => (
                <Text
                  key={i}
                  style={[s.bodyPara, activeBodyIdx === i && s.bodyParaActive]}
                >
                  {para}
                </Text>
              ))}

              {/* Devotional note */}
              <View style={[s.devotionalCard, activeChunk === 2 + story.body.length && s.devotionalCardActive]}>
                <Text style={s.devotionalLabel}>DEVOTIONAL NOTE</Text>
                <Text style={s.devotionalText}>{story.devotionalNote}</Text>
              </View>

              {/* Quiz CTA */}
              <TouchableOpacity style={s.quizCta} onPress={openQuiz} activeOpacity={0.85}>
                <Text style={s.quizCtaText}>Test Your Understanding</Text>
                <Text style={s.quizCtaSub}>{story.quiz.length} questions · See how well you know this story</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* TTS bar */}
            <View style={s.ttsBar}>
              <TouchableOpacity onPress={cycleRate} style={s.ttsRateBtn}>
                <Text style={s.ttsRateText}>{rateLabel}</Text>
              </TouchableOpacity>

              <View style={s.ttsControls}>
                <TouchableOpacity onPress={handleStop} style={s.ttsBtn} disabled={speechState === 'idle'}>
                  <Text style={[s.ttsBtnIcon, speechState === 'idle' && s.ttsBtnDisabled]}>■</Text>
                </TouchableOpacity>

                {speechState === 'playing' ? (
                  <TouchableOpacity onPress={handlePause} style={[s.ttsBtn, s.ttsBtnMain]}>
                    <Text style={s.ttsBtnMainIcon}>⏸</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={handlePlay} style={[s.ttsBtn, s.ttsBtnMain]}>
                    <Text style={s.ttsBtnMainIcon}>▶</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={s.ttsLabel} numberOfLines={1}>
                {speechState === 'playing' ? 'Reading…' : speechState === 'paused' ? 'Paused' : 'Read Aloud'}
              </Text>
            </View>
          </>
        ) : (
          /* Quiz view */
          <View style={s.quizContainer}>
            {!quizDone ? (
              <>
                {/* Progress dots */}
                <View style={s.progressDots}>
                  {story.quiz.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        s.dot,
                        i === currentQ && s.dotActive,
                        i < currentQ && answers[i] && s.dotCorrect,
                        i < currentQ && !answers[i] && s.dotWrong,
                      ]}
                    />
                  ))}
                </View>

                <Text style={s.questionCount}>Question {currentQ + 1} of {story.quiz.length}</Text>
                <Text style={s.questionText}>{story.quiz[currentQ].question}</Text>

                <View style={s.optionsContainer}>
                  {story.quiz[currentQ].options.map((opt, idx) => {
                    const isSelected = selected === idx;
                    const correct = story.quiz[currentQ].correct;
                    const showResult = selected !== null;
                    const isCorrect = idx === correct;
                    const isWrong = isSelected && !isCorrect;

                    let optStyle = s.option;
                    let optTextStyle = s.optionText;

                    if (showResult && isCorrect) {
                      optStyle = { ...s.option, ...s.optionCorrect };
                      optTextStyle = { ...s.optionText, ...s.optionCorrectText };
                    } else if (showResult && isWrong) {
                      optStyle = { ...s.option, ...s.optionWrong };
                      optTextStyle = { ...s.optionText, ...s.optionWrongText };
                    } else if (isSelected) {
                      optStyle = { ...s.option, ...s.optionSelected };
                    }

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={optStyle}
                        onPress={() => handleSelectAnswer(idx)}
                        activeOpacity={selected !== null ? 1 : 0.8}
                      >
                        <View style={s.optionLetter}>
                          <Text style={s.optionLetterText}>{['A', 'B', 'C', 'D'][idx]}</Text>
                        </View>
                        <Text style={optTextStyle}>{opt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {selected !== null && (
                  <TouchableOpacity style={s.nextBtn} onPress={handleNextQuestion} activeOpacity={0.85}>
                    <Text style={s.nextBtnText}>
                      {currentQ + 1 < story.quiz.length ? 'Next Question' : 'See Results'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              /* Results */
              <View style={s.resultsContainer}>
                <Text style={s.resultScoreLabel}>YOUR SCORE</Text>
                <Text style={s.resultScore}>{score}/{story.quiz.length}</Text>
                <Text style={s.resultSubtitle}>
                  {score === story.quiz.length
                    ? 'Perfect! You know this story well.'
                    : score >= story.quiz.length / 2
                    ? 'Well done! Keep studying God\'s word.'
                    : 'Keep going — every reading makes it clearer.'}
                </Text>

                {/* Per-question results */}
                <View style={s.resultBreakdown}>
                  {story.quiz.map((q, i) => (
                    <View key={i} style={s.resultRow}>
                      <View
                        style={[
                          s.resultBullet,
                          { backgroundColor: answers[i] ? C.successText : C.errorText },
                        ]}
                      />
                      <Text style={s.resultRowText} numberOfLines={2}>{q.question}</Text>
                    </View>
                  ))}
                </View>

                <View style={s.resultActions}>
                  <TouchableOpacity style={s.retryBtn} onPress={handleRetryQuiz} activeOpacity={0.85}>
                    <Text style={s.retryBtnText}>Try Again</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.goldBtn} onPress={handleBackToStory} activeOpacity={0.85}>
                    <Text style={s.goldBtnText}>Back to Story</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  errorText: { color: C.textSub, fontSize: 15 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  backBtn: { width: 44, alignItems: 'flex-start' },
  backIcon: { fontSize: 30, color: C.gold, lineHeight: 34 },
  headerTitle: { flex: 1, fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1.4, textAlign: 'center' },
  quizBtn: {
    width: 52,
    alignItems: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  quizBtnText: { fontSize: 13, fontWeight: '700', color: C.gold },

  // ── Story ─────────────────────────────────────────────────────────────────
  storyContent: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 120 },

  storyMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  storyCategory: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  storySeparator: { color: C.textMuted, fontSize: 10 },
  storyRef: { fontSize: 11, color: C.textMuted, fontWeight: '500' },

  storyTitle: { fontSize: 26, fontWeight: '800', color: C.text, lineHeight: 32, marginBottom: 6 },
  storySubtitle: { fontSize: 14, color: C.textSub, fontStyle: 'italic', marginBottom: 20 },

  divider: { height: 1, backgroundColor: C.cardBorder, marginBottom: 24 },

  bodyPara: {
    fontSize: 16,
    color: C.text,
    lineHeight: 28,
    marginBottom: 20,
    letterSpacing: 0.15,
  },
  bodyParaActive: {
    color: C.gold,
    opacity: 1,
  },

  devotionalCard: {
    backgroundColor: C.goldDim,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.gold + '40',
    padding: 18,
    marginBottom: 28,
  },
  devotionalCardActive: {
    borderColor: C.gold,
    borderWidth: 2,
  },
  devotionalLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: C.gold,
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  devotionalText: { fontSize: 14, color: '#E8D87F', lineHeight: 24, fontStyle: 'italic' },

  quizCta: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.gold + '60',
    padding: 18,
    alignItems: 'center',
    marginBottom: 8,
  },
  quizCtaText: { fontSize: 15, fontWeight: '700', color: C.gold, marginBottom: 4 },
  quizCtaSub: { fontSize: 12, color: C.textSub, textAlign: 'center' },

  // ── TTS bar ───────────────────────────────────────────────────────────────
  ttsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    paddingBottom: 28,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.cardBorder,
  },
  ttsRateBtn: {
    width: 50,
    height: 34,
    borderRadius: 8,
    backgroundColor: C.goldDim,
    borderWidth: 1,
    borderColor: C.gold + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ttsRateText: { fontSize: 11, fontWeight: '700', color: C.gold },
  ttsControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ttsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ttsBtnMain: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.goldDim,
    borderColor: C.gold,
  },
  ttsBtnError: {
    backgroundColor: C.error,
    borderColor: C.errorText,
  },
  ttsBtnIcon: { fontSize: 14, color: C.textSub },
  ttsBtnMainIcon: { fontSize: 18, color: C.gold },
  ttsBtnDisabled: { color: C.textMuted },
  ttsLabel: { fontSize: 10, color: C.textMuted, flex: 1, textAlign: 'right' },
  ttsLabelError: { color: C.errorText },

  // ── Quiz ──────────────────────────────────────────────────────────────────
  quizContainer: { flex: 1, paddingHorizontal: 22, paddingTop: 24 },

  progressDots: { flexDirection: 'row', gap: 8, marginBottom: 24, justifyContent: 'center' },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.cardBorder,
  },
  dotActive: { backgroundColor: C.gold, width: 24 },
  dotCorrect: { backgroundColor: C.successText },
  dotWrong: { backgroundColor: C.errorText },

  questionCount: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  questionText: {
    fontSize: 19,
    fontWeight: '700',
    color: C.text,
    lineHeight: 28,
    marginBottom: 28,
  },

  optionsContainer: { gap: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 14,
    gap: 12,
  },
  optionSelected: {
    borderColor: C.gold,
    backgroundColor: C.goldDim,
  },
  optionCorrect: {
    borderColor: C.successText,
    backgroundColor: C.success,
  },
  optionWrong: {
    borderColor: C.errorText,
    backgroundColor: C.error,
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterText: { fontSize: 12, fontWeight: '700', color: C.textSub },
  optionText: { flex: 1, fontSize: 14, color: C.text, lineHeight: 20 },
  optionCorrectText: { color: C.successText },
  optionWrongText: { color: C.errorText },

  nextBtn: {
    marginTop: 24,
    backgroundColor: C.gold,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: C.bg },

  // ── Results ───────────────────────────────────────────────────────────────
  resultsContainer: { flex: 1, alignItems: 'center', paddingTop: 20 },
  resultScoreLabel: { fontSize: 10, fontWeight: '800', color: C.textMuted, letterSpacing: 1.4, marginBottom: 8 },
  resultScore: { fontSize: 64, fontWeight: '800', color: C.gold, lineHeight: 72, marginBottom: 8 },
  resultSubtitle: { fontSize: 14, color: C.textSub, textAlign: 'center', paddingHorizontal: 24, marginBottom: 28, lineHeight: 22 },

  resultBreakdown: { width: '100%', gap: 10, marginBottom: 32 },
  resultRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  resultBullet: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  resultRowText: { flex: 1, fontSize: 13, color: C.textSub, lineHeight: 20 },

  resultActions: { flexDirection: 'row', gap: 12, width: '100%' },
  retryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: 'center',
    backgroundColor: C.card,
  },
  retryBtnText: { fontSize: 14, fontWeight: '600', color: C.textSub },
  goldBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: C.goldDim,
    borderWidth: 1,
    borderColor: C.gold + '60',
    alignItems: 'center',
  },
  goldBtnText: { fontSize: 14, fontWeight: '700', color: C.gold },
});
