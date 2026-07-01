import React, { useRef, useState, useCallback, useEffect, memo, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, Animated, Easing, Dimensions, Platform,
  ImageBackground, Image, Share as RNShare, Linking,
  LayoutAnimation, UIManager,
} from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTodayVerseEntry } from '../../services/verseService';
import { speakText } from '../../services/ttsService';
import { loadGoals, isCompletedToday } from '../../services/goalsService';
import { Goal } from '../../types/goal';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../theme';
import ProfileAvatar from '../../components/ProfileAvatar';
import {
  getActivePlan, getPlanById, getTodayReading,
  isTodayCompleted, planProgress, passageLabel,
} from '../../services/readingPlanService';
import type { ActivePlan as ReadingActivePlan } from '../../types/readingPlan';
import {
  checkPermissionStatus, requestPermission, rescheduleAll,
} from '../../services/notificationService';
import { patchPrefs, loadPrefs } from '../../services/notificationPreferences';
import { navigateToNotificationSettings } from '../../navigation/navigationRef';
import { loadOnboarding, PrimaryGoal } from '../../services/onboardingService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sanitizeForSpeech(raw: string): string {
  return raw
    .replace(/–/g, ' to ').replace(/—/g, ', ')
    .replace(/\b(\d+):(\d+)\b/g, 'chapter $1 verse $2')
    .replace(/\s*\(([^)]+)\)\s*/g, ', $1, ')
    .replace(/[""]/g, '').replace(/['']/g, "'")
    .replace(/…|\.\.\./g, ', ').replace(/;/g, ',')
    .replace(/(\d+)-(\d+)/g, '$1 to $2')
    .replace(/,\s*,/g, ',').replace(/,\s*([.!?])/g, '$1')
    .replace(/\s+/g, ' ').trim();
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

// ─── Notification Reminder Banner ────────────────────────────────────────────

async function shouldShowBanner(): Promise<boolean> {
  try {
    const [prefs, permStatus] = await Promise.all([loadPrefs(), checkPermissionStatus()]);
    if (prefs.masterEnabled && permStatus === 'granted') return false;
    return true;
  } catch {
    return false;
  }
}

const NotificationReminderBanner = memo(function NotificationReminderBanner() {
  const t = useTheme();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  const show = useCallback(() => {
    setVisible(true);
    Animated.parallel([
      Animated.spring(opacity,    { toValue: 1, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
    ]).start();
  }, [opacity, translateY]);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -6, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      LayoutAnimation.configureNext({
        duration: 260,
        update: { type: LayoutAnimation.Types.easeInEaseOut },
        delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      });
      setVisible(false);
    });
  }, [opacity, translateY]);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    shouldShowBanner().then(should => {
      if (!cancelled) {
        if (should) show();
        else if (visible) hide();
      }
    });
    return () => { cancelled = true; };
  }, [show, hide, visible]));

  const handleEnable = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const permStatus = await checkPermissionStatus();
      if (permStatus === 'denied') {
        Linking.openSettings();
      } else if (permStatus === 'undetermined') {
        const granted = await requestPermission();
        if (granted) {
          await patchPrefs({ masterEnabled: true, permissionPromptShown: true });
          await rescheduleAll();
          hide();
        }
      } else {
        hide();
        navigateToNotificationSettings();
      }
    } finally {
      setLoading(false);
    }
  }, [loading, hide]);

  if (!visible) return null;

  return (
    <Animated.View style={[nb.container, { backgroundColor: t.card, opacity, transform: [{ translateY }] }]}>
      <View style={nb.headerRow}>
        <View style={[nb.iconWrap, { backgroundColor: t.accentBg }]}>
          <Ionicons name="notifications-outline" size={18} color={t.accent} />
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={hide}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
          accessibilityLabel="Dismiss"
        >
          <Ionicons name="close" size={16} color={t.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={[nb.primary, { color: t.text }]}>Stay in step with God's Word.</Text>
      <Text style={[nb.secondary, { color: t.textMuted }]}>Enable gentle daily reminders.</Text>

      <TouchableOpacity
        style={[nb.cta, { backgroundColor: t.accent }]}
        onPress={handleEnable}
        activeOpacity={0.82}
        disabled={loading}
      >
        <Text style={nb.ctaLabel}>{loading ? 'Enabling…' : 'Enable Notifications'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

const nb = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconWrap: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  primary:  { fontSize: 15, fontWeight: '600', lineHeight: 21, letterSpacing: 0.1, marginBottom: 3 },
  secondary: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
  cta: {
    borderRadius: 30,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 },
});

// ─── Today's Verse Card ───────────────────────────────────────────────────────

const VerseCard = memo(function VerseCard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const verse = getTodayVerseEntry();
  const [speaking, setSpeaking] = useState(false);
  const speakingRef = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
      speakingRef.current = false;
    };
  }, []);

  const handleListen = useCallback(async () => {
    if (speakingRef.current) {
      await soundRef.current?.stopAsync().catch(() => {});
      await soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
      speakingRef.current = false;
      setSpeaking(false);
      return;
    }
    const text = `${sanitizeForSpeech(verse.label)}. ${sanitizeForSpeech(verse.fallbackText)}`;
    speakingRef.current = true;
    setSpeaking(true);
    try {
      const sound = await speakText(text, `today-verse-${verse.label}`);
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          speakingRef.current = false;
          setSpeaking(false);
          soundRef.current?.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      });
    } catch {
      speakingRef.current = false;
      setSpeaking(false);
    }
  }, [verse]);

  const handleShare = useCallback(async () => {
    try {
      await RNShare.share({ message: `"${verse.fallbackText}"\n— ${verse.label}` });
    } catch { /* cancelled */ }
  }, [verse]);

  const handleInsights = useCallback(() => {
    navigation.navigate('ScriptureInsights', {
      reference: verse.label,
      contextType: 'verse',
      context: verse.fallbackText,
    });
  }, [navigation, verse]);

  return (
    <View style={s.verseCard}>
      <ImageBackground
        source={require('../../assets/today-verse.jpg')}
        style={s.verseCardBg}
        resizeMode="cover"
      >
        {/* Base dark veil for contrast */}
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(4,6,18,0.42)' }]} />
        {/* Gradient: light top → heavy bottom so text is always readable */}
        <LinearGradient
          colors={['rgba(0,0,0,0.10)', 'rgba(0,0,0,0.52)', 'rgba(0,0,0,0.86)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={s.verseCardContent}>
          {/* Meta: label + reference */}
          <View style={s.verseMeta}>
            <Text style={s.verseLabel}>Verse of the Day</Text>
            <Text style={s.verseRef}>{verse.label}</Text>
          </View>

          {/* Verse text — large, immersive */}
          <Text style={s.verseText}>{verse.fallbackText.replace(/^[""]+|[""]+$/g, '').trim()}</Text>

          {/* Action bar */}
          <View style={s.verseActions}>
            <TouchableOpacity style={s.verseAction} onPress={() => navigation.navigate('Verse')} activeOpacity={0.72}>
              <Ionicons name="book-outline" size={24} color="rgba(255,255,255,0.88)" />
              <Text style={s.verseActionLabel}>Read</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.verseAction} onPress={handleInsights} activeOpacity={0.72}>
              <Ionicons name="sparkles-outline" size={24} color="rgba(255,255,255,0.88)" />
              <Text style={s.verseActionLabel}>AI Insights</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.verseAction} onPress={handleListen} activeOpacity={0.72}>
              <Ionicons
                name={speaking ? 'stop-circle-outline' : 'headset-outline'}
                size={24}
                color={speaking ? '#C9A96B' : 'rgba(255,255,255,0.88)'}
              />
              <Text style={[s.verseActionLabel, speaking && { color: '#C9A96B' }]}>
                {speaking ? 'Stop' : 'Listen'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.verseAction} onPress={handleShare} activeOpacity={0.72}>
              <Ionicons name="share-outline" size={24} color="rgba(255,255,255,0.88)" />
              <Text style={s.verseActionLabel}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
});

// ─── Spiritual Goals Row ──────────────────────────────────────────────────────

const GoalsCard = memo(function GoalsCard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useTheme();
  const [goals, setGoals] = useState<Goal[]>([]);

  useFocusEffect(useCallback(() => { loadGoals().then(setGoals).catch(() => {}); }, []));

  const completed = goals.filter(isCompletedToday).length;
  const pct = goals.length > 0 ? (completed / goals.length) * 100 : 0;

  return (
    <TouchableOpacity
      style={s.listRow}
      onPress={() => navigation.navigate('Goals')}
      activeOpacity={0.8}
    >
      <View style={[s.listRowIconWrap, { backgroundColor: t.goldBg }]}>
        <Ionicons name="flag-outline" size={18} color={t.gold} />
      </View>
      <View style={s.listRowBody}>
        <Text style={[s.listRowTitle, { color: t.text }]}>Spiritual Goals</Text>
        {goals.length > 0 ? (
          <>
            <View style={[s.goalsProgressTrack, { backgroundColor: t.progressTrack }]}>
              <View style={[s.goalsProgressFill, { width: `${pct}%` as any, backgroundColor: t.gold }]} />
            </View>
            <Text style={[s.listRowSub, { color: t.textMuted }]}>
              {completed} of {goals.length} completed today
            </Text>
          </>
        ) : (
          <Text style={[s.listRowSub, { color: t.textMuted }]}>Set your daily spiritual goals</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={14} color={t.textMuted} />
    </TouchableOpacity>
  );
});

// ─── Reading Plan Banner ──────────────────────────────────────────────────────

const ReadingPlanBanner = memo(function ReadingPlanBanner() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useTheme();
  const [active, setActive] = useState<ReadingActivePlan | null | undefined>(undefined);

  useFocusEffect(useCallback(() => {
    getActivePlan().then(setActive);
  }, []));

  if (active === undefined) return null;

  if (!active) {
    return (
      <TouchableOpacity
        style={[rp.noPlanBanner, { borderColor: t.goldBorder, backgroundColor: t.goldBg }]}
        onPress={() => navigation.navigate('PlanLibrary')}
        activeOpacity={0.8}
      >
        <View style={rp.noPlanLeft}>
          <Text style={rp.noPlanIcon}>📖</Text>
          <View>
            <Text style={[rp.noPlanTitle, { color: t.text }]}>Start a Reading Plan</Text>
            <Text style={[rp.noPlanSub, { color: t.textMuted }]}>Build a lasting daily Scripture habit</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={t.gold} />
      </TouchableOpacity>
    );
  }

  const plan    = getPlanById(active.planId);
  const reading = getTodayReading(active);
  const done    = isTodayCompleted(active);
  const pct     = Math.round(planProgress(active) * 100);

  if (!plan || !reading) return null;

  return (
    <TouchableOpacity
      style={rp.banner}
      onPress={() => navigation.navigate('TodayJourney')}
      activeOpacity={0.85}
    >
      {/* Thin gold left accent line */}
      <View style={rp.accentLine} />

      <View style={rp.bannerBody}>
        <View style={rp.bannerTop}>
          <Text style={rp.bannerLabel}>DAILY READING</Text>
          {active.streak > 0 && (
            <View style={rp.streakPill}>
              <Text style={rp.streakFire}>🔥</Text>
              <Text style={rp.streakNum}>{active.streak}</Text>
            </View>
          )}
        </View>

        <Text style={[rp.readingTitle, { color: t.text }]} numberOfLines={1}>
          {reading.title}
        </Text>

        <View style={rp.metaRow}>
          <Text style={[rp.metaText, { color: t.textMuted }]}>
            Day {active.currentDay} of {plan.totalDays}
          </Text>
          <View style={[rp.metaDot, { backgroundColor: t.textMuted }]} />
          <Text style={[rp.metaText, { color: t.textMuted }]}>
            {reading.estimatedMinutes} min
          </Text>
          <View style={[rp.metaDot, { backgroundColor: t.textMuted }]} />
          <Text style={[rp.metaText, { color: t.textMuted }]}>{pct}% done</Text>
        </View>

        {/* Progress track */}
        <View style={[rp.progressTrack, { backgroundColor: t.progressTrack }]}>
          <View style={[rp.progressFill, { width: `${pct}%`, backgroundColor: t.gold }]} />
        </View>

        {done ? (
          <View style={rp.completedRow}>
            <Ionicons name="checkmark-circle" size={14} color={t.gold} />
            <Text style={[rp.ctaLabel, { color: t.gold }]}>Today's Journey Complete</Text>
          </View>
        ) : (
          <Text style={[rp.ctaLabel, { color: t.gold }]}>Continue Today's Journey →</Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

const rp = StyleSheet.create({
  // No active plan
  noPlanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  noPlanLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  noPlanIcon:  { fontSize: 22 },
  noPlanTitle: { fontSize: 15, fontWeight: '700', letterSpacing: 0.1 },
  noPlanSub:   { fontSize: 12, marginTop: 2 },

  // Active plan banner
  banner: {
    flexDirection: 'row',
    marginBottom: 16,
    overflow: 'hidden',
  },
  accentLine: {
    width: 2,
    backgroundColor: '#C9A96B',
    borderRadius: 2,
    marginRight: 14,
    alignSelf: 'stretch',
  },
  bannerBody:  { flex: 1 },
  bannerTop:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  bannerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#C9A96B',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  streakFire: { fontSize: 12 },
  streakNum:  { fontSize: 12, fontWeight: '700', color: '#C9A96B' },

  readingTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2, marginBottom: 6 },
  metaRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  metaText:     { fontSize: 12, fontWeight: '500' },
  metaDot:      { width: 2, height: 2, borderRadius: 1, opacity: 0.4 },

  progressTrack: { height: 2, borderRadius: 1, marginBottom: 10 },
  progressFill:  { height: 2, borderRadius: 1 },

  ctaLabel: { fontSize: 13, fontWeight: '600', letterSpacing: 0.1 },
  completedRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});

// ─── HomeScreen ───────────────────────────────────────────────────────────────

const GOAL_TAGLINES: Record<PrimaryGoal, string> = {
  devotion: 'Your devotion time is waiting.',
  study:    'Ready to go deeper today?',
  prayer:   'Take a moment to pray.',
  reading:  'Continue your reading streak.',
};

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useTheme();

  const greeting = useMemo(() => getGreeting(), []);
  const today    = useMemo(() => new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  }), []);

  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal | null>(null);

  useFocusEffect(useCallback(() => {
    loadOnboarding().then(d => setPrimaryGoal(d.primaryGoal)).catch(() => {});
  }, []));

  // Entrance animation for quick-nav cards (still scroll-triggered)
  const cardOpacity    = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(32)).current;
  const hasAnimated    = useRef(false);
  const cardSectionRef = useRef<View>(null);

  const triggerCardAnim = useCallback(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    Animated.parallel([
      Animated.timing(cardOpacity,    { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(cardTranslateY, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const checkVisibility = useCallback(() => {
    if (hasAnimated.current || !cardSectionRef.current) return;
    const screenH = Dimensions.get('window').height;
    cardSectionRef.current.measure((_x, _y, _w, height, _px, pageY) => {
      if (height <= 0) return;
      const visible = Math.max(0, Math.min(pageY + height, screenH) - Math.max(pageY, 0));
      if (visible / height >= 0.35) triggerCardAnim();
    });
  }, [triggerCardAnim]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        {/* ── Header ── */}
        <View style={s.header}>
          <ProfileAvatar />
          <View style={s.greetingBlock}>
            <Text style={[s.greeting, { color: t.text }]}>{greeting}</Text>
            <Text style={[s.date, { color: t.textSub }]}>{today}</Text>
            {primaryGoal && (
              <Text style={[s.goalTagline, { color: t.accent }]}>
                {GOAL_TAGLINES[primaryGoal]}
              </Text>
            )}
          </View>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          onScroll={checkVisibility}
          scrollEventThrottle={16}
        >
          {/* ── Reading Plan CTA ── */}
          <ReadingPlanBanner />

          {/* ── Notification reminder — only shown when notifications are off ── */}
          <NotificationReminderBanner />

          {/* ── Verse hero — the focal point of the screen ── */}
          <VerseCard />

          {/* ── Today section ── */}
          <Text style={[s.sectionLabel, { color: t.textMuted }]}>TODAY</Text>

          {/* Daily Devotion — text-forward row */}
          <TouchableOpacity
            style={s.listRow}
            onPress={() => navigation.navigate('Devotion', undefined)}
            activeOpacity={0.8}
          >
            <View style={[s.listRowIconWrap, { backgroundColor: t.goldBg }]}>
              <Ionicons name="flame-outline" size={18} color={t.gold} />
            </View>
            <View style={s.listRowBody}>
              <Text style={[s.listRowTitle, { color: t.text }]}>Daily Devotion</Text>
              <Text style={[s.listRowSub, { color: t.textMuted }]}>Finding Peace in God's Presence · 2–5 min</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={t.textMuted} />
          </TouchableOpacity>

          <View style={[s.rowDivider, { backgroundColor: t.divider }]} />

          {/* Spiritual Goals */}
          <GoalsCard />

          {/* ── Explore section ── */}
          <Text style={[s.sectionLabel, { color: t.textMuted, marginTop: 28 }]}>EXPLORE</Text>

          <View ref={cardSectionRef} onLayout={checkVisibility}>
            <Animated.View
              style={[
                s.quickNavRow,
                { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] },
              ]}
            >
              <TouchableOpacity
                style={s.quickNavItem}
                onPress={() => navigation.navigate('Stories')}
                activeOpacity={0.88}
              >
                <Image source={require('../../assets/group-story-by-fire.jpg')} style={s.quickNavImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.72)']}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={s.quickNavLabel}>Stories</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.quickNavItem}
                onPress={() => {
                  const v = getTodayVerseEntry();
                  navigation.navigate('ScriptureChat', {
                    reference: v.label,
                    contextType: 'verse',
                    context: `${v.label}\n\n"${v.fallbackText}"`,
                  });
                }}
                activeOpacity={0.88}
              >
                <Image
                  source={require('../../assets/talk-to-scripture.jpg')}
                  style={s.quickNavImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.72)']}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={s.quickNavLabel}>Talk to Scripture</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:    { flex: 1 },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 120 },

  // Header
  header:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18, gap: 12 },
  greetingBlock: { flex: 1 },
  greeting:      { fontSize: 21, fontWeight: '700', letterSpacing: -0.3 },
  date:          { fontSize: 13, marginTop: 2 },
  goalTagline:   { fontSize: 12, fontWeight: '500', marginTop: 4, letterSpacing: 0.1 },

  // Section label
  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.6,
    marginBottom: 12, marginTop: 0,
  },

  // ── Today's Verse card ──
  verseCard: {
    borderRadius: 22, overflow: 'hidden', marginBottom: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32, shadowRadius: 18, elevation: 10,
  },
  verseCardBg: { width: '100%', minHeight: 380 },
  verseCardContent: {
    flex: 1, padding: 22, paddingTop: 26, paddingBottom: 18,
    justifyContent: 'space-between',
    minHeight: 380,
  },
  verseMeta: { gap: 4, marginBottom: 8 },
  verseLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.2, fontWeight: '600',
    textTransform: 'uppercase',
  },
  verseRef: {
    fontSize: 19, fontWeight: '700', color: '#fff',
    letterSpacing: 0.2,
  },
  verseText: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 23, lineHeight: 38,
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 0.1,
    paddingVertical: 14,
  },
  verseActions: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingTop: 14, marginTop: 4,
  },
  verseAction:      { alignItems: 'center', gap: 5 },
  verseActionLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.68)',
    fontWeight: '500', letterSpacing: 0.2,
  },

  // ── List rows (Devotion, Goals) ──
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 13,
  },
  listRowIconWrap: {
    width: 36, height: 36, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  listRowBody:  { flex: 1, gap: 3 },
  listRowTitle: { fontSize: 15, fontWeight: '600', letterSpacing: 0.1 },
  listRowSub:   { fontSize: 12, lineHeight: 17 },

  rowDivider: { height: StyleSheet.hairlineWidth, marginLeft: 49 },

  // Goals progress bar
  goalsProgressTrack: { height: 2, borderRadius: 1, marginTop: 6, marginBottom: 2 },
  goalsProgressFill:  { height: 2, borderRadius: 1 },

  // ── Quick nav ──
  quickNavRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  quickNavItem: {
    flex: 1, borderRadius: 16,
    overflow: 'hidden', height: 110,
    justifyContent: 'flex-end',
  },
  quickNavImage: { ...StyleSheet.absoluteFillObject as any, width: '100%', height: '100%' },
  quickNavLabel: {
    fontSize: 13, fontWeight: '700',
    color: '#fff', padding: 12,
    letterSpacing: 0.1,
  },
});
