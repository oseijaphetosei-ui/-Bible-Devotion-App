import React, {
  useRef, useState, useCallback, useEffect, memo, useMemo,
} from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Pressable,
  StatusBar, Animated, Easing, Platform,
  ImageBackground, Share as RNShare, Linking,
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
import type { AppTheme } from '../../theme';
import ProfileAvatar from '../../components/ProfileAvatar';
import {
  getActivePlan, getPlanById, getTodayReading,
  isTodayCompleted, planProgress,
} from '../../services/readingPlanService';
import type { ActivePlan as ReadingActivePlan } from '../../types/readingPlan';
import {
  checkPermissionStatus, requestPermission, rescheduleAll,
} from '../../services/notificationService';
import { patchPrefs, loadPrefs } from '../../services/notificationPreferences';
import { navigateToNotificationSettings } from '../../navigation/navigationRef';
import { loadOnboarding, PrimaryGoal } from '../../services/onboardingService';
import { getStreakData } from '../../services/devotionStreakService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const GOAL_TAGLINES: Record<PrimaryGoal, string> = {
  devotion: 'Your devotion time is waiting.',
  study:    'Ready to go deeper today?',
  prayer:   'Take a moment to pray.',
  reading:  'Continue your reading streak.',
};

// ─── Notification Reminder Banner ─────────────────────────────────────────────

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
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconWrap:  { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  primary:   { fontSize: 15, fontWeight: '600', lineHeight: 21, letterSpacing: 0.1, marginBottom: 3 },
  secondary: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
  cta:       { borderRadius: 30, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  ctaLabel:  { fontSize: 14, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 },
});

// ─── Hero Section ─────────────────────────────────────────────────────────────

const HeroSection = memo(function HeroSection({
  greeting, today, tagline, streak, total, t,
}: {
  greeting: string; today: string;
  tagline: string; streak: number; total: number; t: AppTheme;
}) {
  const isDark = t.statusBar === 'light-content';

  return (
    <LinearGradient
      colors={isDark
        ? ['rgba(19,22,38,1)', 'rgba(13,15,26,0.92)']
        : ['rgba(237,231,217,1)', 'rgba(237,231,217,0.82)']}
      style={hs.container}
    >
      {/* Avatar left + greeting right */}
      <View style={hs.greetRow}>
        <ProfileAvatar size={48} />
        <Text style={[hs.greeting, { color: t.text }]}>{greeting}</Text>
      </View>

      {/* Date + tagline */}
      <Text style={[hs.date, { color: t.textMuted }]}>{today}</Text>
      <Text style={[hs.tagline, { color: t.textMuted }]}>{tagline}</Text>

      {/* Stats row */}
      <View style={[hs.statsRow, { borderTopColor: t.divider }]}>
        <View style={hs.statItem}>
          <Text style={[hs.statValue, { color: t.text }]}>{streak}</Text>
          <Text style={[hs.statLabel, { color: t.textMuted }]}>Day Streak</Text>
        </View>
        <View style={[hs.statDivider, { backgroundColor: t.divider }]} />
        <View style={hs.statItem}>
          <Text style={[hs.statValue, { color: t.text }]}>{total}</Text>
          <Text style={[hs.statLabel, { color: t.textMuted }]}>Devotions</Text>
        </View>
        <View style={[hs.statDivider, { backgroundColor: t.divider }]} />
        <View style={hs.statItem}>
          <Ionicons
            name={streak > 0 ? 'flame' : 'sunny-outline'}
            size={22}
            color={streak > 0 ? t.gold : t.textMuted}
          />
          <Text style={[hs.statLabel, { color: t.textMuted }]}>
            {streak > 0 ? 'On Fire!' : 'Begin Today'}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
});

const hs = StyleSheet.create({
  container:  { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 0 },
  greetRow:   { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  greeting:   { fontSize: 28, fontWeight: '700', letterSpacing: -0.4, lineHeight: 34 },
  date:       { fontSize: 14, marginBottom: 4 },
  tagline:    { fontSize: 14, fontStyle: 'italic', lineHeight: 20, marginBottom: 28 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 20, paddingBottom: 20,
  },
  statItem:    { flex: 1, alignItems: 'center', gap: 4 },
  statValue:   { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  statLabel:   { fontSize: 10, fontWeight: '500', letterSpacing: 0.5 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 32, marginHorizontal: 4 },
});

// ─── Verse of the Day ─────────────────────────────────────────────────────────

const VerseCard = memo(function VerseCard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const verse      = getTodayVerseEntry();
  const [speaking, setSpeaking]     = useState(false);
  const speakingRef = useRef(false);
  const soundRef    = useRef<Audio.Sound | null>(null);
  const cardScale   = useRef(new Animated.Value(1)).current;

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

  const cardPressIn  = useCallback(() =>
    Animated.spring(cardScale, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 20 }).start(),
  [cardScale]);
  const cardPressOut = useCallback(() =>
    Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 20 }).start(),
  [cardScale]);

  return (
    <Pressable
      onPress={() => navigation.navigate('Verse')}
      onPressIn={cardPressIn}
      onPressOut={cardPressOut}
    >
    <Animated.View style={[vc.card, { transform: [{ scale: cardScale }] }]}>
      <ImageBackground
        source={require('../../assets/today-verse.jpg')}
        style={vc.bg}
        resizeMode="cover"
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(4,6,18,0.38)' }]} />
        <LinearGradient
          colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.50)', 'rgba(0,0,0,0.88)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={vc.content}>
          <View style={vc.meta}>
            <Text style={vc.metaLabel}>VERSE OF THE DAY</Text>
            <Text style={vc.metaRef}>{verse.label}</Text>
          </View>
          <Text style={vc.verseText}>
            {verse.fallbackText.replace(/^[""]+|[""]+$/g, '').trim()}
          </Text>
          <View style={vc.actions}>
            <TouchableOpacity style={vc.action} onPress={() => navigation.navigate('Verse')} activeOpacity={0.72}>
              <Ionicons name="book-outline" size={22} color="rgba(255,255,255,0.88)" />
              <Text style={vc.actionLabel}>Read</Text>
            </TouchableOpacity>
            <TouchableOpacity style={vc.action} onPress={handleInsights} activeOpacity={0.72}>
              <Ionicons name="sparkles-outline" size={22} color="rgba(255,255,255,0.88)" />
              <Text style={vc.actionLabel}>Insights</Text>
            </TouchableOpacity>
            <TouchableOpacity style={vc.action} onPress={handleListen} activeOpacity={0.72}>
              <Ionicons
                name={speaking ? 'stop-circle-outline' : 'headset-outline'}
                size={22}
                color={speaking ? '#C9A96B' : 'rgba(255,255,255,0.88)'}
              />
              <Text style={[vc.actionLabel, speaking && { color: '#C9A96B' }]}>
                {speaking ? 'Stop' : 'Listen'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={vc.action} onPress={handleShare} activeOpacity={0.72}>
              <Ionicons name="share-outline" size={22} color="rgba(255,255,255,0.88)" />
              <Text style={vc.actionLabel}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </Animated.View>
    </Pressable>
  );
});

const vc = StyleSheet.create({
  card: {
    borderRadius: 22, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28, shadowRadius: 18, elevation: 10,
  },
  bg:      { width: '100%', minHeight: 340 },
  content: { flex: 1, padding: 22, paddingTop: 24, paddingBottom: 18, justifyContent: 'space-between', minHeight: 340 },
  meta:    { gap: 4, marginBottom: 8 },
  metaLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.8, fontWeight: '700',
  },
  metaRef: { fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  verseText: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 21, lineHeight: 35,
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 0.1, paddingVertical: 12,
  },
  actions:     { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12 },
  action:      { alignItems: 'center', gap: 5 },
  actionLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500', letterSpacing: 0.2 },
});

// ─── Reading Plan Card ────────────────────────────────────────────────────────

const ReadingPlanCard = memo(function ReadingPlanCard() {
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
        style={[rp.card, { backgroundColor: t.card }]}
        onPress={() => navigation.navigate('PlanLibrary')}
        activeOpacity={0.82}
      >
        <View style={[rp.noPlanIconWrap, { backgroundColor: t.accentBg }]}>
          <Ionicons name="book-outline" size={26} color={t.accent} />
        </View>
        <Text style={[rp.noPlanTitle, { color: t.text }]}>Begin Your Reading Journey</Text>
        <Text style={[rp.noPlanSub, { color: t.textMuted }]}>
          Build a lasting daily Scripture habit with a guided reading plan.
        </Text>
        <View style={[rp.noPlanCta, { backgroundColor: t.accentBg, borderColor: t.accentBorder }]}>
          <Text style={[rp.noPlanCtaText, { color: t.accent }]}>Choose a Plan</Text>
          <Ionicons name="arrow-forward" size={14} color={t.accent} />
        </View>
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
      style={[rp.card, { backgroundColor: t.card }]}
      onPress={() => navigation.navigate('TodayJourney')}
      activeOpacity={0.85}
    >
      {/* Top row */}
      <View style={rp.cardTop}>
        <Text style={[rp.cardLabel, { color: t.textMuted }]}>CONTINUE TODAY'S JOURNEY</Text>
        {active.streak > 0 && (
          <View style={rp.streakBadge}>
            <Ionicons name="flame" size={12} color={t.gold} />
            <Text style={[rp.streakNum, { color: t.gold }]}>{active.streak}</Text>
          </View>
        )}
      </View>

      {/* Reading title */}
      <Text style={[rp.readingTitle, { color: t.text }]} numberOfLines={2}>
        {reading.title}
      </Text>

      {/* Meta info */}
      <View style={rp.metaRow}>
        <Text style={[rp.metaText, { color: t.textMuted }]}>{plan.title}</Text>
        <View style={[rp.metaDot, { backgroundColor: t.textMuted }]} />
        <Text style={[rp.metaText, { color: t.textMuted }]}>Day {active.currentDay} of {plan.totalDays}</Text>
        <View style={[rp.metaDot, { backgroundColor: t.textMuted }]} />
        <Text style={[rp.metaText, { color: t.textMuted }]}>{reading.estimatedMinutes} min</Text>
      </View>

      {/* Progress */}
      <View style={[rp.progressTrack, { backgroundColor: t.progressTrack }]}>
        <View style={[rp.progressFill, { width: `${pct}%` as any, backgroundColor: t.gold }]} />
      </View>
      <Text style={[rp.pctLabel, { color: t.textMuted }]}>{pct}% complete</Text>

      {/* CTA */}
      <View style={[rp.cta, { backgroundColor: t.accentBg, borderColor: t.accentBorder }]}>
        {done ? (
          <>
            <Ionicons name="checkmark-circle" size={15} color={t.accent} />
            <Text style={[rp.ctaText, { color: t.accent }]}>Today's Journey Complete</Text>
          </>
        ) : (
          <>
            <Text style={[rp.ctaText, { color: t.accent }]}>Continue Reading</Text>
            <Ionicons name="arrow-forward" size={14} color={t.accent} />
          </>
        )}
      </View>
    </TouchableOpacity>
  );
});

const rp = StyleSheet.create({
  card: {
    borderRadius: 18, padding: 18, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  // No plan
  noPlanIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  noPlanTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  noPlanSub:   { fontSize: 13, lineHeight: 20 },
  noPlanCta: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 9,
    marginTop: 4,
  },
  noPlanCtaText: { fontSize: 13, fontWeight: '700' },
  // Active plan
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  streakNum:   { fontSize: 12, fontWeight: '700' },
  readingTitle: { fontSize: 19, fontWeight: '700', letterSpacing: -0.2, lineHeight: 26 },
  metaRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, fontWeight: '500' },
  metaDot:  { width: 2, height: 2, borderRadius: 1, opacity: 0.4 },
  progressTrack: { height: 3, borderRadius: 2 },
  progressFill:  { height: 3, borderRadius: 2 },
  pctLabel:  { fontSize: 11, fontWeight: '500', marginTop: -4 },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, borderRadius: 12, borderWidth: 1,
    paddingVertical: 12, marginTop: 4,
  },
  ctaText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.1 },
});

// ─── Today's Practice Card ────────────────────────────────────────────────────

const TodayCard = memo(function TodayCard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useTheme();
  const [goals, setGoals] = useState<Goal[]>([]);

  useFocusEffect(useCallback(() => {
    loadGoals().then(setGoals).catch(() => {});
  }, []));

  const completedGoals = goals.filter(isCompletedToday).length;
  const totalGoals     = goals.length;
  const goalPct        = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  return (
    <View style={[tc.card, { backgroundColor: t.card }]}>
      <Text style={[tc.label, { color: t.textMuted }]}>TODAY'S PRACTICE</Text>

      {/* Daily Devotion */}
      <TouchableOpacity
        style={tc.row}
        onPress={() => navigation.navigate('Devotion', undefined)}
        activeOpacity={0.75}
      >
        <View style={[tc.iconWrap, { backgroundColor: t.goldBg }]}>
          <Ionicons name="sunny-outline" size={17} color={t.gold} />
        </View>
        <View style={tc.rowBody}>
          <Text style={[tc.rowTitle, { color: t.text }]}>Daily Devotion</Text>
          <Text style={[tc.rowSub, { color: t.textMuted }]}>Nourish your soul with Scripture</Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={t.textMuted} />
      </TouchableOpacity>

      <View style={[tc.divider, { backgroundColor: t.divider }]} />

      {/* Prayer Journal */}
      <TouchableOpacity
        style={tc.row}
        onPress={() => navigation.navigate('PrayerJournal')}
        activeOpacity={0.75}
      >
        <View style={[tc.iconWrap, { backgroundColor: '#C47B8A22' }]}>
          <Ionicons name="heart-outline" size={17} color="#C47B8A" />
        </View>
        <View style={tc.rowBody}>
          <Text style={[tc.rowTitle, { color: t.text }]}>Prayer Journal</Text>
          <Text style={[tc.rowSub, { color: t.textMuted }]}>Talk to God, track His answers</Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={t.textMuted} />
      </TouchableOpacity>

      <View style={[tc.divider, { backgroundColor: t.divider }]} />

      {/* Spiritual Goals */}
      <TouchableOpacity
        style={tc.row}
        onPress={() => navigation.navigate('Goals')}
        activeOpacity={0.75}
      >
        <View style={[tc.iconWrap, { backgroundColor: '#6E8B7422' }]}>
          <Ionicons name="flag-outline" size={17} color="#6E8B74" />
        </View>
        <View style={tc.rowBody}>
          <Text style={[tc.rowTitle, { color: t.text }]}>Spiritual Goals</Text>
          {totalGoals > 0 ? (
            <>
              <View style={[tc.progressTrack, { backgroundColor: t.progressTrack }]}>
                <View style={[tc.progressFill, {
                  width: `${goalPct}%` as any,
                  backgroundColor: '#6E8B74',
                }]} />
              </View>
              <Text style={[tc.rowSub, { color: t.textMuted }]}>
                {completedGoals} of {totalGoals} done today
              </Text>
            </>
          ) : (
            <Text style={[tc.rowSub, { color: t.textMuted }]}>Set your daily spiritual goals</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={14} color={t.textMuted} />
      </TouchableOpacity>
    </View>
  );
});

const tc = StyleSheet.create({
  card: {
    borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  label: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.8,
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 14, gap: 14,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  rowBody:  { flex: 1, gap: 4 },
  rowTitle: { fontSize: 15, fontWeight: '600', letterSpacing: 0.1 },
  rowSub:   { fontSize: 12, lineHeight: 17 },
  divider:  { height: StyleSheet.hairlineWidth, marginLeft: 68 },
  progressTrack: { height: 2, borderRadius: 1, marginTop: 5, marginBottom: 2 },
  progressFill:  { height: 2, borderRadius: 1 },
});

// ─── Quick Actions ────────────────────────────────────────────────────────────

const QuickActions = memo(function QuickActions() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useTheme();
  const verse = getTodayVerseEntry();

  const actions = [
    {
      icon: 'book-outline'           as const,
      label: 'Bible',
      color: '#5B6EAE',
      bg:    '#5B6EAE22',
      onPress: () => (navigation as any).navigate('MainTabs', { screen: 'BibleTab' }),
    },
    {
      icon: 'images-outline'         as const,
      label: 'Stories',
      color: '#C9804A',
      bg:    '#C9804A22',
      onPress: () => navigation.navigate('Stories'),
    },
    {
      icon: 'sparkles-outline'       as const,
      label: 'AI Insights',
      color: t.accent,
      bg:    t.accentBg,
      onPress: () => navigation.navigate('ScriptureInsights', {
        reference:   verse.label,
        contextType: 'verse',
        context:     verse.fallbackText,
      }),
    },
    {
      icon: 'musical-notes-outline'  as const,
      label: 'Hymnal',
      color: '#B07A3A',
      bg:    '#B07A3A22',
      onPress: () => navigation.navigate('Hymns'),
    },
  ];

  return (
    <View>
      <Text style={[qa.label, { color: t.textMuted }]}>EXPLORE</Text>
      <View style={qa.grid}>
        {actions.map(a => (
          <TouchableOpacity
            key={a.label}
            style={[qa.item, { backgroundColor: t.card }]}
            onPress={a.onPress}
            activeOpacity={0.78}
          >
            <View style={[qa.iconWrap, { backgroundColor: a.bg }]}>
              <Ionicons name={a.icon} size={22} color={a.color} />
            </View>
            <Text style={[qa.itemLabel, { color: t.text }]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

const qa = StyleSheet.create({
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 12 },
  grid:  { flexDirection: 'row', gap: 10 },
  item: {
    flex: 1, alignItems: 'center', gap: 10,
    borderRadius: 18, paddingVertical: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  iconWrap:  { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.1 },
});

// ─── Home Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const t = useTheme();

  const greeting = useMemo(() => getGreeting(), []);
  const today    = useMemo(() => new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  }), []);

  const [streak,      setStreak]      = useState(0);
  const [total,       setTotal]       = useState(0);
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal | null>(null);

  useFocusEffect(useCallback(() => {
    getStreakData().then(d => { setStreak(d.streak); setTotal(d.total); });
    loadOnboarding().then(d => setPrimaryGoal(d.primaryGoal)).catch(() => {});
  }, []));

  // Content entrance animation
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  {
        toValue: 1, duration: 640, delay: 120,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 640, delay: 120,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const tagline = primaryGoal ? GOAL_TAGLINES[primaryGoal] : 'Walk faithfully today.';

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ── */}
          <HeroSection
            greeting={greeting}
            today={today}
            tagline={tagline}
            streak={streak}
            total={total}
            t={t}
          />

          {/* ── Content (animated entrance) ── */}
          <Animated.View
            style={[s.contentInner, {
              opacity:   fadeAnim,
              transform: [{ translateY: slideAnim }],
            }]}
          >
            {/* Reading Plan */}
            <ReadingPlanCard />

            {/* Notification reminder */}
            <NotificationReminderBanner />

            {/* Verse of the Day */}
            <VerseCard />

            {/* Today's Practice */}
            <TodayCard />

            {/* Explore */}
            <QuickActions />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:         { flex: 1 },
  scroll:       { flex: 1 },
  content:      { paddingBottom: 120 },
  contentInner: { paddingHorizontal: 18, paddingTop: 22, gap: 20 },
});
