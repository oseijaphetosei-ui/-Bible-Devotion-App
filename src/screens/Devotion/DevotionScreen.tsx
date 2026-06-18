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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types/navigation';
import { fetchDevotion, getTodayFallback } from '../../services/devotionService';
import { useDevotionReader } from '../../hooks/useDevotionReader';
import { Devotion, QUICK_TAGS, TRANSLATIONS, BibleTranslation } from '../../types/devotion';
import { markTodayComplete, getStreakData } from '../../services/devotionStreakService';
import { useTheme } from '../../theme';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'Devotion'>;
type RouteP = RouteProp<HomeStackParamList, 'Devotion'>;

// ─── Breathing Timer ─────────────────────────────────────────────────────────

const BREATH_PHASES = [
  { label: 'Inhale', seconds: 4, toScale: 1.45 },
  { label: 'Hold',   seconds: 4, toScale: 1.45 },
  { label: 'Exhale', seconds: 4, toScale: 1.0  },
  { label: 'Hold',   seconds: 4, toScale: 1.0  },
];

function BreathingTimer({ gold, goldBg, goldBorder, card, cardBorder, text, textMuted }: {
  gold: string; goldBg: string; goldBorder: string;
  card: string; cardBorder: string; text: string; textMuted: string;
}) {
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
    <View style={[s.card, { backgroundColor: card, borderColor: cardBorder }]}>
      <Text style={[s.sectionLabel, { color: textMuted }]}>PRAYER BREATHING</Text>
      <Text style={[s.breathSubtitle, { color: textMuted }]}>Box breathing · 4-4-4-4</Text>

      <View style={s.breathCircleWrap}>
        <View style={[s.breathRingOuter, { borderColor: goldBorder }]} />
        <Animated.View style={[s.breathCircle, { transform: [{ scale }], backgroundColor: goldBg, borderColor: goldBorder }]}>
          <Text style={[s.breathPhaseLabel, { color: text }]}>{active ? phase.label : 'Begin'}</Text>
          {active && <Text style={[s.breathCountdown, { color: gold }]}>{countdown}</Text>}
        </Animated.View>
      </View>

      <TouchableOpacity
        style={[
          s.breathBtn,
          { backgroundColor: goldBg, borderColor: goldBorder },
          active && { backgroundColor: 'rgba(220,38,38,0.08)', borderColor: 'rgba(220,38,38,0.2)' },
        ]}
        onPress={active ? stop : start}
        activeOpacity={0.8}
      >
        <Text style={[s.breathBtnText, { color: active ? '#DC2626' : gold }]}>
          {active ? 'Stop' : 'Start'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Streak Board ─────────────────────────────────────────────────────────────

type WeekDay = { dateStr: string; label: string; dayNum: number; completed: boolean; isToday: boolean };

function StreakBoard({ refreshTrigger, gold, goldBg, goldBorder, text, textMuted, weekCircleBg, weekCircleBorder, weekCircleActiveBg }: {
  refreshTrigger: number;
  gold: string; goldBg: string; goldBorder: string;
  text: string; textMuted: string;
  weekCircleBg: string; weekCircleBorder: string; weekCircleActiveBg: string;
}) {
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);

  useEffect(() => {
    getStreakData().then(d => { setStreak(d.streak); setTotal(d.total); setWeekDays(d.weekDays); });
  }, [refreshTrigger]);

  return (
    <View style={s.bareSection}>
      <View style={s.streakTopRow}>
        <View>
          <Text style={[s.sectionLabel, { color: textMuted }]}>THIS WEEK</Text>
          <Text style={[s.streakLine, { color: text }]}>
            {streak > 0 ? `🔥 ${streak}-day streak` : 'Start your streak today'}
          </Text>
        </View>
        <View style={[s.streakBadge, { backgroundColor: goldBg, borderColor: goldBorder }]}>
          <Text style={[s.streakBadgeNum, { color: gold }]}>{total}</Text>
          <Text style={[s.streakBadgeLbl, { color: gold }]}>total</Text>
        </View>
      </View>

      <View style={s.weekRow}>
        {weekDays.map(day => (
          <View key={day.dateStr} style={s.dayCol}>
            <Text style={[s.dayLabel, { color: textMuted }]}>{day.label}</Text>
            <View style={[
              s.dayCircle,
              { backgroundColor: weekCircleBg, borderColor: weekCircleBorder },
              day.isToday && { backgroundColor: weekCircleActiveBg, borderColor: goldBorder },
              day.completed && { backgroundColor: goldBg, borderColor: goldBorder },
            ]}>
              {day.completed
                ? <Text style={[s.dayCheck, { color: gold }]}>✓</Text>
                : <Text style={[s.dayNum, { color: textMuted }, day.isToday && { color: gold }]}>{day.dayNum}</Text>
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
  fontSz, speaking, copied, gold, goldBg, goldBorder, textMuted,
  onFont, onTTS, onShare, onCopy,
}: {
  fontSz: string; speaking: boolean; copied: boolean;
  gold: string; goldBg: string; goldBorder: string; textMuted: string;
  onFont: () => void; onTTS: () => void; onShare: () => void; onCopy: () => void;
}) {
  const items = [
    { icon: 'text', label: fontSz.toUpperCase(), onPress: onFont },
    { icon: speaking ? 'pause-circle' : 'volume-medium', label: speaking ? 'Stop' : 'Listen', onPress: onTTS },
    { icon: copied ? 'checkmark' : 'copy-outline', label: copied ? 'Copied!' : 'Copy', onPress: onCopy },
    { icon: 'share-outline', label: 'Share', onPress: onShare },
  ] as const;

  return (
    <View style={[s.readerControls, { backgroundColor: goldBg, borderColor: goldBorder }]}>
      {items.map(item => (
        <TouchableOpacity key={item.label} style={s.readerBtn} onPress={item.onPress} activeOpacity={0.75}>
          <Ionicons name={item.icon as any} size={18} color={gold} />
          <Text style={[s.readerBtnLabel, { color: textMuted }]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function DevotionScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteP>();
  const t = useTheme();

  const initialTopic = route.params?.topic ?? '';
  const [topic, setTopic] = useState(initialTopic);
  const [translation, setTranslation] = useState<BibleTranslation>('KJV');
  const [devotion, setDevotion] = useState<Devotion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streakTrigger, setStreakTrigger] = useState(0);
  const [markedToday, setMarkedToday] = useState(false);

  const reader = useDevotionReader(devotion);

  useEffect(() => { setDevotion(getTodayFallback()); }, []);

  async function generate() {
    if (!topic.trim()) return;
    reader.stopTTS();
    setLoading(true);
    setError(null);
    try {
      setDevotion(await fetchDevotion(topic.trim(), translation));
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

        {/* Header */}
        <View style={[s.header, { borderBottomColor: t.divider }]}>
          <TouchableOpacity
            style={[s.backBtn, { backgroundColor: t.inputBg, borderColor: t.cardBorder }]}
            onPress={() => navigation.goBack()} activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={t.text} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: t.textMuted }]}>DAILY DEVOTION</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Topic Input ── */}
          <View style={[s.card, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            <Text style={[s.topicCardLabel, { color: t.textMuted }]}>WHAT'S ON YOUR HEART?</Text>

            <View style={[s.inputRow, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
              <Ionicons name="search-outline" size={16} color={t.textMuted} style={s.inputIcon} />
              <TextInput
                style={[s.topicInput, { color: t.text }]}
                value={topic}
                onChangeText={setTopic}
                placeholder="peace, anxiety, forgiveness…"
                placeholderTextColor={t.textMuted}
                returnKeyType="go"
                onSubmitEditing={generate}
              />
              {topic.length > 0 && (
                <TouchableOpacity onPress={() => setTopic('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={16} color={t.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Quick tags */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tagsScroll} contentContainerStyle={s.tagsRow}>
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
                    <Text style={[s.tagChipText, { color: t.textMuted }, isActive && { color: t.gold }]}>{tag}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Translation */}
            <View style={s.translationRow}>
              <Text style={[s.translationLabel, { color: t.textMuted }]}>Translation</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {TRANSLATIONS.map(tr => (
                  <TouchableOpacity
                    key={tr}
                    style={[
                      s.transBtn,
                      { borderColor: t.chipBorder, backgroundColor: t.chipBg },
                      translation === tr && { borderColor: t.goldBorder, backgroundColor: t.goldBg },
                    ]}
                    onPress={() => setTranslation(tr)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.transBtnText, { color: t.textMuted }, translation === tr && { color: t.gold }]}>{tr}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={[s.generateBtn, { backgroundColor: t.gold }, (!topic.trim() || loading) && s.generateBtnDisabled]}
              onPress={generate}
              disabled={!topic.trim() || loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color={t.bg} size="small" />
                : <Text style={[s.generateBtnText, { color: t.bg }]}>✦  Generate Devotion</Text>
              }
            </TouchableOpacity>

            {error ? <Text style={[s.errorNote, { color: t.textMuted }]}>{error}</Text> : null}
          </View>

          {/* ── Devotion Content ── */}
          {devotion && (
            <>
              {/* Scripture card */}
              <View style={[s.scriptureCard, { backgroundColor: t.card, borderColor: t.goldBorder }]}>
                <Text style={[s.devotionTitle, { color: t.text }]}>{devotion.title}</Text>
                <View style={[s.themeBadge, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}>
                  <Text style={[s.themeBadgeText, { color: t.gold }]}>{devotion.keyTheme}</Text>
                </View>
                <Text style={[s.refText, { color: t.gold }]}>{devotion.scriptureReference}</Text>
                <Text style={[s.scriptureBody, { color: t.textSub }]}>"{devotion.scriptureText}"</Text>
              </View>

              {/* Reader controls */}
              <ReaderControls
                fontSz={reader.fontSz}
                speaking={reader.speaking}
                copied={reader.copied}
                gold={t.gold}
                goldBg={t.goldBg}
                goldBorder={t.goldBorder}
                textMuted={t.textMuted}
                onFont={reader.cycleFontSize}
                onTTS={reader.toggleTTS}
                onShare={reader.shareScripture}
                onCopy={reader.copyScripture}
              />

              {/* Body — directly on background */}
              <View style={s.bareSection}>
                {devotion.devotionalBody.map((para, i) => (
                  <Text
                    key={i}
                    style={[s.bodyPara, { fontSize: reader.fontSize, color: t.text }, i < devotion.devotionalBody.length - 1 && s.bodyParaGap]}
                  >{para}</Text>
                ))}
              </View>

              <View style={[s.divider, { backgroundColor: t.divider }]} />

              {/* Life Application — directly on background */}
              <View style={s.bareSection}>
                <View style={s.sectionTitleRow}>
                  <Text style={s.sectionIcon}>🌱</Text>
                  <Text style={[s.sectionTitle, { color: t.textMuted }]}>LIFE APPLICATION</Text>
                </View>
                <Text style={[s.sectionBody, { fontSize: reader.fontSize, color: t.text }]}>{devotion.lifeApplication}</Text>
              </View>

              <View style={[s.divider, { backgroundColor: t.divider }]} />

              {/* Reflection — directly on background */}
              <View style={s.bareSection}>
                <View style={s.sectionTitleRow}>
                  <Text style={s.sectionIcon}>💭</Text>
                  <Text style={[s.sectionTitle, { color: t.gold }]}>REFLECT</Text>
                </View>
                <Text style={[s.sectionBody, { fontSize: reader.fontSize, color: t.textSub, fontStyle: 'italic' }]}>
                  {devotion.reflectionQuestion}
                </Text>
              </View>

              <View style={[s.divider, { backgroundColor: t.divider }]} />

              {/* Prayer — directly on background */}
              <View style={s.bareSection}>
                <View style={s.sectionTitleRow}>
                  <Text style={s.sectionIcon}>🙏</Text>
                  <Text style={[s.sectionTitle, { color: t.textMuted }]}>GUIDED PRAYER</Text>
                </View>
                <Text style={[s.sectionBody, { fontSize: reader.fontSize, color: t.textSub, fontStyle: 'italic' }]}>
                  {devotion.guidedPrayer}
                </Text>
              </View>

              {/* Quote — inline gold text, no card */}
              <Text style={[s.quoteText, { color: t.gold }]}>{devotion.shareableQuote}</Text>

              {/* Actions */}
              <View style={s.actionRow}>
                <TouchableOpacity
                  style={[
                    s.completeBtn,
                    { borderColor: t.goldBorder, backgroundColor: t.goldBg },
                    markedToday && { backgroundColor: t.gold, borderColor: t.gold },
                  ]}
                  onPress={handleMarkComplete}
                  disabled={markedToday}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={markedToday ? 'checkmark-circle' : 'checkmark-circle-outline'}
                    size={18}
                    color={markedToday ? t.bg : t.gold}
                  />
                  <Text style={[s.completeBtnText, { color: t.gold }, markedToday && { color: t.bg }]}>
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
          <StreakBoard
            refreshTrigger={streakTrigger}
            gold={t.gold} goldBg={t.goldBg} goldBorder={t.goldBorder}
            text={t.text} textMuted={t.textMuted}
            weekCircleBg={t.weekCircleBg} weekCircleBorder={t.weekCircleBorder}
            weekCircleActiveBg={t.weekCircleActiveBg}
          />
          <BreathingTimer
            gold={t.gold} goldBg={t.goldBg} goldBorder={t.goldBorder}
            card={t.card} cardBorder={t.cardBorder} text={t.text} textMuted={t.textMuted}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 11, fontWeight: '700', letterSpacing: 1.8,
  },

  scrollContent: { paddingHorizontal: 18, paddingBottom: 130, gap: 14 },

  // Bare content — no card, sits directly on background
  bareSection: { gap: 10 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 2 },

  // Shared card base
  card: {
    borderRadius: 16, borderWidth: 1, padding: 18,
    gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },

  // Topic
  topicCardLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  inputIcon: { marginRight: 8 },
  topicInput: { flex: 1, fontSize: 15 },
  tagsScroll: { marginHorizontal: -18 },
  tagsRow: { paddingHorizontal: 18, gap: 8 },
  tagChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  tagChipText: { fontSize: 13, fontWeight: '600' },
  translationRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  translationLabel: { fontSize: 11, fontWeight: '600' },
  transBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1,
  },
  transBtnText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  generateBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  generateBtnDisabled: { opacity: 0.4 },
  generateBtnText: { fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  errorNote: { fontSize: 12, textAlign: 'center' },

  // Scripture card
  scriptureCard: {
    borderRadius: 16, borderWidth: 1, padding: 20, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  devotionTitle: { fontSize: 20, fontWeight: '700', lineHeight: 27 },
  themeBadge: {
    alignSelf: 'flex-start', borderRadius: 6, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  themeBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  refText: { fontSize: 13, fontWeight: '700' },
  scriptureBody: { fontSize: 15, lineHeight: 24, fontStyle: 'italic' },

  // Reader controls
  readerControls: {
    flexDirection: 'row', borderRadius: 14, borderWidth: 1,
  },
  readerBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 4,
  },
  readerBtnLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.4 },

  // Body
  bodyPara: { lineHeight: 26 },
  bodyParaGap: { marginBottom: 14 },

  // Sections
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  sectionBody: { lineHeight: 24 },

  // Quote
  quoteCard: {
    borderRadius: 16, borderWidth: 1, padding: 18,
    alignItems: 'center',
  },
  quoteText: { fontSize: 14, lineHeight: 22, textAlign: 'center', fontStyle: 'italic' },

  // Action row
  actionRow: { flexDirection: 'row', gap: 10 },
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
  streakTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.6 },
  streakLine: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  streakBadge: {
    alignItems: 'center', borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  streakBadgeNum: { fontSize: 20, fontWeight: '800' },
  streakBadgeLbl: { fontSize: 9, fontWeight: '600', letterSpacing: 0.8 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 6 },
  dayLabel: { fontSize: 10, fontWeight: '600' },
  dayCircle: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  dayNum: { fontSize: 12, fontWeight: '600' },
  dayCheck: { fontSize: 14 },

  // Breathing
  breathSubtitle: { fontSize: 12, marginTop: 2, marginBottom: 8 },
  breathCircleWrap: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginVertical: 8 },
  breathRingOuter: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 1,
  },
  breathCircle: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  breathPhaseLabel: { fontSize: 13, fontWeight: '700' },
  breathCountdown: { fontSize: 24, fontWeight: '800', marginTop: -2 },
  breathBtn: {
    alignSelf: 'center', marginTop: 8,
    paddingHorizontal: 36, paddingVertical: 11,
    borderRadius: 12, borderWidth: 1,
  },
  breathBtnText: { fontSize: 14, fontWeight: '700' },
});
