import React, {
  useEffect, useState, useCallback, useRef, useMemo,
} from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Animated, Easing, Vibration, Platform,
  ActivityIndicator, LayoutAnimation, UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { getPlanById, completeDay, passageLabel } from '../../services/readingPlanService';
import { getScriptureInsights } from '../../services/appApi';
import { fetchChapterOffline } from '../../services/offlineBibleService';
import type { HomeStackParamList } from '../../types/navigation';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Nav   = NativeStackNavigationProp<HomeStackParamList>;
type Route = RouteProp<HomeStackParamList, 'Reflection'>;

type InsightData = {
  summary: string;
  keyThemes: string[];
  historicalContext: string;
  theologicalInsight: string;
  crossReferences: Array<{ reference: string; connection: string }>;
  applicationToday: string;
  prayerFocus: string;
};

type Section = {
  id: string;
  label: string;
  content: (data: InsightData) => string;
};

const SECTIONS: Section[] = [
  { id: 'insight',  label: 'Key Insight',       content: (d) => d.theologicalInsight },
  { id: 'history',  label: 'Historical Context', content: (d) => d.historicalContext  },
  { id: 'app',      label: 'Life Application',   content: (d) => d.applicationToday   },
  { id: 'prayer',   label: 'Prayer Focus',       content: (d) => d.prayerFocus        },
  { id: 'themes',   label: 'Key Themes',         content: (d) => d.keyThemes.join('\n') },
  { id: 'cross',    label: 'Cross References',   content: (d) => d.crossReferences.map((r) => `${r.reference} — ${r.connection}`).join('\n\n') },
];

const COMPLETION_VERSES = [
  '"Your word is a lamp to my feet and a light to my path." — Psalm 119:105',
  '"Blessed is the one who reads aloud the words of this prophecy." — Revelation 1:3',
  '"Let the word of Christ dwell in you richly." — Colossians 3:16',
  '"How sweet are your words to my taste, sweeter than honey to my mouth." — Psalm 119:103',
  '"Man shall not live by bread alone, but by every word that comes from the mouth of God." — Matthew 4:4',
];

export default function ReflectionScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const t          = useTheme();

  const { planId, day } = route.params;

  const [insights,        setInsights]       = useState<InsightData | null>(null);
  const [loadingAI,       setLoadingAI]      = useState(true);
  const [aiError,         setAiError]        = useState(false);
  const [expanded,        setExpanded]       = useState<string | null>('insight');
  const [completed,       setCompleted]      = useState(false);
  const [completing,      setCompleting]     = useState(false);
  const [completionStreak,    setCompletionStreak]    = useState(0);
  const [isNewRecord,     setIsNewRecord]    = useState(false);

  // Completion animation values
  const completionAnim  = useRef(new Animated.Value(0)).current;
  const glowAnim        = useRef(new Animated.Value(0)).current;
  const particleAnims   = useRef(
    Array.from({ length: 8 }, () => ({
      y: new Animated.Value(0),
      x: new Animated.Value(0),
      op: new Animated.Value(1),
      scale: new Animated.Value(0.5),
    }))
  ).current;

  const plan    = useMemo(() => getPlanById(planId), [planId]);
  const reading = useMemo(() => plan?.readings.find((r) => r.day === day), [plan, day]);

  const completionVerse = useMemo(
    () => COMPLETION_VERSES[day % COMPLETION_VERSES.length],
    [day]
  );

  // Load AI insights
  useEffect(() => {
    if (!reading) return;

    (async () => {
      try {
        // Combine text from the first passage for AI context
        const firstPassage = reading.passages[0];
        const verses = fetchChapterOffline('kjv', firstPassage.bookIndex, firstPassage.chapter);
        const passageText = verses.slice(0, 20).map((v) => `${v.verse}. ${v.text}`).join(' ');

        const data = await getScriptureInsights({
          reference: passageLabel(reading.passages),
          text: passageText,
          type: reading.passages.length === 1 ? 'chapter' : 'verse',
        });
        setInsights(data);
      } catch {
        setAiError(true);
      } finally {
        setLoadingAI(false);
      }
    })();
  }, [reading]);

  const toggleSection = useCallback((id: string) => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: { type: 'easeOut', property: 'opacity' },
      update: { type: 'easeInEaseOut' },
      delete: { type: 'easeIn', property: 'opacity' },
    });
    setExpanded((prev) => (prev === id ? null : id));
  }, []);

  const runCompletionAnimation = useCallback(() => {
    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
      { iterations: 4 }
    ).start();

    // Particles burst
    const particleAnimations = particleAnims.map((p, i) => {
      const angle = (i / particleAnims.length) * 2 * Math.PI;
      const distance = 60 + Math.random() * 40;
      return Animated.parallel([
        Animated.timing(p.y, { toValue: -distance * Math.cos(angle), duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(p.x, { toValue: distance * Math.sin(angle), duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(p.scale, { toValue: 1.2, duration: 300, useNativeDriver: true }),
          Animated.timing(p.op, { toValue: 0, duration: 600, delay: 300, useNativeDriver: true }),
        ]),
      ]);
    });

    Animated.stagger(60, particleAnimations).start();
  }, [particleAnims, glowAnim]);

  const handleComplete = useCallback(async () => {
    if (completing || completed) return;
    setCompleting(true);

    try {
      const result = await completeDay(day);
      setCompletionStreak(result.streak);
      setIsNewRecord(result.isNewRecord);
    } catch {}

    if (Platform.OS !== 'web') Vibration.vibrate([0, 60, 80, 40]);

    Animated.timing(completionAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    setCompleted(true);
    setCompleting(false);
    runCompletionAnimation();
  }, [completing, completed, day, completionAnim, runCompletionAnimation]);

  const handleHome = useCallback(() => {
    navigation.popToTop();
  }, [navigation]);

  const handleNextDay = useCallback(() => {
    navigation.replace('TodayJourney');
  }, [navigation]);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#0A0806' }]} />

      {/* ── Main reflection content ── */}
      <SafeAreaView style={s.safe} edges={['top']}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={22} color="rgba(240,237,230,0.6)" />
          </TouchableOpacity>
          <Text style={s.headerLabel}>Today's Reflection</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
        >
          {/* Reading reference */}
          <Text style={s.passageRef}>{passageLabel(reading?.passages ?? [])}</Text>
          <Text style={s.readingTitle}>{reading?.title}</Text>

          <View style={s.sectionGap} />

          {/* AI loading / error state */}
          {loadingAI && (
            <View style={s.aiLoading}>
              <ActivityIndicator size="small" color="#C9A96B" />
              <Text style={s.aiLoadingText}>Preparing your reflection…</Text>
            </View>
          )}

          {aiError && !loadingAI && (
            <Text style={s.aiError}>
              Reflection could not be loaded. Read today's passage slowly and sit with it.
            </Text>
          )}

          {/* Reflection summary — always shown above accordion */}
          {!loadingAI && insights && (
            <>
              <Text style={s.summaryText}>{insights.summary}</Text>
              <View style={s.summaryRule} />
            </>
          )}

          {/* Expandable sections — no cards, just dividers */}
          {!loadingAI && insights && SECTIONS.map((section) => {
            const isOpen = expanded === section.id;
            const body   = section.content(insights);

            return (
              <View key={section.id} style={s.sectionBlock}>
                <TouchableOpacity
                  style={s.sectionHeader}
                  onPress={() => toggleSection(section.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.sectionLabel, isOpen && s.sectionLabelOpen]}>
                    {section.label}
                  </Text>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={isOpen ? '#C9A96B' : 'rgba(240,237,230,0.25)'}
                  />
                </TouchableOpacity>

                {isOpen && (
                  <Text style={s.sectionBody}>{body}</Text>
                )}

                <View style={s.sectionDivider} />
              </View>
            );
          })}

          {/* Complete day CTA */}
          {!loadingAI && (
            <View style={s.completeSection}>
              <TouchableOpacity
                style={[s.completeBtn, completing && { opacity: 0.6 }]}
                onPress={handleComplete}
                activeOpacity={0.82}
                disabled={completing || completed}
              >
                {completing ? (
                  <ActivityIndicator size="small" color="#1A1005" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#1A1005" />
                    <Text style={s.completeBtnText}>Complete Today's Reading</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      </SafeAreaView>

      {/* ── Completion overlay ── */}
      <Animated.View
        style={[s.completionOverlay, { opacity: completionAnim }]}
        pointerEvents={completed ? 'auto' : 'none'}
      >
        <LinearGradient
          colors={['#0C0806', '#120E06', '#0C0806']}
          style={StyleSheet.absoluteFillObject}
        />

        <SafeAreaView style={s.completionSafe} edges={['top', 'bottom']}>
          <View style={s.completionContent}>

            {/* Glow circle + particles */}
            <View style={s.glowWrap}>
              <Animated.View
                style={[
                  s.glowCircle,
                  {
                    opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.45] }),
                    transform: [{ scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }],
                  },
                ]}
              />

              {/* Particles */}
              {particleAnims.map((p, i) => (
                <Animated.View
                  key={i}
                  style={[
                    s.particle,
                    {
                      opacity: p.op,
                      transform: [
                        { translateX: p.x },
                        { translateY: p.y },
                        { scale: p.scale },
                      ],
                    },
                  ]}
                />
              ))}

              <Text style={s.completionIcon}>✦</Text>
            </View>

            <Text style={s.completionHeading}>Today's Journey{'\n'}Complete</Text>

            <Text style={s.completionVerse}>{completionVerse}</Text>

            {/* Streak pill */}
            {completionStreak > 0 && (
              <View style={s.streakBanner}>
                <Text style={s.streakFire}>🔥</Text>
                <View>
                  <Text style={s.streakText}>
                    {isNewRecord ? 'New Record · ' : ''}{completionStreak} Day Streak
                  </Text>
                  <Text style={s.streakSub}>+1 Day Added To Your Streak</Text>
                </View>
              </View>
            )}

            {/* Day progress */}
            <Text style={s.dayProgress}>
              Day {day} of {plan?.totalDays ?? '—'} Complete
            </Text>

            <View style={s.completionActions}>
              <TouchableOpacity
                style={s.completionPrimary}
                onPress={handleNextDay}
                activeOpacity={0.82}
              >
                <Text style={s.completionPrimaryText}>Return to Today</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.completionSecondary}
                onPress={handleHome}
                activeOpacity={0.75}
              >
                <Text style={s.completionSecondaryText}>Back to Home</Text>
              </TouchableOpacity>
            </View>

          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const GOLD  = '#C9A96B';
const WHITE = '#F0EDE6';

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(240,237,230,0.45)',
    letterSpacing: 0.3,
  },

  scroll: { paddingHorizontal: 24, paddingTop: 8 },

  passageRef: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: 'rgba(201,169,107,0.55)',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  readingTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: WHITE,
    lineHeight: 38,
    letterSpacing: -0.3,
  },

  sectionGap: { height: 32 },

  // ── AI loading ────────────────────────────────────────────────────────────

  aiLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  aiLoadingText: {
    fontSize: 14,
    color: 'rgba(240,237,230,0.35)',
    fontStyle: 'italic',
  },
  aiError: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(240,237,230,0.35)',
    fontStyle: 'italic',
    marginBottom: 32,
  },

  // ── Summary ───────────────────────────────────────────────────────────────

  summaryText: {
    fontSize: 17,
    lineHeight: 28,
    color: 'rgba(240,237,230,0.75)',
    fontStyle: 'italic',
    fontWeight: '400',
    marginBottom: 28,
  },
  summaryRule: {
    height: 1,
    backgroundColor: 'rgba(201,169,107,0.15)',
    marginBottom: 4,
  },

  // ── Expandable sections ───────────────────────────────────────────────────

  sectionBlock: {},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(240,237,230,0.40)',
    textTransform: 'uppercase',
  },
  sectionLabelOpen: { color: GOLD },

  sectionBody: {
    fontSize: 16,
    lineHeight: 27,
    color: 'rgba(240,237,230,0.75)',
    fontWeight: '400',
    paddingBottom: 16,
    letterSpacing: 0.1,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(240,237,230,0.08)',
  },

  // ── Complete CTA ──────────────────────────────────────────────────────────

  completeSection: { marginTop: 44 },
  completeBtn: {
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1005',
    letterSpacing: 0.2,
  },

  // ── Completion overlay ────────────────────────────────────────────────────

  completionOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99,
  },
  completionSafe: { flex: 1 },
  completionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  glowWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  glowCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: GOLD,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GOLD,
  },
  completionIcon: {
    fontSize: 36,
    color: GOLD,
  },

  completionHeading: {
    fontSize: 32,
    fontWeight: '700',
    color: WHITE,
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: -0.3,
    marginBottom: 28,
  },

  completionVerse: {
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(240,237,230,0.50)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 36,
    letterSpacing: 0.1,
  },

  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(201,169,107,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(201,169,107,0.22)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 16,
  },
  streakFire: { fontSize: 22 },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.2,
  },
  streakSub: {
    fontSize: 11,
    color: 'rgba(201,169,107,0.60)',
    fontWeight: '500',
    letterSpacing: 0.2,
    marginTop: 2,
  },
  dayProgress: {
    fontSize: 13,
    color: 'rgba(240,237,230,0.30)',
    fontWeight: '500',
    letterSpacing: 0.3,
    marginBottom: 40,
  },

  completionActions: { width: '100%', gap: 12 },
  completionPrimary: {
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  completionPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1005',
    letterSpacing: 0.2,
  },
  completionSecondary: {
    borderWidth: 1,
    borderColor: 'rgba(240,237,230,0.12)',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  completionSecondaryText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(240,237,230,0.40)',
    letterSpacing: 0.2,
  },
});
