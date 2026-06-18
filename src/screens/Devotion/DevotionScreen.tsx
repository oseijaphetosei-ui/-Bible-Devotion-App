import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types/navigation';
import { fetchDevotion, getTodayFallback } from '../../services/devotionService';
import { useDevotionReader } from '../../hooks/useDevotionReader';
import { Devotion, QUICK_TAGS, TRANSLATIONS, BibleTranslation } from '../../types/devotion';
import {
  markTodayComplete,
  getStreakData,
} from '../../services/devotionStreakService';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'Devotion'>;
type RouteP = RouteProp<HomeStackParamList, 'Devotion'>;

// ─── Colors ─────────────────────────────────────────────────────────────────

const C = {
  gold: '#D4AF37',
  goldDim: 'rgba(212,175,55,0.12)',
  goldBorder: 'rgba(212,175,55,0.35)',
  text: '#F0EFE9',
  textSub: '#8B8FA8',
  textMuted: '#555870',
  glass: 'rgba(16,14,28,0.82)',
  glassBorder: 'rgba(255,255,255,0.1)',
  glassHighlight: 'rgba(255,255,255,0.18)',
  warmTint: 'rgba(72,38,8,0.28)',
};

// ─── Breathing Timer ─────────────────────────────────────────────────────────

const BREATH_PHASES = [
  { label: 'Inhale', seconds: 4, toScale: 1.45 },
  { label: 'Hold',   seconds: 4, toScale: 1.45 },
  { label: 'Exhale', seconds: 4, toScale: 1.0  },
  { label: 'Hold',   seconds: 4, toScale: 1.0  },
];

function BreathingTimer() {
  const [active, setActive] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [countdown, setCountdown] = useState(BREATH_PHASES[0].seconds);
  const scale = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeRef = useRef(BREATH_PHASES[0].seconds);
  const phaseRef = useRef(0);

  const runPhase = useCallback((idx: number) => {
    phaseRef.current = idx;
    const phase = BREATH_PHASES[idx];
    timeRef.current = phase.seconds;
    setPhaseIdx(idx);
    setCountdown(phase.seconds);

    Animated.timing(scale, {
      toValue: phase.toScale,
      duration: phase.seconds * 1000,
      useNativeDriver: true,
    }).start();

    intervalRef.current = setInterval(() => {
      timeRef.current -= 1;
      setCountdown(timeRef.current);
      if (timeRef.current <= 0) {
        clearInterval(intervalRef.current!);
        const next = (phaseRef.current + 1) % BREATH_PHASES.length;
        runPhase(next);
      }
    }, 1000);
  }, [scale]);

  function start() {
    setActive(true);
    runPhase(0);
  }

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
    <View style={s.breathCard}>
      <View style={s.breathCardHighlight} pointerEvents="none" />
      <Text style={s.sectionLabel}>PRAYER BREATHING</Text>
      <Text style={s.breathSubtitle}>Box breathing • 4-4-4-4</Text>

      <View style={s.breathCircleWrap}>
        {/* Outer ring */}
        <View style={s.breathRingOuter} />
        {/* Animated fill */}
        <Animated.View style={[s.breathCircle, { transform: [{ scale }] }]}>
          <LinearGradient
            colors={['rgba(212,175,55,0.3)', 'rgba(212,175,55,0.08)']}
            style={s.breathGradient}
          />
          <Text style={s.breathPhaseLabel}>{active ? phase.label : 'Begin'}</Text>
          {active && <Text style={s.breathCountdown}>{countdown}</Text>}
        </Animated.View>
      </View>

      <TouchableOpacity
        style={[s.breathBtn, active && s.breathBtnStop]}
        onPress={active ? stop : start}
        activeOpacity={0.8}
      >
        <Text style={s.breathBtnText}>{active ? 'Stop' : 'Start'}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Streak Board ─────────────────────────────────────────────────────────────

type WeekDay = { dateStr: string; label: string; dayNum: number; completed: boolean; isToday: boolean };

function StreakBoard({ refreshTrigger }: { refreshTrigger: number }) {
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);

  useEffect(() => {
    getStreakData().then(d => {
      setStreak(d.streak);
      setTotal(d.total);
      setWeekDays(d.weekDays);
    });
  }, [refreshTrigger]);

  return (
    <View style={s.streakCard}>
      <View style={s.streakCardHighlight} pointerEvents="none" />

      <View style={s.streakTopRow}>
        <View>
          <Text style={s.sectionLabel}>THIS WEEK</Text>
          <Text style={s.streakLine}>
            {streak > 0 ? `🔥 ${streak}-day streak` : 'Start your streak today'}
          </Text>
        </View>
        <View style={s.streakBadge}>
          <Text style={s.streakBadgeNum}>{total}</Text>
          <Text style={s.streakBadgeLbl}>total</Text>
        </View>
      </View>

      <View style={s.weekRow}>
        {weekDays.map(day => (
          <View key={day.dateStr} style={s.dayCol}>
            <Text style={s.dayLabel}>{day.label}</Text>
            <View style={[
              s.dayCircle,
              day.isToday && s.dayCircleToday,
              day.completed && s.dayCircleDone,
            ]}>
              {day.completed
                ? <Text style={s.dayCheck}>✓</Text>
                : <Text style={[s.dayNum, day.isToday && s.dayNumToday]}>{day.dayNum}</Text>
              }
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Reader Controls ─────────────────────────────────────────────────────────

function ReaderControls({
  fontSz,
  speaking,
  copied,
  onFont,
  onTTS,
  onShare,
  onCopy,
}: {
  fontSz: string;
  speaking: boolean;
  copied: boolean;
  onFont: () => void;
  onTTS: () => void;
  onShare: () => void;
  onCopy: () => void;
}) {
  const items = [
    { icon: 'text', label: fontSz.toUpperCase(), onPress: onFont },
    { icon: speaking ? 'pause-circle' : 'volume-medium', label: speaking ? 'Stop' : 'Listen', onPress: onTTS },
    { icon: copied ? 'checkmark' : 'copy-outline', label: copied ? 'Copied!' : 'Copy', onPress: onCopy },
    { icon: 'share-outline', label: 'Share', onPress: onShare },
  ] as const;

  return (
    <BlurView intensity={45} tint="dark" style={s.readerControls}>
      <View style={s.readerControlsTint} pointerEvents="none" />
      {items.map(item => (
        <TouchableOpacity key={item.label} style={s.readerBtn} onPress={item.onPress} activeOpacity={0.75}>
          <Ionicons name={item.icon as any} size={18} color={C.gold} />
          <Text style={s.readerBtnLabel}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </BlurView>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function DevotionScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteP>();

  const initialTopic = route.params?.topic ?? '';
  const [topic, setTopic] = useState(initialTopic);
  const [translation, setTranslation] = useState<BibleTranslation>('NIV');
  const [devotion, setDevotion] = useState<Devotion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streakTrigger, setStreakTrigger] = useState(0);
  const [markedToday, setMarkedToday] = useState(false);

  const reader = useDevotionReader(devotion);

  // Load today's devotion on first mount
  useEffect(() => {
    const today = getTodayFallback();
    setDevotion(today);
  }, []);

  async function generate() {
    if (!topic.trim()) return;
    reader.stopTTS();
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDevotion(topic.trim(), translation);
      setDevotion(result);
    } catch {
      setError('Could not generate devotion. Using a local reading instead.');
      setDevotion(getTodayFallback());
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkComplete() {
    if (markedToday) return;
    await markTodayComplete();
    setMarkedToday(true);
    setStreakTrigger(t => t + 1);
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
    <LinearGradient colors={['#3D2108', '#080604', '#0A0714']} locations={[0, 0.45, 1]} style={{ flex: 1 }}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>DAILY DEVOTION</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Topic Input ── */}
          <View style={s.topicCard}>
            <View style={s.topicCardHighlight} pointerEvents="none" />
            <Text style={s.topicCardLabel}>WHAT'S ON YOUR HEART?</Text>

            <View style={s.inputRow}>
              <Ionicons name="search-outline" size={16} color={C.textMuted} style={s.inputIcon} />
              <TextInput
                style={s.topicInput}
                value={topic}
                onChangeText={setTopic}
                placeholder="peace, anxiety, forgiveness…"
                placeholderTextColor={C.textMuted}
                returnKeyType="go"
                onSubmitEditing={generate}
              />
              {topic.length > 0 && (
                <TouchableOpacity onPress={() => setTopic('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={16} color={C.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Quick tags */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tagsScroll} contentContainerStyle={s.tagsRow}>
              {QUICK_TAGS.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[s.tagChip, topic.toLowerCase() === tag.toLowerCase() && s.tagChipActive]}
                  onPress={() => setTopic(tag)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.tagChipText, topic.toLowerCase() === tag.toLowerCase() && s.tagChipTextActive]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Translation */}
            <View style={s.translationRow}>
              <Text style={s.translationLabel}>Translation</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {TRANSLATIONS.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[s.transBtn, translation === t && s.transBtnActive]}
                    onPress={() => setTranslation(t)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.transBtnText, translation === t && s.transBtnTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={[s.generateBtn, (!topic.trim() || loading) && s.generateBtnDisabled]}
              onPress={generate}
              disabled={!topic.trim() || loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color="#080604" size="small" />
                : <Text style={s.generateBtnText}>✦  Generate Devotion</Text>
              }
            </TouchableOpacity>

            {error ? <Text style={s.errorNote}>{error}</Text> : null}
          </View>

          {/* ── Devotion Content ── */}
          {devotion && (
            <>
              {/* Scripture card */}
              <BlurView intensity={55} tint="dark" style={s.scriptureCard}>
                <View style={s.scriptureCardTint} pointerEvents="none" />
                <View style={s.scriptureCardHighlight} pointerEvents="none" />
                <Text style={s.devotionTitle}>{devotion.title}</Text>
                <View style={s.themeBadge}>
                  <Text style={s.themeBadgeText}>{devotion.keyTheme}</Text>
                </View>
                <View style={s.refRow}>
                  <Text style={s.refText}>{devotion.scriptureReference}</Text>
                </View>
                <Text style={s.scriptureBody}>"{devotion.scriptureText}"</Text>
              </BlurView>

              {/* Reader controls */}
              <ReaderControls
                fontSz={reader.fontSz}
                speaking={reader.speaking}
                copied={reader.copied}
                onFont={reader.cycleFontSize}
                onTTS={reader.toggleTTS}
                onShare={reader.shareScripture}
                onCopy={reader.copyScripture}
              />

              {/* Body */}
              <View style={s.bodyCard}>
                <View style={s.bodyCardHighlight} pointerEvents="none" />
                {devotion.devotionalBody.map((para, i) => (
                  <Text
                    key={i}
                    style={[s.bodyPara, { fontSize: reader.fontSize }, i < devotion.devotionalBody.length - 1 && s.bodyParaGap]}
                  >
                    {para}
                  </Text>
                ))}
              </View>

              {/* Life Application */}
              <View style={s.sectionCard}>
                <View style={s.sectionCardHighlight} pointerEvents="none" />
                <View style={s.sectionTitleRow}>
                  <Text style={s.sectionIcon}>🌱</Text>
                  <Text style={s.sectionTitle}>LIFE APPLICATION</Text>
                </View>
                <Text style={[s.sectionBody, { fontSize: reader.fontSize }]}>{devotion.lifeApplication}</Text>
              </View>

              {/* Reflection Question */}
              <View style={[s.sectionCard, s.sectionCardGold]}>
                <View style={s.sectionCardHighlight} pointerEvents="none" />
                <View style={s.sectionTitleRow}>
                  <Text style={s.sectionIcon}>💭</Text>
                  <Text style={[s.sectionTitle, { color: C.gold }]}>REFLECT</Text>
                </View>
                <Text style={[s.sectionBody, { fontSize: reader.fontSize, fontStyle: 'italic' }]}>
                  {devotion.reflectionQuestion}
                </Text>
              </View>

              {/* Guided Prayer */}
              <View style={[s.sectionCard, s.prayerCard]}>
                <View style={s.sectionCardHighlight} pointerEvents="none" />
                <View style={s.sectionTitleRow}>
                  <Text style={s.sectionIcon}>🙏</Text>
                  <Text style={s.sectionTitle}>GUIDED PRAYER</Text>
                </View>
                <Text style={[s.prayerBody, { fontSize: reader.fontSize }]}>{devotion.guidedPrayer}</Text>
              </View>

              {/* Shareable quote */}
              <View style={s.quoteCard}>
                <View style={s.quoteCardHighlight} pointerEvents="none" />
                <Text style={s.quoteText}>{devotion.shareableQuote}</Text>
              </View>

              {/* Mark complete + save */}
              <View style={s.actionRow}>
                <TouchableOpacity
                  style={[s.completeBtn, markedToday && s.completeBtnDone]}
                  onPress={handleMarkComplete}
                  disabled={markedToday}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={markedToday ? 'checkmark-circle' : 'checkmark-circle-outline'}
                    size={18}
                    color={markedToday ? '#080604' : C.gold}
                  />
                  <Text style={[s.completeBtnText, markedToday && s.completeBtnTextDone]}>
                    {markedToday ? 'Completed ✓' : 'Mark Complete'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.journalBtn} onPress={saveToJournal} activeOpacity={0.8}>
                  <Ionicons name="journal-outline" size={18} color={C.text} />
                  <Text style={s.journalBtnText}>Save to Journal</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── Streak Board ── */}
          <StreakBoard refreshTrigger={streakTrigger} />

          {/* ── Breathing Timer ── */}
          <BreathingTimer />

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1.8,
  },

  scrollContent: { paddingHorizontal: 18, paddingBottom: 130, gap: 16 },

  // ── Topic Card ──
  topicCard: {
    backgroundColor: C.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.glassBorder,
    padding: 18,
    overflow: 'hidden',
    gap: 14,
  },
  topicCardHighlight: {
    position: 'absolute', top: 0, left: 20, right: 20, height: 1,
    backgroundColor: C.glassHighlight, borderRadius: 1,
  },
  topicCardLabel: {
    fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 1.6,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, borderWidth: 1, borderColor: C.glassBorder,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  inputIcon: { marginRight: 8 },
  topicInput: { flex: 1, fontSize: 15, color: C.text },
  tagsScroll: { marginHorizontal: -18 },
  tagsRow: { paddingHorizontal: 18, gap: 8 },
  tagChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: C.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tagChipActive: { borderColor: C.goldBorder, backgroundColor: C.goldDim },
  tagChipText: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  tagChipTextActive: { color: C.gold },
  translationRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  translationLabel: { fontSize: 11, fontWeight: '600', color: C.textMuted },
  transBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1, borderColor: C.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  transBtnActive: { borderColor: C.goldBorder, backgroundColor: C.goldDim },
  transBtnText: { fontSize: 12, fontWeight: '700', color: C.textMuted, letterSpacing: 0.4 },
  transBtnTextActive: { color: C.gold },
  generateBtn: {
    backgroundColor: C.gold, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
  },
  generateBtnDisabled: { opacity: 0.42 },
  generateBtnText: { fontSize: 15, fontWeight: '700', color: '#0A0704', letterSpacing: 0.3 },
  errorNote: { fontSize: 12, color: C.textMuted, textAlign: 'center' },

  // ── Scripture Card ──
  scriptureCard: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: C.goldBorder,
    padding: 20, gap: 12,
  },
  scriptureCardTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(72,38,8,0.35)',
  },
  scriptureCardHighlight: {
    position: 'absolute', top: 0, left: 20, right: 20, height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1,
  },
  devotionTitle: {
    fontSize: 20, fontWeight: '700', color: C.text, lineHeight: 27,
  },
  themeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.goldDim, borderRadius: 6, borderWidth: 1,
    borderColor: C.goldBorder, paddingHorizontal: 10, paddingVertical: 4,
  },
  themeBadgeText: { fontSize: 10, fontWeight: '800', color: C.gold, letterSpacing: 1.2 },
  refRow: { flexDirection: 'row', alignItems: 'center' },
  refText: { fontSize: 13, fontWeight: '700', color: C.gold },
  scriptureBody: {
    fontSize: 15, color: C.text, lineHeight: 24, fontStyle: 'italic',
  },

  // ── Reader Controls ──
  readerControls: {
    flexDirection: 'row', borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: C.glassBorder,
  },
  readerControlsTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(72,38,8,0.22)',
  },
  readerBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 4,
  },
  readerBtnLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted, letterSpacing: 0.4 },

  // ── Body Card ──
  bodyCard: {
    backgroundColor: C.glass, borderRadius: 20,
    borderWidth: 1, borderColor: C.glassBorder,
    padding: 20, overflow: 'hidden',
  },
  bodyCardHighlight: {
    position: 'absolute', top: 0, left: 20, right: 20, height: 1,
    backgroundColor: C.glassHighlight, borderRadius: 1,
  },
  bodyPara: { color: C.text, lineHeight: 26 },
  bodyParaGap: { marginBottom: 16 },

  // ── Section Cards ──
  sectionCard: {
    backgroundColor: C.glass, borderRadius: 18,
    borderWidth: 1, borderColor: C.glassBorder,
    padding: 18, overflow: 'hidden', gap: 10,
  },
  sectionCardGold: { borderColor: C.goldBorder },
  sectionCardHighlight: {
    position: 'absolute', top: 0, left: 16, right: 16, height: 1,
    backgroundColor: C.glassHighlight, borderRadius: 1,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: C.textMuted, letterSpacing: 1.6 },
  sectionBody: { color: C.text, lineHeight: 24 },

  prayerCard: { backgroundColor: 'rgba(24,16,6,0.9)' },
  prayerBody: { color: C.textSub, lineHeight: 26, fontStyle: 'italic' },

  // ── Quote Card ──
  quoteCard: {
    backgroundColor: C.goldDim, borderRadius: 16,
    borderWidth: 1, borderColor: C.goldBorder,
    padding: 18, overflow: 'hidden',
    alignItems: 'center',
  },
  quoteCardHighlight: {
    position: 'absolute', top: 0, left: 16, right: 16, height: 1,
    backgroundColor: 'rgba(212,175,55,0.4)', borderRadius: 1,
  },
  quoteText: { fontSize: 14, color: C.gold, lineHeight: 22, textAlign: 'center', fontStyle: 'italic' },

  // ── Action Row ──
  actionRow: { flexDirection: 'row', gap: 10 },
  completeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: C.goldBorder, borderRadius: 14,
    paddingVertical: 13, backgroundColor: C.goldDim,
  },
  completeBtnDone: { backgroundColor: C.gold, borderColor: C.gold },
  completeBtnText: { fontSize: 14, fontWeight: '700', color: C.gold },
  completeBtnTextDone: { color: '#080604' },
  journalBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: C.glassBorder, borderRadius: 14,
    paddingVertical: 13, backgroundColor: C.glass,
  },
  journalBtnText: { fontSize: 14, fontWeight: '600', color: C.text },

  // ── Streak Card ──
  streakCard: {
    backgroundColor: C.glass, borderRadius: 20,
    borderWidth: 1, borderColor: C.glassBorder,
    padding: 18, overflow: 'hidden', gap: 14,
  },
  streakCardHighlight: {
    position: 'absolute', top: 0, left: 20, right: 20, height: 1,
    backgroundColor: C.glassHighlight, borderRadius: 1,
  },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 1.6 },
  streakTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streakLine: { fontSize: 14, fontWeight: '600', color: C.text, marginTop: 4 },
  streakBadge: {
    alignItems: 'center',
    backgroundColor: C.goldDim, borderRadius: 10,
    borderWidth: 1, borderColor: C.goldBorder,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  streakBadgeNum: { fontSize: 20, fontWeight: '800', color: C.gold },
  streakBadgeLbl: { fontSize: 9, fontWeight: '600', color: C.gold, letterSpacing: 0.8 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 6 },
  dayLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted },
  dayCircle: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1, borderColor: C.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  dayCircleToday: { borderColor: C.goldBorder, backgroundColor: C.goldDim },
  dayCircleDone: { backgroundColor: 'rgba(212,175,55,0.25)', borderColor: C.goldBorder },
  dayNum: { fontSize: 12, fontWeight: '600', color: C.textMuted },
  dayNumToday: { color: C.gold },
  dayCheck: { fontSize: 14, color: C.gold },

  // ── Breathing Timer ──
  breathCard: {
    backgroundColor: C.glass, borderRadius: 20,
    borderWidth: 1, borderColor: C.glassBorder,
    padding: 20, overflow: 'hidden',
    alignItems: 'center', gap: 6,
  },
  breathCardHighlight: {
    position: 'absolute', top: 0, left: 20, right: 20, height: 1,
    backgroundColor: C.glassHighlight, borderRadius: 1,
  },
  breathSubtitle: { fontSize: 12, color: C.textMuted, marginTop: 2, marginBottom: 16 },
  breathCircleWrap: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  breathRingOuter: {
    position: 'absolute',
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)',
  },
  breathCircle: {
    width: 90, height: 90, borderRadius: 45,
    overflow: 'hidden',
    borderWidth: 1, borderColor: C.goldBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  breathGradient: { ...StyleSheet.absoluteFillObject },
  breathPhaseLabel: { fontSize: 13, fontWeight: '700', color: C.text },
  breathCountdown: { fontSize: 24, fontWeight: '800', color: C.gold, marginTop: -2 },
  breathBtn: {
    marginTop: 8,
    paddingHorizontal: 36, paddingVertical: 11,
    backgroundColor: C.goldDim, borderRadius: 12,
    borderWidth: 1, borderColor: C.goldBorder,
  },
  breathBtnStop: { backgroundColor: 'rgba(200,60,60,0.15)', borderColor: 'rgba(200,60,60,0.35)' },
  breathBtnText: { fontSize: 14, fontWeight: '700', color: C.gold },
});
