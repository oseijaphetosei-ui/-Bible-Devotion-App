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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

// ─── Hero Section ─────────────────────────────────────────────────────────────

const HeroSection = memo(function HeroSection({
  streak, total, markedToday, t, onBack,
}: {
  streak: number; total: number; markedToday: boolean;
  t: AppTheme; onBack: () => void;
}) {
  const isDark = t.statusBar === 'light-content';

  return (
    <LinearGradient
      colors={isDark
        ? ['rgba(19,22,38,1)', 'rgba(13,15,26,0.92)']
        : ['rgba(237,231,217,1)', 'rgba(237,231,217,0.82)']}
      style={hs.container}
    >
      {/* Nav row */}
      <View style={hs.navRow}>
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={26} color={t.text} />
        </TouchableOpacity>
      </View>

      {/* Identity */}
      <View style={hs.identRow}>
        <Ionicons name="sunny-outline" size={15} color={t.accent} />
        <Text style={[hs.identLabel, { color: t.accent }]}>DAILY DEVOTION</Text>
      </View>

      <Text style={[hs.heading, { color: t.text }]}>
        Nourish Your{'\n'}Soul Today
      </Text>

      <Text style={[hs.quote, { color: t.textMuted }]}>
        {"\"Your word is a lamp to my feet\nand a light to my path.\"\n— Psalm 119:105"}
      </Text>

      {/* Stats */}
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
            name={markedToday ? 'checkmark-circle' : 'ellipse-outline'}
            size={22}
            color={markedToday ? t.gold : t.textMuted}
          />
          <Text style={[hs.statLabel, { color: t.textMuted }]}>Today</Text>
        </View>
      </View>
    </LinearGradient>
  );
});

const hs = StyleSheet.create({
  container:  { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 0, marginBottom: 0 },
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'flex-start', marginBottom: 26,
  },
  identRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  identLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  heading: {
    fontSize: 28, fontWeight: '700', letterSpacing: -0.4,
    lineHeight: 36, marginBottom: 14,
  },
  quote:      { fontSize: 13, lineHeight: 20, fontStyle: 'italic', marginBottom: 24 },
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

// ─── Breathing Timer ──────────────────────────────────────────────────────────

const BREATH_PHASES = [
  { label: 'Inhale', seconds: 4, toScale: 1.45 },
  { label: 'Hold',   seconds: 4, toScale: 1.45 },
  { label: 'Exhale', seconds: 4, toScale: 1.0  },
  { label: 'Hold',   seconds: 4, toScale: 1.0  },
];

function BreathingTimer({ t }: { t: AppTheme }) {
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

  const phase = BREATH_PHASES[phaseIdx];

  return (
    <View style={[s.card, { backgroundColor: t.card }]}>
      <Text style={[s.sectionLabel, { color: t.textMuted }]}>PRAYER BREATHING</Text>
      <Text style={[s.breathSubtitle, { color: t.textMuted }]}>Box breathing · 4-4-4-4</Text>

      <View style={s.breathCircleWrap}>
        <View style={[s.breathRingOuter, { borderColor: t.goldBorder }]} />
        <Animated.View style={[s.breathCircle, {
          transform: [{ scale }],
          backgroundColor: t.goldBg,
          borderColor: t.goldBorder,
        }]}>
          <Text style={[s.breathPhaseLabel, { color: t.text }]}>
            {active ? phase.label : 'Begin'}
          </Text>
          {active && (
            <Text style={[s.breathCountdown, { color: t.gold }]}>{countdown}</Text>
          )}
        </Animated.View>
      </View>

      <TouchableOpacity
        style={[
          s.breathBtn,
          { backgroundColor: t.goldBg, borderColor: t.goldBorder },
          active && { backgroundColor: 'rgba(220,38,38,0.08)', borderColor: 'rgba(220,38,38,0.2)' },
        ]}
        onPress={active ? stop : start}
        activeOpacity={0.8}
      >
        <Text style={[s.breathBtnText, { color: active ? '#DC2626' : t.gold }]}>
          {active ? 'Stop' : 'Start'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Streak Board ─────────────────────────────────────────────────────────────

type WeekDay = {
  dateStr: string; label: string; dayNum: number;
  completed: boolean; isToday: boolean;
};

function StreakBoard({ refreshTrigger, t }: { refreshTrigger: number; t: AppTheme }) {
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

  return (
    <View style={s.bareSection}>
      <View style={s.streakTopRow}>
        <View>
          <Text style={[s.sectionLabel, { color: t.textMuted }]}>THIS WEEK</Text>
          <View style={s.streakLineRow}>
            {streak > 0 ? (
              <>
                <Ionicons name="flame" size={14} color={t.gold} />
                <Text style={[s.streakLine, { color: t.text }]}>{streak}-day streak</Text>
              </>
            ) : (
              <Text style={[s.streakLine, { color: t.textSub }]}>Start your streak today</Text>
            )}
          </View>
        </View>
        <View style={[s.streakBadge, { backgroundColor: t.card, borderColor: t.divider }]}>
          <Text style={[s.streakBadgeNum, { color: t.text }]}>{total}</Text>
          <Text style={[s.streakBadgeLbl, { color: t.textMuted }]}>total</Text>
        </View>
      </View>

      <View style={s.weekRow}>
        {weekDays.map(day => (
          <View key={day.dateStr} style={s.dayCol}>
            <Text style={[s.dayLabel, { color: t.textMuted }]}>{day.label}</Text>
            <View style={[
              s.dayCircle,
              { backgroundColor: t.weekCircleBg, borderColor: t.weekCircleBorder },
              day.isToday   && { backgroundColor: t.weekCircleActiveBg, borderColor: t.goldBorder },
              day.completed && { backgroundColor: t.goldBg, borderColor: t.goldBorder },
            ]}>
              {day.completed
                ? <Ionicons name="checkmark" size={14} color={t.gold} />
                : <Text style={[s.dayNum, { color: t.textMuted }, day.isToday && { color: t.gold }]}>
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

// ─── Reader Controls ──────────────────────────────────────────────────────────

function ReaderControls({
  fontSz, speaking, copied, t, onFont, onTTS, onShare, onCopy,
}: {
  fontSz: string; speaking: boolean; copied: boolean;
  t: AppTheme;
  onFont: () => void; onTTS: () => void; onShare: () => void; onCopy: () => void;
}) {
  const items = [
    { icon: 'text',                                      label: fontSz.toUpperCase(), onPress: onFont,  active: false },
    { icon: speaking ? 'pause-circle' : 'volume-medium', label: speaking ? 'Stop' : 'Listen', onPress: onTTS,   active: speaking },
    { icon: copied ? 'checkmark' : 'copy-outline',       label: copied ? 'Copied!' : 'Copy',  onPress: onCopy,  active: copied },
    { icon: 'share-outline',                             label: 'Share',              onPress: onShare, active: false },
  ] as const;

  return (
    <View style={[s.readerControls, { backgroundColor: t.chipBg, borderColor: t.chipBorder }]}>
      {items.map(item => (
        <TouchableOpacity
          key={item.label}
          style={s.readerBtn}
          onPress={item.onPress}
          activeOpacity={0.75}
        >
          <Ionicons
            name={item.icon as any}
            size={18}
            color={item.active ? t.gold : t.textSub}
          />
          <Text style={[s.readerBtnLabel, { color: item.active ? t.gold : t.textMuted }]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

// Height of the card portion that should stay visible above the keyboard:
// card paddingTop (18) + label (~13) + gap (14) + search bar (~46) + breathing room (16)
const CARD_VISIBLE_HEIGHT = 107;

export default function DevotionScreen() {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RouteP>();
  const t          = useTheme();
  const { top: safeTop } = useSafeAreaInsets();

  // Scroll-to-card-on-keyboard refs
  const scrollViewRef     = useRef<ScrollView>(null);
  const cardRef           = useRef<View>(null);
  const scrollYRef        = useRef(0);
  const scrollYBeforeKb   = useRef(0);
  const windowHeight      = Dimensions.get('window').height;
  const [extraBottomPad, setExtraBottomPad] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, (e) => {
      const kbH = e.endCoordinates.height;
      // Expand the scrollable area so we can scroll the card far enough above the keyboard
      setExtraBottomPad(kbH + 120);
      scrollYBeforeKb.current = scrollYRef.current;

      // Wait one frame for the layout to update with the extra padding before measuring
      setTimeout(() => {
        const targetCardTopInWindow = windowHeight - kbH - CARD_VISIBLE_HEIGHT - 4;
        cardRef.current?.measureInWindow((_x, y) => {
          const delta = y - targetCardTopInWindow;
          if (delta > 0) {
            scrollViewRef.current?.scrollTo({
              y: scrollYRef.current + delta,
              animated: true,
            });
          }
        });
      }, 50);
    });

    const hide = Keyboard.addListener(hideEvent, () => {
      setExtraBottomPad(0);
      scrollViewRef.current?.scrollTo({
        y: scrollYBeforeKb.current,
        animated: true,
      });
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

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={[s.scrollContent, extraBottomPad > 0 && { paddingBottom: 130 + extraBottomPad }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={(e) => { scrollYRef.current = e.nativeEvent.contentOffset.y; }}
          scrollEventThrottle={50}
        >
          {/* ── Hero ── */}
          <HeroSection
            streak={streakData.streak}
            total={streakData.total}
            markedToday={markedToday}
            t={t}
            onBack={() => navigation.goBack()}
          />

          {/* ── Content area ── */}
          <View style={s.contentArea}>

            {/* ── Devotion Content ── */}
            {devotion && (
              <>
                {/* Scripture card */}
                <View style={[s.scriptureCard, { backgroundColor: t.card }]}>
                  <Text style={[s.devotionTitle, { color: t.text }]}>{devotion.title}</Text>

                  <View style={[s.themeBadge, { backgroundColor: t.accentBg, borderColor: t.accentBorder }]}>
                    <Text style={[s.themeBadgeText, { color: t.accent }]}>{devotion.keyTheme}</Text>
                  </View>

                  <Text style={[s.refText, { color: t.gold }]}>{devotion.scriptureReference}</Text>
                  <Text style={[s.scriptureBody, { color: t.textSub }]}>
                    "{devotion.scriptureText}"
                  </Text>
                </View>

                {/* Reader controls */}
                <ReaderControls
                  fontSz={reader.fontSz}
                  speaking={reader.speaking}
                  copied={reader.copied}
                  t={t}
                  onFont={reader.cycleFontSize}
                  onTTS={reader.toggleTTS}
                  onShare={reader.shareScripture}
                  onCopy={reader.copyScripture}
                />

                {/* Talk to Scripture */}
                <TouchableOpacity
                  style={[s.talkBtn, { backgroundColor: t.card, borderColor: t.divider }]}
                  onPress={() => {
                    const context = [
                      `Title: ${devotion.title}`,
                      `Key Theme: ${devotion.keyTheme}`,
                      `Scripture: ${devotion.scriptureText}`,
                      `Devotional:\n${devotion.devotionalBody.join('\n\n')}`,
                      `Life Application: ${devotion.lifeApplication}`,
                    ].join('\n\n');
                    navigation.navigate('ScriptureChat', {
                      reference:   devotion.scriptureReference,
                      contextType: 'devotion',
                      context,
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chatbubbles-outline" size={17} color={t.textSub} />
                  <Text style={[s.talkBtnText, { color: t.text }]}>Talk to the Scripture</Text>
                </TouchableOpacity>

                {/* Devotional body */}
                <View style={s.bareSection}>
                  {devotion.devotionalBody.map((para, i) => (
                    <Text
                      key={i}
                      style={[
                        s.bodyPara,
                        { fontSize: reader.fontSize, color: t.text },
                        i < devotion.devotionalBody.length - 1 && s.bodyParaGap,
                      ]}
                    >
                      {para}
                    </Text>
                  ))}
                </View>

                <View style={[s.divider, { backgroundColor: t.divider }]} />

                {/* Life Application */}
                <View style={s.bareSection}>
                  <View style={s.sectionTitleRow}>
                    <Ionicons name="leaf-outline" size={13} color={t.accent} />
                    <Text style={[s.sectionTitle, { color: t.textMuted }]}>LIFE APPLICATION</Text>
                  </View>
                  <Text style={[s.sectionBody, { fontSize: reader.fontSize, color: t.text }]}>
                    {devotion.lifeApplication}
                  </Text>
                </View>

                <View style={[s.divider, { backgroundColor: t.divider }]} />

                {/* Reflection */}
                <View style={s.bareSection}>
                  <View style={s.sectionTitleRow}>
                    <Ionicons name="help-circle-outline" size={13} color={t.accent} />
                    <Text style={[s.sectionTitle, { color: t.textMuted }]}>REFLECT</Text>
                  </View>
                  <Text style={[s.sectionBody, { fontSize: reader.fontSize, color: t.textSub, fontStyle: 'italic' }]}>
                    {devotion.reflectionQuestion}
                  </Text>
                </View>

                <View style={[s.divider, { backgroundColor: t.divider }]} />

                {/* Guided Prayer */}
                <View style={s.bareSection}>
                  <View style={s.sectionTitleRow}>
                    <Ionicons name="heart-outline" size={13} color={t.accent} />
                    <Text style={[s.sectionTitle, { color: t.textMuted }]}>GUIDED PRAYER</Text>
                  </View>
                  <Text style={[s.sectionBody, { fontSize: reader.fontSize, color: t.textSub, fontStyle: 'italic' }]}>
                    {devotion.guidedPrayer}
                  </Text>
                </View>

                {/* Shareable quote */}
                <View style={[s.quoteBlock, { borderLeftColor: t.goldBorder }]}>
                  <Text style={[s.quoteText, { color: t.textSub }]}>
                    {devotion.shareableQuote}
                  </Text>
                </View>

                {/* Action row */}
                <View style={s.actionRow}>
                  <TouchableOpacity
                    style={[s.completeBtn, { borderColor: t.cardBorder, backgroundColor: t.card }]}
                    onPress={handleMarkComplete}
                    disabled={markedToday}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={markedToday ? 'checkmark-circle' : 'checkmark-circle-outline'}
                      size={18}
                      color={markedToday ? t.gold : t.textSub}
                    />
                    <Text style={[s.completeBtnText, { color: markedToday ? t.gold : t.text }]}>
                      {markedToday ? 'Completed ✓' : 'Mark Complete'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.journalBtn, { borderColor: t.cardBorder, backgroundColor: t.card }]}
                    onPress={saveToJournal}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="journal-outline" size={18} color={t.textSub} />
                    <Text style={[s.journalBtnText, { color: t.text }]}>Save to Journal</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Streak + Breathing */}
            <StreakBoard refreshTrigger={streakTrigger} t={t} />
            <BreathingTimer t={t} />

            {/* ── Topic Input (bottom) ── */}
            <View ref={cardRef} style={[s.card, { backgroundColor: t.card }]}>
              <Text style={[s.topicCardLabel, { color: t.textMuted }]}>WHAT'S ON YOUR HEART?</Text>

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
                          { borderColor: t.chipBorder, backgroundColor: t.chipBg },
                          isActive && { borderColor: t.goldBorder, backgroundColor: t.goldBg },
                        ]}
                        onPress={() => setTopic(tag)}
                        activeOpacity={0.75}
                      >
                        <Text style={[
                          s.tagChipText,
                          { color: t.textMuted },
                          isActive && { color: t.gold },
                        ]}>
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              <TouchableOpacity
                style={[
                  s.generateBtn,
                  { backgroundColor: t.gold },
                  (!topic.trim() || loading) && s.generateBtnDisabled,
                ]}
                onPress={generate}
                disabled={!topic.trim() || loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator color={t.bg} size="small" />
                  : <Text style={[s.generateBtnText, { color: t.bg }]}>✦  Generate Devotion</Text>
                }
              </TouchableOpacity>

              {error ? (
                <Text style={[s.errorNote, { color: t.textMuted }]}>{error}</Text>
              ) : null}
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:        { flex: 1 },
  scrollContent: { paddingBottom: 130 },
  contentArea:   { paddingHorizontal: 18, paddingTop: 24, gap: 20 },

  // Bare sections — no card, sits directly on background
  bareSection: { gap: 16 },
  divider:     { height: StyleSheet.hairlineWidth, marginVertical: 4 },

  // Shared card
  card: {
    borderRadius: 16, padding: 18, gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },

  // Topic
  topicCardLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.6 },
  tagsScroll:     { marginHorizontal: -18 },
  tagsRow:        { paddingHorizontal: 18, gap: 8 },
  tagChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  tagChipText:         { fontSize: 13, fontWeight: '600' },
  generateBtn:         { borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  generateBtnDisabled: { opacity: 0.4 },
  generateBtnText:     { fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  errorNote:           { fontSize: 12, textAlign: 'center' },

  // Scripture card
  scriptureCard: {
    borderRadius: 16, padding: 20, gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  devotionTitle: { fontSize: 21, fontWeight: '700', lineHeight: 28, letterSpacing: -0.3 },
  themeBadge: {
    alignSelf: 'flex-start', borderRadius: 6, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  themeBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  refText:        { fontSize: 13, fontWeight: '700' },
  scriptureBody:  { fontSize: 15, lineHeight: 26, fontStyle: 'italic' },

  // Reader controls
  readerControls: {
    flexDirection: 'row', borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
  },
  readerBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 4,
  },
  readerBtnLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.4 },

  // Talk to Scripture
  talkBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
  },
  talkBtnText: { fontSize: 15, fontWeight: '600', letterSpacing: 0.2 },

  // Body text
  bodyPara:    { lineHeight: 27 },
  bodyParaGap: { marginBottom: 16 },

  // Section labels
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionTitle:    { fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  sectionBody:     { lineHeight: 25 },

  // Quote
  quoteBlock: { borderLeftWidth: 2, paddingLeft: 18, paddingVertical: 4 },
  quoteText:  { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },

  // Action buttons
  actionRow:   { flexDirection: 'row', gap: 10 },
  completeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, borderWidth: 1,
    borderRadius: 14, paddingVertical: 13,
  },
  completeBtnText: { fontSize: 14, fontWeight: '700' },
  journalBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, borderWidth: 1,
    borderRadius: 14, paddingVertical: 13,
  },
  journalBtnText: { fontSize: 14, fontWeight: '600' },

  // Streak
  streakTopRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streakLineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  sectionLabel:  { fontSize: 10, fontWeight: '700', letterSpacing: 1.6 },
  streakLine:    { fontSize: 14, fontWeight: '600' },
  streakBadge: {
    alignItems: 'center', borderRadius: 10, borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  streakBadgeNum: { fontSize: 20, fontWeight: '800' },
  streakBadgeLbl: { fontSize: 9, fontWeight: '600', letterSpacing: 0.8 },
  weekRow:        { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol:         { alignItems: 'center', gap: 6 },
  dayLabel:       { fontSize: 10, fontWeight: '600' },
  dayCircle: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  dayNum: { fontSize: 12, fontWeight: '600' },

  // Breathing
  breathSubtitle:   { fontSize: 12, marginTop: 2, marginBottom: 8 },
  breathCircleWrap: {
    width: 140, height: 140,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginVertical: 8,
  },
  breathRingOuter: {
    position: 'absolute', width: 140, height: 140,
    borderRadius: 70, borderWidth: 1,
  },
  breathCircle: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  breathPhaseLabel: { fontSize: 13, fontWeight: '700' },
  breathCountdown:  { fontSize: 24, fontWeight: '800', marginTop: -2 },
  breathBtn: {
    alignSelf: 'center', marginTop: 8,
    paddingHorizontal: 36, paddingVertical: 11,
    borderRadius: 12, borderWidth: 1,
  },
  breathBtnText: { fontSize: 14, fontWeight: '700' },
});
