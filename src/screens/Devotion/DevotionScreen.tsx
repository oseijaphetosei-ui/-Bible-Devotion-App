import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Animated,
  Platform,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types/navigation';
import { fetchDevotion, getTodayFallback } from '../../services/devotionService';
import { useDevotionReader } from '../../hooks/useDevotionReader';
import { Devotion, QUICK_TAGS } from '../../types/devotion';
import GlassSearchBar from '../../components/GlassSearchBar';
import { markTodayComplete, getStreakData } from '../../services/devotionStreakService';
import { maybePromptPermission } from '../../services/notificationService';
import { useTheme } from '../../theme';
import type { AppTheme } from '../../theme';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'Devotion'>;
type RouteP  = RouteProp<HomeStackParamList, 'Devotion'>;

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H  = Math.round(SCREEN_W * 0.72);
const GOLD    = '#C9A96B';
const SERIF   = Platform.OS === 'ios' ? 'Georgia' : 'serif';

// ─── Glass helpers ────────────────────────────────────────────────────────────

function glassStyle(isDark: boolean) {
  return isDark
    ? { backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }
    : { backgroundColor: 'rgba(255,255,255,0.68)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)' };
}

// ─── Cinematic Hero ───────────────────────────────────────────────────────────

const HeroSection = memo(function HeroSection({
  streak, total, markedToday, isDark, topInset, onBack,
}: {
  streak: number; total: number; markedToday: boolean;
  isDark: boolean; topInset: number; onBack: () => void;
}) {
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  }).toUpperCase();

  return (
    <View style={{ height: HERO_H, overflow: 'hidden' }}>
      {/* Background image */}
      <ExpoImage
        source={require('../../assets/hands-cluds.jpg')}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        cachePolicy="memory-disk"
      />

      {/* Top scrim */}
      <LinearGradient
        colors={['rgba(0,0,0,0.62)', 'rgba(0,0,0,0)']}
        locations={[0, 0.35]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Bottom scrim */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.14)', 'rgba(0,0,0,0.78)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Back button */}
      <TouchableOpacity
        style={[hs.backBtn, { top: topInset + 10 }]}
        onPress={onBack}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.9)" />
      </TouchableOpacity>

      {/* Bottom content */}
      <View style={hs.bottomContent}>
        {/* Eyebrow */}
        <View style={hs.eyebrowRow}>
          <Ionicons name="sunny-outline" size={11} color={GOLD} />
          <Text style={hs.eyebrow}>DAILY DEVOTION</Text>
          <View style={{ flex: 1 }} />
          <Text style={hs.dateLabel}>{todayLabel}</Text>
        </View>

        {/* Title */}
        <Text style={hs.title}>
          Nourish Your{'\n'}Soul Today
        </Text>

        {/* Stats pill */}
        <View style={hs.statsPill}>
          <View style={hs.statItem}>
            <Ionicons name="flame" size={14} color={streak > 0 ? GOLD : 'rgba(255,255,255,0.45)'} />
            <Text style={hs.statValue}>{streak}</Text>
            <Text style={hs.statLabel}>streak</Text>
          </View>
          <View style={hs.statDiv} />
          <View style={hs.statItem}>
            <Text style={hs.statValue}>{total}</Text>
            <Text style={hs.statLabel}>total</Text>
          </View>
          <View style={hs.statDiv} />
          <View style={hs.statItem}>
            <Ionicons
              name={markedToday ? 'checkmark-circle' : 'ellipse-outline'}
              size={14}
              color={markedToday ? GOLD : 'rgba(255,255,255,0.45)'}
            />
            <Text style={[hs.statLabel, markedToday && { color: GOLD }]}>
              {markedToday ? 'done' : 'today'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

const hs = StyleSheet.create({
  backBtn: {
    position: 'absolute', left: 18,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center', justifyContent: 'center',
  },
  bottomContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 22, paddingBottom: 22,
  },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  eyebrow: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2,
    color: GOLD,
  },
  dateLabel: {
    fontSize: 10, fontWeight: '500', letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.42)',
  },
  title: {
    fontFamily: SERIF,
    fontSize: 30, fontWeight: '400', lineHeight: 38,
    letterSpacing: -0.3, color: 'rgba(255,255,255,0.95)',
    marginBottom: 18,
  },
  statsPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.36)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 28, paddingVertical: 10, paddingHorizontal: 6,
    alignSelf: 'flex-start', gap: 0,
  },
  statItem:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14 },
  statValue: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.92)' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.50)' },
  statDiv:   { width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.12)' },
});

// ─── Breathing Timer ──────────────────────────────────────────────────────────

const BREATH_PHASES = [
  { label: 'Inhale', seconds: 4, toScale: 1.45 },
  { label: 'Hold',   seconds: 4, toScale: 1.45 },
  { label: 'Exhale', seconds: 4, toScale: 1.0  },
  { label: 'Hold',   seconds: 4, toScale: 1.0  },
];

function BreathingTimer({ isDark }: { isDark: boolean }) {
  const [active,    setActive]    = useState(false);
  const [phaseIdx,  setPhaseIdx]  = useState(0);
  const [countdown, setCountdown] = useState(BREATH_PHASES[0].seconds);
  const scale       = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeRef     = useRef(BREATH_PHASES[0].seconds);
  const phaseRef    = useRef(0);

  const runPhase = useCallback((idx: number) => {
    phaseRef.current = idx;
    const phase = BREATH_PHASES[idx];
    timeRef.current = phase.seconds;
    setPhaseIdx(idx);
    setCountdown(phase.seconds);
    Animated.timing(scale, {
      toValue: phase.toScale, duration: phase.seconds * 1000, useNativeDriver: true,
    }).start();
    intervalRef.current = setInterval(() => {
      timeRef.current -= 1;
      setCountdown(timeRef.current);
      if (timeRef.current <= 0) {
        clearInterval(intervalRef.current!);
        runPhase((phaseRef.current + 1) % BREATH_PHASES.length);
      }
    }, 1000);
  }, [scale]);

  function start() { setActive(true); runPhase(0); }
  function stop() {
    setActive(false);
    clearInterval(intervalRef.current!);
    scale.stopAnimation();
    Animated.timing(scale, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    setPhaseIdx(0);
    setCountdown(BREATH_PHASES[0].seconds);
  }
  useEffect(() => () => clearInterval(intervalRef.current!), []);

  const phase    = BREATH_PHASES[phaseIdx];
  const glass    = glassStyle(isDark);
  const textColor = isDark ? 'rgba(255,255,255,0.90)' : 'rgba(24,18,8,0.90)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';

  return (
    <View style={[bt.card, glass, { shadowColor: isDark ? '#000' : 'rgba(47,42,36,0.12)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.24 : 1, shadowRadius: 14, elevation: 5 }]}>
      <View style={bt.header}>
        <View style={[bt.headerIcon, { backgroundColor: 'rgba(201,169,107,0.12)' }]}>
          <Ionicons name="leaf-outline" size={16} color={GOLD} />
        </View>
        <View>
          <Text style={[bt.title, { color: textColor }]}>Prayer Breathing</Text>
          <Text style={[bt.subtitle, { color: mutedColor }]}>Box breathing · 4-4-4-4</Text>
        </View>
      </View>

      <View style={bt.circleWrap}>
        <View style={[bt.ringOuter, { borderColor: 'rgba(201,169,107,0.20)' }]} />
        <Animated.View style={[bt.circle, {
          transform: [{ scale }],
          backgroundColor: 'rgba(201,169,107,0.10)',
          borderColor: 'rgba(201,169,107,0.35)',
        }]}>
          <Text style={[bt.phaseLabel, { color: textColor }]}>
            {active ? phase.label : 'Begin'}
          </Text>
          {active && (
            <Text style={bt.countdown}>{countdown}</Text>
          )}
        </Animated.View>
      </View>

      <TouchableOpacity
        style={[
          bt.btn,
          active
            ? { backgroundColor: 'rgba(220,38,38,0.08)', borderColor: 'rgba(220,38,38,0.22)', borderWidth: 1 }
            : { backgroundColor: 'rgba(201,169,107,0.12)', borderColor: 'rgba(201,169,107,0.30)', borderWidth: 1 },
        ]}
        onPress={active ? stop : start}
        activeOpacity={0.8}
      >
        <Text style={[bt.btnText, { color: active ? '#DC2626' : GOLD }]}>
          {active ? 'Stop' : 'Start'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const bt = StyleSheet.create({
  card: { borderRadius: 20, padding: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title:    { fontSize: 15, fontWeight: '600' },
  subtitle: { fontSize: 12, marginTop: 1 },
  circleWrap: {
    width: 140, height: 140,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginVertical: 4,
  },
  ringOuter: {
    position: 'absolute', width: 140, height: 140,
    borderRadius: 70, borderWidth: 1,
  },
  circle: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  phaseLabel: { fontSize: 13, fontWeight: '700' },
  countdown:  { fontSize: 24, fontWeight: '800', color: GOLD, marginTop: -2 },
  btn: {
    alignSelf: 'center',
    paddingHorizontal: 40, paddingVertical: 12,
    borderRadius: 14,
  },
  btnText: { fontSize: 14, fontWeight: '700' },
});

// ─── Streak Board ─────────────────────────────────────────────────────────────

type WeekDay = { dateStr: string; label: string; dayNum: number; completed: boolean; isToday: boolean; };

function StreakBoard({ refreshTrigger, isDark }: { refreshTrigger: number; isDark: boolean }) {
  const [streak,   setStreak]   = useState(0);
  const [total,    setTotal]    = useState(0);
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);

  useEffect(() => {
    getStreakData().then(d => {
      setStreak(d.streak);
      setTotal(d.total);
      setWeekDays(d.weekDays);
    });
  }, [refreshTrigger]);

  const glass     = glassStyle(isDark);
  const textColor  = isDark ? 'rgba(255,255,255,0.90)' : 'rgba(24,18,8,0.90)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';
  const subColor   = isDark ? 'rgba(255,255,255,0.58)' : 'rgba(24,18,8,0.58)';

  return (
    <View style={[sb.card, glass, { shadowColor: isDark ? '#000' : 'rgba(47,42,36,0.12)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.24 : 1, shadowRadius: 14, elevation: 5 }]}>
      <View style={sb.topRow}>
        <View>
          <Text style={[sb.eyebrow, { color: mutedColor }]}>THIS WEEK</Text>
          <View style={sb.streakRow}>
            {streak > 0 ? (
              <>
                <Ionicons name="flame" size={14} color={GOLD} />
                <Text style={[sb.streakText, { color: textColor }]}>{streak}-day streak</Text>
              </>
            ) : (
              <Text style={[sb.streakText, { color: subColor }]}>Start your streak today</Text>
            )}
          </View>
        </View>
        <View style={[sb.badge, { backgroundColor: 'rgba(201,169,107,0.10)', borderColor: 'rgba(201,169,107,0.25)' }]}>
          <Text style={sb.badgeNum}>{total}</Text>
          <Text style={[sb.badgeLbl, { color: mutedColor }]}>total</Text>
        </View>
      </View>

      <View style={sb.weekRow}>
        {weekDays.map(day => (
          <View key={day.dateStr} style={sb.dayCol}>
            <Text style={[sb.dayLabel, { color: mutedColor }]}>{day.label}</Text>
            <View style={[
              sb.dayCircle,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)' },
              day.isToday   && { borderColor: 'rgba(201,169,107,0.55)', backgroundColor: 'rgba(201,169,107,0.08)' },
              day.completed && { backgroundColor: 'rgba(201,169,107,0.18)', borderColor: 'rgba(201,169,107,0.45)' },
            ]}>
              {day.completed
                ? <Ionicons name="checkmark" size={14} color={GOLD} />
                : <Text style={[sb.dayNum, { color: day.isToday ? GOLD : mutedColor }]}>
                    {day.dayNum}
                  </Text>
              }
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const sb = StyleSheet.create({
  card:       { borderRadius: 20, padding: 20, gap: 18 },
  topRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow:    { fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginBottom: 6 },
  streakRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  streakText: { fontSize: 14, fontWeight: '600' },
  badge: {
    alignItems: 'center', borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  badgeNum: { fontSize: 20, fontWeight: '800', color: GOLD },
  badgeLbl: { fontSize: 9, fontWeight: '600', letterSpacing: 0.8 },
  weekRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol:   { alignItems: 'center', gap: 7 },
  dayLabel: { fontSize: 10, fontWeight: '600' },
  dayCircle: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  dayNum: { fontSize: 12, fontWeight: '600' },
});

// ─── Reader Controls ──────────────────────────────────────────────────────────

function ReaderControls({
  fontSz, speaking, copied, isDark, onFont, onTTS, onShare, onCopy,
}: {
  fontSz: string; speaking: boolean; copied: boolean; isDark: boolean;
  onFont: () => void; onTTS: () => void; onShare: () => void; onCopy: () => void;
}) {
  const mutedColor = isDark ? 'rgba(255,255,255,0.40)' : 'rgba(24,18,8,0.40)';
  const glass = glassStyle(isDark);
  const items = [
    { icon: 'text',                                      label: fontSz.toUpperCase(), onPress: onFont,  active: false },
    { icon: speaking ? 'pause-circle' : 'volume-medium', label: speaking ? 'Stop' : 'Listen', onPress: onTTS,   active: speaking },
    { icon: copied ? 'checkmark' : 'copy-outline',       label: copied ? 'Copied!' : 'Copy',  onPress: onCopy,  active: copied },
    { icon: 'share-outline',                             label: 'Share',              onPress: onShare, active: false },
  ] as const;

  return (
    <View style={[rc.bar, glass]}>
      {items.map((item, idx) => (
        <React.Fragment key={item.label}>
          {idx > 0 && <View style={[rc.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }]} />}
          <TouchableOpacity style={rc.btn} onPress={item.onPress} activeOpacity={0.75}>
            <Ionicons name={item.icon as any} size={18} color={item.active ? GOLD : mutedColor} />
            <Text style={[rc.btnLabel, { color: item.active ? GOLD : mutedColor }]}>{item.label}</Text>
          </TouchableOpacity>
        </React.Fragment>
      ))}
    </View>
  );
}

const rc = StyleSheet.create({
  bar:      { flexDirection: 'row', borderRadius: 16, overflow: 'hidden' },
  btn:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 13, gap: 4 },
  btnLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.4 },
  divider:  { width: StyleSheet.hairlineWidth },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

const CARD_VISIBLE_HEIGHT = 107;

export default function DevotionScreen() {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RouteP>();
  const t          = useTheme();
  const insets     = useSafeAreaInsets();

  const isDark = t.statusBar === 'light-content';
  const rootBg = isDark ? '#060810' : '#DDD5C4';
  const textColor  = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const subColor   = isDark ? 'rgba(255,255,255,0.62)' : 'rgba(24,18,8,0.62)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';

  const scrollViewRef   = useRef<ScrollView>(null);
  const cardRef         = useRef<View>(null);
  const scrollYRef      = useRef(0);
  const scrollYBeforeKb = useRef(0);
  const windowHeight    = Dimensions.get('window').height;
  const [extraBottomPad, setExtraBottomPad] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, (e) => {
      const kbH = e.endCoordinates.height;
      setExtraBottomPad(kbH + 120);
      scrollYBeforeKb.current = scrollYRef.current;
      setTimeout(() => {
        const targetCardTopInWindow = windowHeight - kbH - CARD_VISIBLE_HEIGHT - 4;
        cardRef.current?.measureInWindow((_x, y) => {
          const delta = y - targetCardTopInWindow;
          if (delta > 0) {
            scrollViewRef.current?.scrollTo({ y: scrollYRef.current + delta, animated: true });
          }
        });
      }, 50);
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      setExtraBottomPad(0);
      scrollViewRef.current?.scrollTo({ y: scrollYBeforeKb.current, animated: true });
    });
    return () => { show.remove(); hide.remove(); };
  }, [windowHeight]);

  const initialTopic = route.params?.topic ?? '';
  const [topic,         setTopic]         = useState(initialTopic);
  const [devotion,      setDevotion]      = useState<Devotion | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [streakTrigger, setStreakTrigger] = useState(0);
  const [markedToday,   setMarkedToday]   = useState(false);
  const [streakData,    setStreakData]    = useState({ streak: 0, total: 0 });
  const [inputFocused,  setInputFocused]  = useState(false);

  const reader = useDevotionReader(devotion);

  useEffect(() => { setDevotion(getTodayFallback()); }, []);
  useEffect(() => {
    getStreakData().then(d => setStreakData({ streak: d.streak, total: d.total }));
  }, [streakTrigger]);

  async function generate() {
    if (!topic.trim()) return;
    reader.stopTTS();
    setLoading(true);
    setError(null);
    try {
      setDevotion(await fetchDevotion(topic.trim(), 'KJV'));
    } catch {
      setError('Using a local reading instead.');
      setDevotion(getTodayFallback());
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkComplete() {
    if (markedToday) return;
    await markTodayComplete();
    setMarkedToday(true);
    setStreakTrigger(n => n + 1);
    maybePromptPermission().catch(() => {});
  }

  function saveToJournal() {
    if (!devotion) return;
    (navigation as any).navigate('NoteEditor', {
      prefill: {
        bibleReference: devotion.scriptureReference,
        content: `Reflection on ${devotion.scriptureReference}\n\n${devotion.reflectionQuestion}\n\n`,
        title: devotion.title,
      },
    });
  }

  const glass = glassStyle(isDark);
  const glassCard = {
    ...glass,
    borderRadius: 20,
    shadowColor: isDark ? '#000' : 'rgba(47,42,36,0.12)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.24 : 1,
    shadowRadius: 14,
    elevation: 5,
  };

  return (
    <View style={{ flex: 1, backgroundColor: rootBg }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={[s.scrollContent, extraBottomPad > 0 && { paddingBottom: 130 + extraBottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={(e) => { scrollYRef.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={50}
      >
        {/* ── Cinematic Hero ── */}
        <HeroSection
          streak={streakData.streak}
          total={streakData.total}
          markedToday={markedToday}
          isDark={isDark}
          topInset={insets.top}
          onBack={() => navigation.goBack()}
        />

        {/* ── Content ── */}
        <View style={s.contentArea}>

          {devotion && (
            <>
              {/* Scripture card */}
              <View style={glassCard}>
                {/* Gold left accent bar */}
                <View style={s.accentBar} />

                <View style={{ paddingTop: 20, paddingBottom: 20, paddingHorizontal: 20, gap: 12 }}>
                  {/* Theme badge */}
                  <View style={s.themeBadge}>
                    <Text style={s.themeBadgeText}>{devotion.keyTheme}</Text>
                  </View>

                  {/* Title */}
                  <Text style={[s.devotionTitle, { color: textColor }]}>{devotion.title}</Text>

                  {/* Scripture reference */}
                  <Text style={[s.refText]}>{devotion.scriptureReference}</Text>

                  {/* Divider */}
                  <View style={[s.hairline, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }]} />

                  {/* Scripture text */}
                  <Text style={[s.scriptureBody, { color: subColor }]}>
                    "{devotion.scriptureText}"
                  </Text>
                </View>
              </View>

              {/* Reader controls */}
              <ReaderControls
                fontSz={reader.fontSz}
                speaking={reader.speaking}
                copied={reader.copied}
                isDark={isDark}
                onFont={reader.cycleFontSize}
                onTTS={reader.toggleTTS}
                onShare={reader.shareScripture}
                onCopy={reader.copyScripture}
              />

              {/* Talk to Scripture */}
              <TouchableOpacity
                style={[s.talkBtn, glass]}
                onPress={() => {
                  const context = [
                    `Title: ${devotion.title}`,
                    `Key Theme: ${devotion.keyTheme}`,
                    `Scripture: ${devotion.scriptureText}`,
                    `Devotional:\n${devotion.devotionalBody.join('\n\n')}`,
                    `Life Application: ${devotion.lifeApplication}`,
                  ].join('\n\n');
                  navigation.navigate('ScriptureChat', {
                    reference: devotion.scriptureReference,
                    contextType: 'devotion',
                    context,
                  });
                }}
                activeOpacity={0.8}
              >
                <View style={s.talkIconWrap}>
                  <Ionicons name="chatbubbles-outline" size={17} color={GOLD} />
                </View>
                <Text style={[s.talkBtnText, { color: textColor }]}>Talk to the Scripture</Text>
                <Ionicons name="chevron-forward" size={14} color={mutedColor} />
              </TouchableOpacity>

              {/* Devotional body */}
              <View style={[glassCard, { paddingHorizontal: 20, paddingVertical: 20, gap: 0 }]}>
                {devotion.devotionalBody.map((para, i) => (
                  <Text
                    key={i}
                    style={[
                      s.bodyPara,
                      { fontSize: reader.fontSize, color: subColor },
                      i < devotion.devotionalBody.length - 1 && s.bodyParaGap,
                    ]}
                  >
                    {para}
                  </Text>
                ))}
              </View>

              {/* Life Application */}
              <View style={[glassCard, { padding: 20, gap: 12 }]}>
                <View style={s.sectionTitleRow}>
                  <View style={[s.sectionDot, { backgroundColor: t.accent }]} />
                  <Text style={[s.sectionTitle, { color: mutedColor }]}>LIFE APPLICATION</Text>
                </View>
                <Text style={[s.sectionBody, { fontSize: reader.fontSize, color: subColor }]}>
                  {devotion.lifeApplication}
                </Text>
              </View>

              {/* Reflection */}
              <View style={[glassCard, { padding: 20, gap: 12 }]}>
                <View style={s.sectionTitleRow}>
                  <View style={[s.sectionDot, { backgroundColor: GOLD }]} />
                  <Text style={[s.sectionTitle, { color: mutedColor }]}>REFLECT</Text>
                </View>
                <Text style={[s.sectionBody, { fontSize: reader.fontSize, color: subColor, fontStyle: 'italic', fontFamily: SERIF }]}>
                  {devotion.reflectionQuestion}
                </Text>
              </View>

              {/* Guided Prayer */}
              <View style={[glassCard, { padding: 20, gap: 12 }]}>
                <View style={s.sectionTitleRow}>
                  <View style={[s.sectionDot, { backgroundColor: '#C47B8A' }]} />
                  <Text style={[s.sectionTitle, { color: mutedColor }]}>GUIDED PRAYER</Text>
                </View>
                <Text style={[s.sectionBody, { fontSize: reader.fontSize, color: subColor, fontStyle: 'italic', fontFamily: SERIF }]}>
                  {devotion.guidedPrayer}
                </Text>
              </View>

              {/* Shareable quote */}
              <View style={[s.quoteBlock, { backgroundColor: isDark ? 'rgba(201,169,107,0.07)' : 'rgba(201,169,107,0.10)', borderColor: 'rgba(201,169,107,0.30)' }]}>
                <View style={s.quoteGoldBar} />
                <Text style={[s.quoteText, { color: subColor, fontFamily: SERIF }]}>
                  {devotion.shareableQuote}
                </Text>
              </View>

              {/* Action row */}
              <View style={s.actionRow}>
                {/* Mark complete */}
                {markedToday ? (
                  <View style={[s.completeBtn, { flex: 1, borderWidth: 1, borderColor: 'rgba(201,169,107,0.35)', backgroundColor: 'rgba(201,169,107,0.10)' }]}>
                    <Ionicons name="checkmark-circle" size={18} color={GOLD} />
                    <Text style={[s.completeBtnText, { color: GOLD }]}>Completed ✓</Text>
                  </View>
                ) : (
                  <TouchableOpacity onPress={handleMarkComplete} activeOpacity={0.85} style={{ flex: 1 }}>
                    <LinearGradient
                      colors={[GOLD, '#B8904A']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={s.completeBtn}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color="#08071A" />
                      <Text style={[s.completeBtnText, { color: '#08071A' }]}>Mark Complete</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {/* Save to Journal */}
                <TouchableOpacity
                  style={[s.journalBtn, glass]}
                  onPress={saveToJournal}
                  activeOpacity={0.8}
                >
                  <Ionicons name="journal-outline" size={18} color={mutedColor} />
                  <Text style={[s.journalBtnText, { color: textColor }]}>Journal</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Streak Board */}
          <StreakBoard refreshTrigger={streakTrigger} isDark={isDark} />

          {/* Breathing Timer */}
          <BreathingTimer isDark={isDark} />

          {/* Topic generator card */}
          <View ref={cardRef} style={[glassCard, { padding: 20, gap: 14 }]}>
            <View style={s.topicHeader}>
              <View style={[s.topicIconWrap, { backgroundColor: 'rgba(201,169,107,0.12)' }]}>
                <Ionicons name="sparkles-outline" size={16} color={GOLD} />
              </View>
              <View>
                <Text style={[s.topicTitle, { color: textColor }]}>What's on your heart?</Text>
                <Text style={[s.topicSub, { color: mutedColor }]}>Generate a custom devotion</Text>
              </View>
            </View>

            <GlassSearchBar
              value={topic}
              onChangeText={setTopic}
              placeholder="peace, anxiety, forgiveness…"
              returnKeyType="go"
              onSubmitEditing={generate}
              showCancel={false}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />

            {!inputFocused && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.tagsScroll}
                contentContainerStyle={s.tagsRow}
              >
                {QUICK_TAGS.map(tag => {
                  const isActive = topic.toLowerCase() === tag.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        s.tagChip,
                        { backgroundColor: isActive ? 'rgba(201,169,107,0.16)' : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                          borderColor: isActive ? 'rgba(201,169,107,0.40)' : isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)' },
                      ]}
                      onPress={() => setTopic(tag)}
                      activeOpacity={0.75}
                    >
                      <Text style={[s.tagChipText, { color: isActive ? GOLD : mutedColor }]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <TouchableOpacity
              style={[s.generateBtn, (!topic.trim() || loading) && { opacity: 0.45 }]}
              onPress={generate}
              disabled={!topic.trim() || loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[GOLD, '#B8904A']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.generateBtnGradient}
              >
                {loading
                  ? <ActivityIndicator color="#08071A" size="small" />
                  : <Text style={s.generateBtnText}>✦  Generate Devotion</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            {error ? (
              <Text style={[s.errorNote, { color: mutedColor }]}>{error}</Text>
            ) : null}
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scrollContent: { paddingBottom: 130 },
  contentArea:   { paddingHorizontal: 18, paddingTop: 22, gap: 16 },

  // Scripture card internals
  accentBar:     { position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: 20, backgroundColor: GOLD, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  themeBadge:    {
    alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: 'rgba(201,169,107,0.10)', borderColor: 'rgba(201,169,107,0.28)',
  },
  themeBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, color: GOLD },
  devotionTitle: {
    fontFamily: SERIF,
    fontSize: 22, fontWeight: '400', lineHeight: 30, letterSpacing: -0.3,
  },
  refText: {
    fontSize: 13, fontWeight: '700', color: GOLD,
    fontFamily: SERIF, fontStyle: 'italic',
  },
  hairline: { height: StyleSheet.hairlineWidth },
  scriptureBody: {
    fontFamily: SERIF,
    fontSize: 16, lineHeight: 28, fontStyle: 'italic',
    letterSpacing: 0.1,
  },

  // Reader controls
  // (defined in rc above)

  // Talk to Scripture
  talkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16,
  },
  talkIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(201,169,107,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  talkBtnText: { flex: 1, fontSize: 15, fontWeight: '600', letterSpacing: 0.1 },

  // Body
  bodyPara:    { lineHeight: 27, fontFamily: SERIF },
  bodyParaGap: { marginBottom: 16 },

  // Section labels
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionDot:      { width: 4, height: 14, borderRadius: 2 },
  sectionTitle:    { fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  sectionBody:     { lineHeight: 25 },

  // Quote
  quoteBlock: {
    flexDirection: 'row',
    borderWidth: 1, borderRadius: 16,
    overflow: 'hidden',
  },
  quoteGoldBar: { width: 3, backgroundColor: GOLD, borderRadius: 1.5 },
  quoteText:    {
    flex: 1, fontSize: 15, lineHeight: 25, fontStyle: 'italic',
    paddingHorizontal: 16, paddingVertical: 16,
  },

  // Action row
  actionRow:   { flexDirection: 'row', gap: 12 },
  completeBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 14,
  },
  completeBtnText: { fontSize: 14, fontWeight: '700' },
  journalBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 14,
    paddingHorizontal: 18,
  },
  journalBtnText: { fontSize: 14, fontWeight: '600' },

  // Topic card
  topicHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topicIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  topicTitle:   { fontSize: 15, fontWeight: '600' },
  topicSub:     { fontSize: 12, marginTop: 1 },
  tagsScroll:   { marginHorizontal: -20 },
  tagsRow:      { paddingHorizontal: 20, gap: 8 },
  tagChip:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  tagChipText:  { fontSize: 13, fontWeight: '600' },
  generateBtn:  { borderRadius: 14, overflow: 'hidden' },
  generateBtnGradient: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  generateBtnText:     { fontSize: 15, fontWeight: '700', color: '#08071A', letterSpacing: 0.3 },
  errorNote:    { fontSize: 12, textAlign: 'center' },
});
