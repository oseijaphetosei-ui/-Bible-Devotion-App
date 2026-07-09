import React, { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Dimensions, Animated, Easing, ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../theme';
import {
  getActivePlan, getPlanById, getTodayReading,
  isTodayCompleted, planProgress, passageLabel,
} from '../../services/readingPlanService';
import { getSavedDisplayName } from '../../services/chatService';
import type { ActivePlan, ReadingDay, ReadingPlan } from '../../types/readingPlan';
import type { HomeStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = Math.round(SCREEN_W * 0.95);
const GOLD     = '#C9A96B';
const OFF_WHITE = '#F0EDE6';

const GLASS: ViewStyle = {
  backgroundColor: 'rgba(255,255,255,0.07)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.12)',
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5)  return 'Still Awake';
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

// ─── Cinematic Hero ───────────────────────────────────────────────────────────

const CinematicHero = memo(function CinematicHero({
  plan, activePlan, todayReading, label, completed,
  displayName, insets, onBack, onChangePlan,
}: {
  plan: ReadingPlan;
  activePlan: ActivePlan;
  todayReading: ReadingDay;
  label: string;
  completed: boolean;
  displayName: string;
  insets: ReturnType<typeof useSafeAreaInsets>;
  onBack: () => void;
  onChangePlan: () => void;
}) {
  const dateLabel = useMemo(() =>
    new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    }).toUpperCase(),
  []);
  const firstName = displayName.split(' ')[0] || '';

  return (
    <View style={{ height: HERO_H, overflow: 'hidden' }}>
      {/* Plan-unique gradient — atmospheric base */}
      <LinearGradient
        colors={[plan.gradient[0], plan.gradient[1]]}
        locations={[0, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Warm luminous bloom */}
      <View
        style={[StyleSheet.absoluteFillObject, { alignItems: 'center', paddingTop: HERO_H * 0.12 }]}
        pointerEvents="none"
      >
        <View style={heroS.glow} />
      </View>

      {/* Bottom cinematic scrim */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.86)']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top safety scrim */}
      <LinearGradient
        colors={['rgba(0,0,0,0.56)', 'rgba(0,0,0,0)']}
        locations={[0, 0.3]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Nav row */}
      <View style={[heroS.nav, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={heroS.navBtn}
          activeOpacity={0.75}
        >
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Ionicons name="chevron-back" size={22} color={OFF_WHITE} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onChangePlan}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={heroS.allPlansBtn}
          activeOpacity={0.75}
        >
          <BlurView
            intensity={30}
            tint="dark"
            style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
          />
          <Text style={heroS.allPlansBtnText}>All Plans</Text>
        </TouchableOpacity>
      </View>

      {/* Hero content — bottom-anchored */}
      <View style={heroS.content}>
        {/* Plan identity badge */}
        <View style={heroS.planBadge}>
          <Text style={heroS.planIcon}>{plan.icon}</Text>
          <Text style={heroS.planBadgeText} numberOfLines={1}>{plan.title}</Text>
        </View>

        {/* Date eyebrow */}
        <Text style={heroS.dateEyebrow}>{dateLabel}</Text>

        {/* Greeting */}
        <Text style={heroS.greetingText}>
          {getGreeting()}{firstName ? `, ${firstName}` : ''}.
        </Text>

        {/* Reading title — serif centrepiece */}
        <Text style={heroS.readingTitle}>{todayReading.title}</Text>

        {/* Meta chips */}
        <View style={heroS.chipRow}>
          <View style={heroS.chip}>
            <Ionicons name="book-outline" size={10} color={GOLD} />
            <Text style={[heroS.chipText, { color: GOLD }]}>{label}</Text>
          </View>
          <View style={heroS.chip}>
            <Ionicons name="time-outline" size={10} color="rgba(240,237,230,0.55)" />
            <Text style={heroS.chipText}>{todayReading.estimatedMinutes} min</Text>
          </View>
          <View style={heroS.chip}>
            <Ionicons name="layers-outline" size={10} color="rgba(240,237,230,0.55)" />
            <Text style={heroS.chipText}>
              Day {activePlan.currentDay} of {plan.totalDays}
            </Text>
          </View>
        </View>

        {/* Completed indicator */}
        {completed && (
          <View style={heroS.completedBadge}>
            <Ionicons name="checkmark-circle" size={13} color={GOLD} />
            <Text style={heroS.completedBadgeText}>Completed today</Text>
          </View>
        )}
      </View>
    </View>
  );
});

const heroS = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  allPlansBtn: {
    borderRadius: 16, overflow: 'hidden',
    paddingHorizontal: 14, paddingVertical: 7,
  },
  allPlansBtnText: {
    fontSize: 13, fontWeight: '500',
    color: 'rgba(240,237,230,0.68)',
    letterSpacing: 0.2,
  },
  glow: {
    width: SCREEN_W * 0.9,
    height: SCREEN_W * 0.9,
    borderRadius: (SCREEN_W * 0.9) / 2,
    backgroundColor: 'rgba(201,169,107,0.055)',
  },
  content: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(201,169,107,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(201,169,107,0.28)',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 5,
    marginBottom: 14,
  },
  planIcon: { fontSize: 12 },
  planBadgeText: {
    fontSize: 11, fontWeight: '600',
    color: 'rgba(201,169,107,0.90)',
    letterSpacing: 0.3,
    maxWidth: SCREEN_W * 0.6,
  },
  dateEyebrow: {
    fontSize: 10, fontWeight: '700',
    letterSpacing: 2.2,
    color: 'rgba(240,237,230,0.38)',
    marginBottom: 6,
  },
  greetingText: {
    fontSize: 13, fontWeight: '400',
    color: 'rgba(240,237,230,0.52)',
    letterSpacing: 0.2,
    marginBottom: 10,
  },
  readingTitle: {
    fontFamily: 'Georgia',
    fontSize: 36, fontWeight: '400',
    color: OFF_WHITE,
    lineHeight: 46,
    letterSpacing: -0.4,
    marginBottom: 18,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 11, fontWeight: '500',
    color: 'rgba(240,237,230,0.55)',
    letterSpacing: 0.2,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: 'rgba(201,169,107,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201,169,107,0.30)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  completedBadgeText: {
    fontSize: 11, fontWeight: '600',
    color: GOLD,
    letterSpacing: 0.3,
  },
});

// ─── Progress Section ─────────────────────────────────────────────────────────

const ProgressSection = memo(function ProgressSection({
  activePlan, plan, pct, completed,
}: {
  activePlan: ActivePlan;
  plan: ReadingPlan;
  pct: number;
  completed: boolean;
}) {
  const daysLeft = plan.totalDays - activePlan.currentDay + 1;

  const weekDots = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const dayNum = activePlan.currentDay - 6 + i;
      const valid   = dayNum >= 1 && dayNum <= plan.totalDays;
      const isToday = dayNum === activePlan.currentDay;
      const done    = valid && (
        activePlan.completedDays.includes(dayNum) ||
        (isToday && completed)
      );
      return { dayNum, valid, isToday, done };
    }),
  [activePlan, plan.totalDays, completed]);

  return (
    <View style={ps.container}>
      {/* 3-column stat strip */}
      <View style={ps.statRow}>
        <View style={ps.stat}>
          <View style={ps.statValueRow}>
            <Ionicons name="flame" size={14} color={GOLD} />
            <Text style={ps.statValue}>{activePlan.streak}</Text>
          </View>
          <Text style={ps.statLabel}>day streak</Text>
        </View>
        <View style={ps.statSep} />
        <View style={ps.stat}>
          <Text style={ps.statValue}>{pct}%</Text>
          <Text style={ps.statLabel}>complete</Text>
        </View>
        <View style={ps.statSep} />
        <View style={ps.stat}>
          <Text style={ps.statValue}>{daysLeft}</Text>
          <Text style={ps.statLabel}>{daysLeft === 1 ? 'day left' : 'days left'}</Text>
        </View>
      </View>

      {/* Weekly rhythm dots */}
      <View style={ps.weekBlock}>
        <Text style={ps.sectionLabel}>THIS WEEK</Text>
        <View style={ps.dotRow}>
          {weekDots.map(({ dayNum, valid, isToday, done }) => (
            <View
              key={dayNum}
              style={[
                ps.dot,
                !valid    && ps.dotEmpty,
                valid && !done && !isToday && ps.dotMissed,
                isToday && !done && ps.dotToday,
                done && ps.dotDone,
              ]}
            >
              {done ? (
                <Ionicons name="checkmark" size={10} color="#060810" />
              ) : isToday ? (
                <View style={ps.dotTodayCore} />
              ) : null}
            </View>
          ))}
        </View>
      </View>

      {/* Plan progress bar */}
      <View>
        <Text style={ps.sectionLabel}>PLAN PROGRESS</Text>
        <View style={ps.progressTrack}>
          <View style={[ps.progressFill, { width: `${pct}%` as any }]} />
        </View>
        <View style={ps.progressMeta}>
          <Text style={ps.progressText}>{pct}% · Day {activePlan.currentDay} of {plan.totalDays}</Text>
        </View>
      </View>
    </View>
  );
});

const ps = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    marginTop: 20,
    borderRadius: 22,
    overflow: 'hidden',
    padding: 20,
    ...GLASS,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    marginBottom: 20,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24, fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: -0.4,
  },
  statLabel: {
    fontSize: 10, fontWeight: '500',
    color: 'rgba(240,237,230,0.35)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  statSep: {
    width: 1, height: 36,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  weekBlock: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 9, fontWeight: '700',
    letterSpacing: 1.8,
    color: 'rgba(240,237,230,0.25)',
    marginBottom: 10,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 30, height: 30,
    borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  dotEmpty: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  dotMissed: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  dotToday: {
    backgroundColor: 'rgba(201,169,107,0.10)',
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  dotTodayCore: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: GOLD,
    opacity: 0.7,
  },
  dotDone: {
    backgroundColor: GOLD,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: GOLD,
  },
  progressMeta: {
    marginTop: 7,
  },
  progressText: {
    fontSize: 10, fontWeight: '500',
    color: 'rgba(240,237,230,0.28)',
    letterSpacing: 0.3,
  },
});

// ─── Reflection Card ──────────────────────────────────────────────────────────

const ReflectionCard = memo(function ReflectionCard({
  todayReading, plan,
}: {
  todayReading: ReadingDay;
  plan: ReadingPlan;
}) {
  const [expanded, setExpanded] = useState(false);
  const label = passageLabel(todayReading.passages);

  return (
    <View style={[rc.container, GLASS]}>
      {/* Gold left accent bar */}
      <View style={rc.accentBar} />

      <View style={rc.inner}>
        {/* Eyebrow */}
        <View style={rc.eyebrowRow}>
          <Ionicons name="sparkles-outline" size={12} color={GOLD} />
          <Text style={rc.eyebrow}>TODAY'S REFLECTION</Text>
        </View>

        {/* Passage reference */}
        <Text style={rc.passageRef}>{label}</Text>

        {/* Reflection text — serif */}
        <Text
          style={rc.reflectionText}
          numberOfLines={expanded ? undefined : 4}
        >
          "{todayReading.reflection}"
        </Text>

        {/* Read more / less */}
        <TouchableOpacity
          onPress={() => setExpanded(e => !e)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Text style={rc.expandText}>
            {expanded ? 'Show less' : 'Read more'}
          </Text>
        </TouchableOpacity>

        {/* Plan attribution */}
        <View style={rc.attribRow}>
          <View style={rc.attribDivider} />
          <Text style={rc.planAttrib}>{plan.title}</Text>
        </View>
      </View>
    </View>
  );
});

const rc = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    marginTop: 16,
    borderRadius: 22,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accentBar: {
    width: 3,
    backgroundColor: GOLD,
    opacity: 0.65,
  },
  inner: {
    flex: 1,
    padding: 20,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  eyebrow: {
    fontSize: 9, fontWeight: '700',
    letterSpacing: 1.8,
    color: 'rgba(201,169,107,0.72)',
  },
  passageRef: {
    fontSize: 11, fontWeight: '600',
    letterSpacing: 1.2,
    color: 'rgba(201,169,107,0.55)',
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  reflectionText: {
    fontFamily: 'Georgia',
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '400',
    color: 'rgba(240,237,230,0.86)',
    lineHeight: 27,
    letterSpacing: 0.1,
    marginBottom: 12,
  },
  expandText: {
    fontSize: 12, fontWeight: '500',
    color: 'rgba(201,169,107,0.55)',
    letterSpacing: 0.3,
    marginBottom: 16,
  },
  attribRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  attribDivider: {
    width: 24, height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  planAttrib: {
    fontSize: 11, fontWeight: '500',
    color: 'rgba(240,237,230,0.28)',
    letterSpacing: 0.3,
  },
});

// ─── AI Companion Strip ───────────────────────────────────────────────────────

const AI_CARDS: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  type: 'insights' | 'chat';
}[] = [
  { icon: 'sparkles-outline',           label: 'Explain passage',     sub: 'AI insights',      type: 'insights' },
  { icon: 'time-outline',               label: 'Historical context',  sub: 'Background',       type: 'insights' },
  { icon: 'git-branch-outline',         label: 'Cross-references',    sub: 'Related Scripture',type: 'insights' },
  { icon: 'chatbubble-ellipses-outline',label: 'Ask AI anything',     sub: 'Open chat',        type: 'chat'     },
  { icon: 'heart-outline',              label: 'Suggested prayer',    sub: 'For today',        type: 'insights' },
];

const AICompanionStrip = memo(function AICompanionStrip({
  onInsights, onChat,
}: {
  onInsights: () => void;
  onChat: () => void;
}) {
  return (
    <View style={ai.section}>
      <View style={ai.headerRow}>
        <Ionicons name="sparkles-outline" size={12} color={GOLD} />
        <Text style={ai.header}>AI COMPANION</Text>
        <Text style={ai.headerSub}>Tap to explore</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={ai.scrollContent}
        decelerationRate="fast"
      >
        {AI_CARDS.map((card) => (
          <TouchableOpacity
            key={card.label}
            style={[ai.card, GLASS as any]}
            activeOpacity={0.80}
            onPress={card.type === 'chat' ? onChat : onInsights}
          >
            <View style={ai.cardIconBox}>
              <Ionicons name={card.icon} size={18} color={GOLD} />
            </View>
            <Text style={ai.cardLabel}>{card.label}</Text>
            <Text style={ai.cardSub}>{card.sub}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
});

const ai = StyleSheet.create({
  section: {
    marginTop: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  header: {
    fontSize: 9, fontWeight: '700',
    letterSpacing: 1.8,
    color: 'rgba(201,169,107,0.62)',
  },
  headerSub: {
    fontSize: 10, fontWeight: '400',
    color: 'rgba(240,237,230,0.22)',
    marginLeft: 4,
    letterSpacing: 0.2,
  },
  scrollContent: {
    paddingHorizontal: 18,
    gap: 10,
  },
  card: {
    width: 128,
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  cardIconBox: {
    width: 38, height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(201,169,107,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(201,169,107,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 12, fontWeight: '600',
    color: OFF_WHITE,
    lineHeight: 17,
  },
  cardSub: {
    fontSize: 10, fontWeight: '500',
    color: 'rgba(240,237,230,0.35)',
    letterSpacing: 0.2,
  },
});

// ─── Completion Section ───────────────────────────────────────────────────────

const CompletionSection = memo(function CompletionSection({
  activePlan, onReadAgain, onPrayerJournal, onDevotion, onAIChat,
}: {
  activePlan: ActivePlan;
  onReadAgain: () => void;
  onPrayerJournal: () => void;
  onDevotion: () => void;
  onAIChat: () => void;
}) {
  const scaleAnim   = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim,   { toValue: 1,   tension: 65, friction: 10, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 480, useNativeDriver: true }),
    ]).start();
  }, []);

  const next = [
    { icon: 'heart-outline' as const,         label: 'Prayer Journal', color: '#C47B8A',  onPress: onPrayerJournal },
    { icon: 'sunny-outline' as const,          label: 'Daily Devotion', color: '#6E8B74',  onPress: onDevotion },
    { icon: 'chatbubble-ellipses-outline' as const, label: 'Discuss with AI', color: GOLD, onPress: onAIChat },
  ];

  return (
    <Animated.View
      style={[
        cs.container,
        GLASS,
        { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      {/* Gold checkmark ring */}
      <View style={cs.ringArea}>
        <View style={cs.ringOuter} />
        <View style={cs.ringInner}>
          <Ionicons name="checkmark" size={30} color="#060810" />
        </View>
      </View>

      {/* Headline */}
      <Text style={cs.headline}>Reading Complete</Text>

      {/* Streak celebration */}
      {activePlan.streak > 0 && (
        <View style={cs.streakBadge}>
          <Ionicons name="flame" size={13} color={GOLD} />
          <Text style={cs.streakText}>{activePlan.streak}-day streak · Keep going!</Text>
        </View>
      )}

      {/* Divider */}
      <View style={cs.divider} />

      {/* What's next */}
      <Text style={cs.nextLabel}>WHAT'S NEXT</Text>
      <View style={cs.nextRow}>
        {next.map((a) => (
          <TouchableOpacity
            key={a.label}
            onPress={a.onPress}
            style={cs.nextTile}
            activeOpacity={0.76}
          >
            <View style={[cs.nextIcon, {
              backgroundColor: a.color + '20',
              borderColor: a.color + '40',
            }]}>
              <Ionicons name={a.icon} size={18} color={a.color} />
            </View>
            <Text style={cs.nextTileLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Ghost re-read button */}
      <TouchableOpacity onPress={onReadAgain} style={cs.readAgainBtn} activeOpacity={0.7}>
        <Text style={cs.readAgainText}>Read Again</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

const cs = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  ringArea: {
    width: 82, height: 82,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
  },
  ringOuter: {
    position: 'absolute',
    width: 82, height: 82,
    borderRadius: 41,
    borderWidth: 1,
    borderColor: 'rgba(201,169,107,0.38)',
  },
  ringInner: {
    width: 60, height: 60,
    borderRadius: 30,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
  },
  headline: {
    fontFamily: 'Georgia',
    fontSize: 28, fontWeight: '400',
    color: OFF_WHITE,
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(201,169,107,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201,169,107,0.25)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 20,
  },
  streakText: {
    fontSize: 12, fontWeight: '600',
    color: GOLD,
    letterSpacing: 0.2,
  },
  divider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 20,
  },
  nextLabel: {
    fontSize: 9, fontWeight: '700',
    letterSpacing: 1.8,
    color: 'rgba(240,237,230,0.28)',
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  nextRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  nextTile: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  nextIcon: {
    width: 46, height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  nextTileLabel: {
    fontSize: 10, fontWeight: '600',
    color: 'rgba(240,237,230,0.52)',
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 14,
  },
  readAgainBtn: {
    paddingVertical: 10,
  },
  readAgainText: {
    fontSize: 13, fontWeight: '500',
    color: 'rgba(240,237,230,0.28)',
    letterSpacing: 0.3,
  },
});

// ─── Primary Action Bar ───────────────────────────────────────────────────────

const PrimaryActionBar = memo(function PrimaryActionBar({
  isFirst, onPress,
}: {
  isFirst: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressIn   = useCallback(() =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 20 }).start(),
  [scaleAnim]);
  const pressOut  = useCallback(() =>
    Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 20 }).start(),
  [scaleAnim]);

  const label = isFirst ? 'Begin Today\'s Reading' : 'Continue Today\'s Reading';

  return (
    <View style={cta.container}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={cta.button}
          onPress={onPress}
          onPressIn={pressIn}
          onPressOut={pressOut}
          activeOpacity={1}
        >
          <LinearGradient
            colors={[GOLD, '#B8904A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 18 }]}
          />
          <Text style={cta.btnText}>{label}</Text>
          <Ionicons name="arrow-forward" size={18} color="#1A1005" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

const cta = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    marginTop: 24,
  },
  button: {
    borderRadius: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
    backgroundColor: GOLD,
  },
  btnText: {
    fontSize: 17, fontWeight: '700',
    color: '#1A1005',
    letterSpacing: 0.1,
  },
});

// ─── Root Screen ──────────────────────────────────────────────────────────────

export default function TodayJourneyScreen() {
  const navigation = useNavigation<Nav>();
  const insets     = useSafeAreaInsets();

  const [activePlan,    setActivePlanState] = useState<ActivePlan | null>(null);
  const [plan,          setPlan]            = useState<ReadingPlan | null>(null);
  const [todayReading,  setTodayReading]    = useState<ReadingDay | null>(null);
  const [displayName,   setDisplayName]     = useState('');
  const [loading,       setLoading]         = useState(true);

  const fadeAnims  = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  const slideAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(22))).current;

  useFocusEffect(useCallback(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const [active, name] = await Promise.all([
        getActivePlan(),
        getSavedDisplayName(),
      ]);

      if (cancelled) return;

      if (!active) {
        navigation.replace('PlanLibrary');
        return;
      }

      const p       = getPlanById(active.planId);
      const reading = getTodayReading(active);

      setActivePlanState(active);
      setPlan(p ?? null);
      setTodayReading(reading);
      setDisplayName(name ?? '');
      setLoading(false);

      Animated.stagger(80, [0, 1, 2, 3].map(i =>
        Animated.parallel([
          Animated.timing(fadeAnims[i],  { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.spring(slideAnims[i], { toValue: 0, tension: 160, friction: 22, useNativeDriver: true }),
        ]),
      )).start();
    })();

    return () => { cancelled = true; };
  }, []));

  const handleStart = useCallback(() => {
    if (!activePlan || !todayReading) return;
    navigation.navigate('Reading', { planId: activePlan.planId, day: activePlan.currentDay });
  }, [activePlan, todayReading, navigation]);

  const handleChangePlan = useCallback(() => navigation.navigate('PlanLibrary'), [navigation]);

  const handleInsights = useCallback(() => {
    if (!todayReading) return;
    navigation.navigate('ScriptureInsights', {
      reference:   passageLabel(todayReading.passages),
      contextType: 'chapter',
      context:     todayReading.reflection,
    });
  }, [todayReading, navigation]);

  const handleChat = useCallback(() => {
    if (!todayReading) return;
    navigation.navigate('ScriptureChat', {
      reference:   passageLabel(todayReading.passages),
      contextType: 'chapter',
      context:     todayReading.reflection,
      mode:        'chat',
    });
  }, [todayReading, navigation]);

  if (loading || !activePlan || !plan || !todayReading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#060810' }}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      </View>
    );
  }

  const completed = isTodayCompleted(activePlan);
  const pct       = Math.round(planProgress(activePlan) * 100);
  const label     = passageLabel(todayReading.passages);
  const isFirst   = activePlan.currentDay === 1 && activePlan.completedDays.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: plan.gradient[1] }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* Full-bleed hero — handles its own safe area insets */}
        <CinematicHero
          plan={plan}
          activePlan={activePlan}
          todayReading={todayReading}
          label={label}
          completed={completed}
          displayName={displayName}
          insets={insets}
          onBack={() => navigation.goBack()}
          onChangePlan={handleChangePlan}
        />

        {/* Progress section */}
        <Animated.View style={{ opacity: fadeAnims[0], transform: [{ translateY: slideAnims[0] }] }}>
          <ProgressSection
            activePlan={activePlan}
            plan={plan}
            pct={pct}
            completed={completed}
          />
        </Animated.View>

        {/* Reflection card */}
        <Animated.View style={{ opacity: fadeAnims[1], transform: [{ translateY: slideAnims[1] }] }}>
          <ReflectionCard todayReading={todayReading} plan={plan} />
        </Animated.View>

        {/* AI companion strip */}
        <Animated.View style={{ opacity: fadeAnims[2], transform: [{ translateY: slideAnims[2] }] }}>
          <AICompanionStrip onInsights={handleInsights} onChat={handleChat} />
        </Animated.View>

        {/* CTA or completion */}
        <Animated.View style={{ opacity: fadeAnims[3], transform: [{ translateY: slideAnims[3] }] }}>
          {completed ? (
            <CompletionSection
              activePlan={activePlan}
              onReadAgain={handleStart}
              onPrayerJournal={() => navigation.navigate('PrayerJournal')}
              onDevotion={() => navigation.navigate('Devotion', undefined)}
              onAIChat={handleChat}
            />
          ) : (
            <PrimaryActionBar isFirst={isFirst} onPress={handleStart} />
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
