import React, {
  useRef, useState, useCallback, useEffect, memo, useMemo,
} from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Pressable,
  StatusBar, Animated, Easing, Platform,
  Share as RNShare, Linking,
  LayoutAnimation, UIManager, Dimensions,
} from 'react-native';
import { Audio } from 'expo-av';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../theme';
import type { AppTheme } from '../../theme';
import ProfileAvatar from '../../components/ProfileAvatar';
import { tabBarScrollSignal } from '../../components/CustomBottomBar';
import { RootStackParamList } from '../../types/navigation';
import { getTodayVerseEntry } from '../../services/verseService';
import { speakText } from '../../services/ttsService';
import { getStreakData } from '../../services/devotionStreakService';
import { getJourneySnapshot } from '../../services/studyService';
import type { JourneySnapshot } from '../../types/study';
import { getPrayerStats } from '../../services/prayerService';
import type { PrayerStats } from '../../types/prayer';
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

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = Math.round(SCREEN_W * 0.72);
const PARALLAX_MAX = 105;

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

// ─── Cinematic Hero ───────────────────────────────────────────────────────────

const CinematicHero = memo(function CinematicHero({
  scrollY, greeting, tagline, streak, firstName, topInset,
}: {
  scrollY: Animated.Value;
  greeting: string;
  tagline: string;
  streak: number;
  firstName: string;
  topInset: number;
}) {
  const ringOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(ringOpacity, {
      toValue: 1, duration: 800, delay: 400,
      easing: Easing.out(Easing.quad), useNativeDriver: true,
    }).start();
  }, [ringOpacity]);

  const heroParallax = useMemo(() =>
    scrollY.interpolate({ inputRange: [0, 300], outputRange: [0, -PARALLAX_MAX], extrapolate: 'clamp' }),
  [scrollY]);

  const todayLabel = useMemo(() =>
    new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase(),
  []);

  const ringBorderColor = streak > 0 ? 'rgba(201,169,107,0.75)' : 'rgba(255,255,255,0.22)';

  return (
    <View style={{ height: HERO_H, overflow: 'hidden' }}>
      {/* Parallax image layer */}
      <Animated.View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: HERO_H + PARALLAX_MAX,
        transform: [{ translateY: heroParallax }],
      }}>
        <ExpoImage
          source={require('../../assets/open-bible-in-the-morning.jpg')}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={350}
          cachePolicy="memory-disk"
        />
      </Animated.View>

      {/* Cinematic scrim */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.74)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Content */}
      <View style={[ch.content, { paddingTop: topInset + 10 }]}>
        {/* Top row */}
        <View style={ch.topRow}>
          <ProfileAvatar size={44} />
          <TouchableOpacity
            onPress={navigateToNotificationSettings}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Bottom row: greeting + streak ring */}
        <View style={ch.bottomRow}>
          {/* Greeting block */}
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={ch.eyebrow}>{todayLabel}</Text>
            <Text style={ch.greetLine1}>{greeting},</Text>
            <Text style={ch.greetLine2}>{firstName || 'Friend'}</Text>
            <Text style={ch.tagline}>{tagline}</Text>
          </View>

          {/* Streak ring */}
          <View style={ch.ringWrap}>
            <Animated.View style={[ch.ring, { borderColor: ringBorderColor, opacity: ringOpacity }]}>
              <Ionicons
                name={streak > 0 ? 'flame' : 'calendar-outline'}
                size={18}
                color={streak > 0 ? '#C9A96B' : 'rgba(255,255,255,0.5)'}
              />
            </Animated.View>
            <Text style={ch.ringCount}>{streak}</Text>
            <Text style={ch.ringLabel}>day streak</Text>
          </View>
        </View>
      </View>
    </View>
  );
});

const ch = StyleSheet.create({
  content: {
    flex: 1, paddingHorizontal: 22, paddingBottom: 28,
  },
  topRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  bottomRow: {
    flexDirection: 'row', alignItems: 'flex-end',
  },
  eyebrow: {
    fontSize: 12, fontWeight: '500', letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.55)', marginBottom: 8,
  },
  greetLine1: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 32, fontWeight: '400', lineHeight: 40,
    letterSpacing: -0.3, color: 'rgba(255,255,255,0.95)',
  },
  greetLine2: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 32, fontWeight: '400', lineHeight: 40,
    letterSpacing: -0.3, color: 'rgba(255,255,255,0.95)',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 13, fontStyle: 'italic',
    color: 'rgba(255,255,255,0.5)',
  },
  ringWrap: { alignItems: 'center', paddingBottom: 2 },
  ring: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  ringCount: {
    fontSize: 14, fontWeight: '700', color: '#C9A96B', letterSpacing: -0.3,
  },
  ringLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 1,
  },
});

// ─── Verse of the Day ─────────────────────────────────────────────────────────

const VerseOfDayCard = memo(function VerseOfDayCard() {
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
    Animated.spring(cardScale, { toValue: 0.975, useNativeDriver: true, tension: 300, friction: 20 }).start(),
  [cardScale]);
  const cardPressOut = useCallback(() =>
    Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 20 }).start(),
  [cardScale]);

  const tagPills = (verse.tags ?? []).slice(0, 2).join(' · ');
  const verseText = verse.fallbackText.replace(/^[""]+|[""]+$/g, '').trim();

  return (
    <Pressable onPress={() => navigation.navigate('Verse')} onPressIn={cardPressIn} onPressOut={cardPressOut}>
      <Animated.View style={[vd.card, { transform: [{ scale: cardScale }] }]}>
        <View style={vd.imageBg}>
          <ExpoImage source={verse.image} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={350} cachePolicy="memory-disk" />
          <BlurView intensity={48} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(4,6,18,0.42)' }]} />

          <View style={vd.content}>
            {/* Tags row */}
            <View style={vd.tagsRow}>
              {tagPills ? (
                <View style={vd.tagPill}>
                  <Text style={vd.tagText}>{tagPills}</Text>
                </View>
              ) : null}
              <View style={{ flex: 1 }} />
              <Text style={vd.dagger}>†</Text>
            </View>

            {/* Verse block */}
            <View style={vd.verseBlock}>
              <Text style={vd.reference}>{verse.label}</Text>
              <Text style={vd.verseText} numberOfLines={6}>{verseText}</Text>
            </View>

            {/* Action pill bar */}
            <View style={vd.actionBarWrap}>
              <BlurView intensity={24} tint="dark" style={vd.actionBar}>
                <TouchableOpacity style={vd.action} onPress={() => navigation.navigate('Verse')} activeOpacity={0.72}>
                  <Ionicons name="book-outline" size={19} color="rgba(255,255,255,0.82)" />
                  <Text style={vd.actionLabel}>Read</Text>
                </TouchableOpacity>
                <View style={vd.actionDivider} />
                <TouchableOpacity style={vd.action} onPress={handleListen} activeOpacity={0.72}>
                  <Ionicons
                    name={speaking ? 'stop-circle-outline' : 'headset-outline'}
                    size={19}
                    color={speaking ? '#C9A96B' : 'rgba(255,255,255,0.82)'}
                  />
                  <Text style={[vd.actionLabel, speaking && { color: '#C9A96B' }]}>
                    {speaking ? 'Stop' : 'Listen'}
                  </Text>
                </TouchableOpacity>
                <View style={vd.actionDivider} />
                <TouchableOpacity style={vd.action} onPress={handleShare} activeOpacity={0.72}>
                  <Ionicons name="share-outline" size={19} color="rgba(255,255,255,0.82)" />
                  <Text style={vd.actionLabel}>Share</Text>
                </TouchableOpacity>
              </BlurView>
            </View>

            {/* Insights link */}
            <TouchableOpacity onPress={handleInsights} activeOpacity={0.7} style={vd.insightsLink}>
              <Text style={vd.insightsText}>Explore Insights →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
});

const vd = StyleSheet.create({
  card: {
    borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35, shadowRadius: 22, elevation: 12,
  },
  imageBg: { width: '100%', minHeight: 300, overflow: 'hidden' },
  content: {
    flex: 1, paddingHorizontal: 22, paddingTop: 22, paddingBottom: 0,
    minHeight: 300, justifyContent: 'space-between',
  },
  tagsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 0 },
  tagPill: {
    backgroundColor: 'rgba(201,169,107,0.18)',
    borderWidth: 1, borderColor: 'rgba(201,169,107,0.35)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  tagText: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.7)',
  },
  dagger: {
    fontSize: 18, color: 'rgba(201,169,107,0.55)',
  },
  verseBlock: { flex: 1, justifyContent: 'center', paddingVertical: 16 },
  reference: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 14, fontStyle: 'italic', letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.55)', marginBottom: 12,
  },
  verseText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 22, fontWeight: '300', lineHeight: 36,
    color: 'rgba(255,255,255,0.92)', letterSpacing: 0.1,
  },
  actionBarWrap: { marginTop: 16, marginBottom: 0, overflow: 'hidden', borderRadius: 40 },
  actionBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 40, paddingVertical: 12, paddingHorizontal: 8,
  },
  action: { flex: 1, alignItems: 'center', gap: 5 },
  actionLabel: {
    fontSize: 10, fontWeight: '500', letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.55)',
  },
  actionDivider: {
    width: 1, height: 22, backgroundColor: 'rgba(255,255,255,0.1)',
  },
  insightsLink: { paddingBottom: 18, paddingTop: 10, alignItems: 'center' },
  insightsText: {
    fontSize: 12, color: 'rgba(201,169,107,0.75)', textAlign: 'center',
  },
});

// ─── Continue Your Journey Card (Daily Devotion → structured Bible journey) ───

const TodayDevotionCard = memo(function TodayDevotionCard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useTheme();
  const isDark = t.statusBar === 'light-content';

  const [journey, setJourney] = useState<JourneySnapshot | null>(null);
  const [loaded,  setLoaded]  = useState(false);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      getJourneySnapshot().then(snap => {
        if (mounted) { setJourney(snap); setLoaded(true); }
      });
      return () => { mounted = false; };
    }, []),
  );

  const cardScale = useRef(new Animated.Value(1)).current;
  const pressIn  = useCallback(() =>
    Animated.spring(cardScale, { toValue: 0.975, useNativeDriver: true, tension: 300, friction: 20 }).start(),
  [cardScale]);
  const pressOut = useCallback(() =>
    Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 20 }).start(),
  [cardScale]);

  const gradColors: [string, string] = isDark
    ? ['rgba(13,15,26,0.5)', 'rgba(13,15,26,0.88)']
    : ['rgba(47,30,10,0.45)', 'rgba(20,12,4,0.82)'];

  if (!loaded) return null;

  const open = () => navigation.navigate('Journey');
  const percent = journey ? Math.round(journey.percent * 100) : 0;

  return (
    <Pressable onPress={open} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={{ transform: [{ scale: cardScale }] }}>
        <View style={td.imageBg}>
          <ExpoImage
            source={require('../../assets/hands-cluds.jpg')}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 22 }]}
            contentFit="cover"
            transition={350}
            cachePolicy="memory-disk"
          />
          <LinearGradient colors={gradColors} style={[StyleSheet.absoluteFillObject, { borderRadius: 22 }]} />

          <View style={td.content}>
            {/* Eyebrow */}
            <View style={td.eyebrowRow}>
              <Ionicons name="map-outline" size={12} color="#C9A96B" />
              <Text style={td.eyebrowLabel}>
                {journey ? 'CONTINUE YOUR JOURNEY' : 'BEGIN A JOURNEY'}
              </Text>
              <View style={{ flex: 1 }} />
              {journey && journey.streak > 0 && (
                <View style={td.themePill}>
                  <Text style={td.themeText}>🔥 {journey.streak} day{journey.streak === 1 ? '' : 's'}</Text>
                </View>
              )}
            </View>

            {journey ? (
              <>
                {/* Current study */}
                <Text style={td.title}>{journey.study.title}</Text>
                <Text style={td.scripture}>
                  Day {Math.min(journey.progress.currentDay, journey.study.totalDays)} of {journey.study.totalDays}
                </Text>

                {/* Today's lesson */}
                {journey.progress.finished ? (
                  <Text style={td.excerpt} numberOfLines={2}>
                    Journey complete — celebrate and choose your next study.
                  </Text>
                ) : journey.todayLesson ? (
                  <Text style={td.excerpt} numberOfLines={2}>
                    {journey.doneForToday
                      ? 'Today complete. Tomorrow: '
                      : "Today's Lesson: "}
                    {journey.doneForToday && journey.todayLesson.tomorrowPreview
                      ? journey.todayLesson.tomorrowPreview
                      : journey.todayLesson.title}
                  </Text>
                ) : null}

                {/* Progress bar */}
                <View style={td.progressTrack}>
                  <View style={[td.progressFill, { width: `${percent}%` }]} />
                </View>

                <View style={td.ctaRow}>
                  <TouchableOpacity style={td.ctaBtn} onPress={open} activeOpacity={0.8}>
                    <Text style={td.ctaBtnText}>
                      {journey.progress.finished ? 'View Journey' : journey.doneForToday ? 'Review Journey' : 'Continue'}
                    </Text>
                    <Ionicons name="arrow-forward" size={13} color="rgba(255,255,255,0.9)" />
                  </TouchableOpacity>
                  <Text style={td.readTime}>{percent}% complete</Text>
                </View>
              </>
            ) : (
              <>
                <Text style={td.title}>Begin a Bible Journey</Text>
                <Text style={td.excerpt} numberOfLines={2}>
                  Guided studies that walk with you one day at a time — a clear path through Scripture.
                </Text>
                <View style={td.ctaRow}>
                  <TouchableOpacity style={td.ctaBtn} onPress={open} activeOpacity={0.8}>
                    <Text style={td.ctaBtnText}>Explore Studies</Text>
                    <Ionicons name="arrow-forward" size={13} color="rgba(255,255,255,0.9)" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
});

const td = StyleSheet.create({
  imageBg: {
    borderRadius: 22, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  content: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 24 },
  eyebrowRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
  },
  eyebrowLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.8,
    color: 'rgba(201,169,107,0.8)',
  },
  themePill: {
    backgroundColor: 'rgba(201,169,107,0.15)',
    borderWidth: 1, borderColor: 'rgba(201,169,107,0.3)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  themeText: { fontSize: 9, fontWeight: '600', color: 'rgba(201,169,107,0.85)' },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 22, fontWeight: '400', lineHeight: 31,
    color: 'rgba(255,255,255,0.95)', marginBottom: 8,
  },
  scripture: {
    fontSize: 12, fontStyle: 'italic',
    color: 'rgba(255,255,255,0.45)', marginBottom: 14,
  },
  excerpt: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 14, fontWeight: '300', lineHeight: 23,
    color: 'rgba(255,255,255,0.65)', marginBottom: 20,
  },
  ctaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 28, paddingVertical: 11, paddingHorizontal: 18,
  },
  ctaBtnText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  readTime: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  progressTrack: {
    height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.14)',
    marginBottom: 16, overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: '#C9A96B' },
});

// ─── Reading Plan Card ────────────────────────────────────────────────────────

const ReadingPlanCard = memo(function ReadingPlanCard() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useTheme();
  const isDark = t.statusBar === 'light-content';
  const [active, setActive] = useState<ReadingActivePlan | null | undefined>(undefined);

  useFocusEffect(useCallback(() => {
    getActivePlan().then(setActive);
  }, []));

  if (active === undefined) return null;

  const glass = isDark ? DARK_GLASS : LIGHT_GLASS;

  if (!active) {
    return (
      <TouchableOpacity
        style={[rp.card, glass, { alignItems: 'center', gap: 12, paddingVertical: 28 }]}
        onPress={() => navigation.navigate('PlanLibrary')}
        activeOpacity={0.82}
      >
        <View style={[rp.emptyIconWrap, { backgroundColor: t.accentBg }]}>
          <Ionicons name="book-outline" size={32} color={t.accent} />
        </View>
        <Text style={[rp.emptyTitle, { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: t.text }]}>
          Start a Reading Plan
        </Text>
        <Text style={[rp.emptySub, { color: t.textMuted }]}>
          Build a daily Scripture habit with a structured guide.
        </Text>
        <View style={[rp.emptyCta, { backgroundColor: t.gold }]}>
          <Text style={rp.emptyCtaText}>Browse Plans</Text>
        </View>
      </TouchableOpacity>
    );
  }

  const plan    = getPlanById(active.planId);
  const reading = getTodayReading(active);
  const done    = isTodayCompleted(active);

  if (!plan || !reading) return null;

  const numDots = Math.min(plan.totalDays, 28);

  return (
    <TouchableOpacity
      style={[rp.card, glass]}
      onPress={() => navigation.navigate('TodayJourney')}
      activeOpacity={0.85}
    >
      {/* Top accent bar */}
      <View style={[rp.accentBar, {
        backgroundColor: isDark ? 'rgba(201,169,107,0.35)' : 'rgba(201,169,107,0.5)',
      }]} />

      {/* Eyebrow + streak */}
      <View style={rp.cardTop}>
        <Text style={[rp.cardLabel, { color: t.textMuted }]}>TODAY'S READING</Text>
        {active.streak > 0 && (
          <View style={rp.streakBadge}>
            <Ionicons name="flame" size={12} color={t.gold} />
            <Text style={[rp.streakNum, { color: t.gold }]}>{active.streak}</Text>
          </View>
        )}
      </View>

      {/* Reading title */}
      <Text style={[rp.readingTitle, { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', color: t.text }]}
        numberOfLines={2}>
        {reading.title}
      </Text>

      {/* Meta */}
      <View style={rp.metaRow}>
        <Text style={[rp.metaText, { color: t.textMuted }]}>{plan.title}</Text>
        <View style={[rp.metaDot, { backgroundColor: t.textMuted }]} />
        <Text style={[rp.metaText, { color: t.textMuted }]}>Day {active.currentDay} of {plan.totalDays}</Text>
        <View style={[rp.metaDot, { backgroundColor: t.textMuted }]} />
        <Text style={[rp.metaText, { color: t.textMuted }]}>{reading.estimatedMinutes} min</Text>
      </View>

      {/* Dot segment progress */}
      <View style={rp.dotsRow}>
        {Array.from({ length: numDots }, (_, i) => {
          const dayNum = i + 1;
          const filled = active.completedDays.includes(dayNum);
          return (
            <View
              key={dayNum}
              style={[rp.dot, {
                backgroundColor: filled ? t.gold : t.progressTrack,
                opacity: filled ? 1 : 0.55,
              }]}
            />
          );
        })}
      </View>

      {/* CTA */}
      {done ? (
        <View style={[rp.cta, { borderWidth: 1, borderColor: t.accentBorder, backgroundColor: 'transparent' }]}>
          <Ionicons name="checkmark-circle" size={15} color={t.accent} />
          <Text style={[rp.ctaText, { color: t.accent }]}>Today's Journey Complete</Text>
        </View>
      ) : (
        <View style={[rp.cta, { backgroundColor: t.accent }]}>
          <Text style={[rp.ctaText, { color: '#fff' }]}>Continue Reading</Text>
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" />
        </View>
      )}
    </TouchableOpacity>
  );
});

const rp = StyleSheet.create({
  card: {
    borderRadius: 22, padding: 22, paddingTop: 28, gap: 10,
    position: 'relative',
  },
  accentBar: {
    position: 'absolute', top: 0, left: 22, right: 22, height: 2, borderRadius: 2,
  },
  emptyIconWrap: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '400', textAlign: 'center' },
  emptySub:   { fontSize: 13, lineHeight: 20, textAlign: 'center', paddingHorizontal: 16 },
  emptyCta: {
    borderRadius: 30, paddingVertical: 12, paddingHorizontal: 24, alignSelf: 'center',
  },
  emptyCtaText: { fontSize: 13, fontWeight: '700', color: '#1A1005' },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  streakNum:   { fontSize: 12, fontWeight: '700' },
  readingTitle: { fontSize: 19, fontWeight: '400', lineHeight: 27 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, fontWeight: '500' },
  metaDot:  { width: 3, height: 3, borderRadius: 1.5, opacity: 0.45 },
  dotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, borderRadius: 14, paddingVertical: 14, marginTop: 4,
  },
  ctaText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.1 },
});

// ─── Prayer Snapshot Card ─────────────────────────────────────────────────────

const PrayerSnapshotCard = memo(function PrayerSnapshotCard({
  prayerStats,
}: {
  prayerStats: PrayerStats | null;
}) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t = useTheme();
  const isDark = t.statusBar === 'light-content';
  const glass = isDark ? DARK_GLASS : LIGHT_GLASS;

  return (
    <TouchableOpacity
      style={[ps.card, glass]}
      onPress={() => navigation.navigate('PrayerJournal')}
      activeOpacity={0.82}
    >
      {!prayerStats || prayerStats.total === 0 ? (
        /* Empty state */
        <View style={ps.emptyRow}>
          <Ionicons name="heart-outline" size={22} color={t.accent} />
          <Text style={[ps.emptyText, { color: t.textMuted }]}>Start your prayer journal</Text>
          <View style={{ flex: 1 }} />
          <Ionicons name="chevron-forward" size={16} color={t.textMuted} />
        </View>
      ) : (
        /* Stats state */
        <View style={ps.statsRow}>
          <View style={ps.statsLeft}>
            <Ionicons name="heart" size={22} color="#C47B8A" />
            <Text style={[ps.statsTitle, { color: t.text }]}>Prayer Journal</Text>
          </View>
          <View style={[ps.divider, { backgroundColor: t.divider }]} />
          <View style={ps.statsGroup}>
            <View style={ps.statItem}>
              <Text style={[ps.statNum, { color: t.text }]}>{prayerStats.active}</Text>
              <Text style={[ps.statLabel, { color: t.textMuted }]}>Active</Text>
            </View>
            <View style={ps.statItem}>
              <Text style={[ps.statNum, { color: t.gold }]}>{prayerStats.answered}</Text>
              <Text style={[ps.statLabel, { color: t.textMuted }]}>Answered</Text>
            </View>
            <View style={ps.statItem}>
              <Text style={[ps.statNum, { color: t.accent }]}>{prayerStats.streak}</Text>
              <Text style={[ps.statLabel, { color: t.textMuted }]}>Day streak</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={t.textMuted} />
        </View>
      )}
    </TouchableOpacity>
  );
});

const ps = StyleSheet.create({
  card: { borderRadius: 18, paddingVertical: 16, paddingHorizontal: 18 },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '500' },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statsLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statsTitle: { fontSize: 13, fontWeight: '600' },
  divider: { width: 1, height: 28, marginHorizontal: 18 },
  statsGroup: { flex: 1, flexDirection: 'row', gap: 20 },
  statItem: { alignItems: 'center', gap: 2 },
  statNum:  { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  statLabel: { fontSize: 10, fontWeight: '500' },
});

// ─── Explore Teaser ───────────────────────────────────────────────────────────

const EXPLORE_ICONS: Array<{ icon: string; color: string }> = [
  { icon: 'book-outline',                 color: '#7B9FE8' },
  { icon: 'images-outline',              color: '#D4956A' },
  { icon: 'sparkles-outline',            color: '#C9A96B' },
  { icon: 'mic-outline',                 color: '#C4A96B' },
  { icon: 'musical-notes-outline',       color: '#D4A96A' },
  { icon: 'chatbubble-ellipses-outline', color: '#A897CC' },
];

const ExploreTeaser = memo(function ExploreTeaser() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const t       = useTheme();
  const isDark  = t.statusBar === 'light-content';
  const glass   = isDark ? DARK_GLASS : LIGHT_GLASS;
  const GOLD_C  = '#C9A96B';
  const SERIF_F = Platform.OS === 'ios' ? 'Georgia' : 'serif';
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressIn   = () => Animated.spring(scaleAnim, { toValue: 0.975, useNativeDriver: true, tension: 280, friction: 16 }).start();
  const pressOut  = () => Animated.spring(scaleAnim, { toValue: 1,     useNativeDriver: true, tension: 280, friction: 16 }).start();

  return (
    <View>
      <Text style={[et.sectionLabel, { color: t.textMuted }]}>EXPLORE</Text>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Explore')}
          onPressIn={pressIn}
          onPressOut={pressOut}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel="Explore all features"
        >
          <View style={[et.card, glass]}>
            {/* Gold top accent */}
            <View style={[et.accentBar, { backgroundColor: GOLD_C }]} />

            {/* Icon preview row */}
            <View style={et.iconRow}>
              {EXPLORE_ICONS.map(({ icon, color }) => (
                <View
                  key={icon}
                  style={[et.iconBubble, { backgroundColor: color + '1E' }]}
                >
                  <Ionicons name={icon as any} size={18} color={color} />
                </View>
              ))}
            </View>

            {/* Text + CTA */}
            <View style={et.body}>
              <View style={et.textBlock}>
                <Text style={[et.title, { color: t.text, fontFamily: SERIF_F }]}>
                  Discover Everything
                </Text>
                <Text style={[et.sub, { color: t.textMuted }]}>
                  Six tools for your spiritual journey
                </Text>
              </View>
              <View style={et.ctaRow}>
                <Text style={[et.ctaText, { color: GOLD_C }]}>View all features</Text>
                <Ionicons name="arrow-forward" size={13} color={GOLD_C} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

const et = StyleSheet.create({
  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 12,
  },
  card: {
    borderRadius: 20, overflow: 'hidden', paddingBottom: 18,
  },
  accentBar: {
    height: 3, marginHorizontal: 18, marginTop: 18,
    borderRadius: 2, marginBottom: 16, width: 36,
  },
  iconRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 18, marginBottom: 18,
  },
  iconBubble: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 18, gap: 10,
  },
  textBlock: { gap: 3 },
  title: { fontSize: 20, fontWeight: '400', letterSpacing: -0.3 },
  sub:   { fontSize: 12, fontWeight: '400' },
  ctaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  ctaText: { fontSize: 13, fontWeight: '600' },
});

// ─── Glass card constants ─────────────────────────────────────────────────────

const LIGHT_GLASS = {
  backgroundColor: 'rgba(255,255,255,0.62)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.80)',
  shadowColor: 'rgba(47,42,36,0.12)' as string,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 1 as number,
  shadowRadius: 12,
  elevation: 3,
};

const DARK_GLASS = {
  backgroundColor: 'rgba(255,255,255,0.06)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.10)',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.28,
  shadowRadius: 14,
  elevation: 5,
};

// ─── Home Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const greeting = useMemo(() => getGreeting(), []);
  const [streak,      setStreak]      = useState(0);
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal | null>(null);
  const [firstName,   setFirstName]   = useState('');
  const [prayerStats, setPrayerStats] = useState<PrayerStats | null>(null);

  const scrollY   = useRef(new Animated.Value(0)).current;
  const fadeAnims  = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;
  const slideAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(28))).current;

  // Load name from storage
  useEffect(() => {
    AsyncStorage.getItem('@chat_display_name').then(name => {
      if (name) setFirstName(name.trim().split(' ')[0]);
    }).catch(() => {});
  }, []);

  // Staggered entrance animation
  useEffect(() => {
    Animated.stagger(80, [0, 1, 2, 3, 4].map(i =>
      Animated.parallel([
        Animated.timing(fadeAnims[i], {
          toValue: 1, duration: 500,
          easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.spring(slideAnims[i], {
          toValue: 0, tension: 160, friction: 22, useNativeDriver: true,
        }),
      ])
    )).start();
  }, []);

  useFocusEffect(useCallback(() => {
    getStreakData().then(d => setStreak(d.streak));
    loadOnboarding().then(d => setPrimaryGoal(d.primaryGoal)).catch(() => {});
    getPrayerStats().then(setPrayerStats).catch(() => {});
  }, []));

  const tagline = primaryGoal ? GOAL_TAGLINES[primaryGoal] : 'Walk faithfully today.';

  const onScroll = useMemo(() => Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (e: any) => {
        tabBarScrollSignal.setValue(e.nativeEvent.contentOffset.y);
      },
    }
  ), [scrollY]);

  return (
    <View style={{ flex: 1, backgroundColor: t.statusBar === 'light-content' ? '#060810' : '#DDD5C4' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.contentContainer}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
      >
        {/* Full-bleed hero */}
        <CinematicHero
          scrollY={scrollY}
          greeting={greeting}
          tagline={tagline}
          streak={streak}
          firstName={firstName}
          topInset={insets.top}
        />

        {/* Content sections */}
        <View style={s.contentInner}>
          <NotificationReminderBanner />

          <Animated.View style={{ opacity: fadeAnims[0], transform: [{ translateY: slideAnims[0] }] }}>
            <VerseOfDayCard />
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnims[1], transform: [{ translateY: slideAnims[1] }] }}>
            <TodayDevotionCard />
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnims[2], transform: [{ translateY: slideAnims[2] }] }}>
            <ReadingPlanCard />
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnims[3], transform: [{ translateY: slideAnims[3] }] }}>
            <PrayerSnapshotCard prayerStats={prayerStats} />
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnims[4], transform: [{ translateY: slideAnims[4] }] }}>
            <ExploreTeaser />
          </Animated.View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  contentContainer: { paddingBottom: 140 },
  contentInner: { paddingHorizontal: 18, paddingTop: 20, gap: 20 },
});
