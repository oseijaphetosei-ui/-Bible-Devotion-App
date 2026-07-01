import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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

const { height: SCREEN_H } = Dimensions.get('window');

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'Still Awake';
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function TodayJourneyScreen() {
  const navigation = useNavigation<Nav>();
  const t = useTheme();

  const [activePlan, setActivePlan]   = useState<ActivePlan | null>(null);
  const [plan, setPlan]               = useState<ReadingPlan | null>(null);
  const [todayReading, setTodayReading] = useState<ReadingDay | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading]         = useState(true);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

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

      const p = getPlanById(active.planId);
      const reading = getTodayReading(active);

      setActivePlan(active);
      setPlan(p ?? null);
      setTodayReading(reading);
      setDisplayName(name ?? '');
      setLoading(false);

      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    })();

    return () => { cancelled = true; };
  }, []));

  const handleStart = useCallback(() => {
    if (!activePlan || !todayReading) return;
    navigation.navigate('Reading', {
      planId: activePlan.planId,
      day: activePlan.currentDay,
    });
  }, [activePlan, todayReading, navigation]);

  const handleChangePlan = useCallback(() => {
    navigation.navigate('PlanLibrary');
  }, [navigation]);

  if (loading || !activePlan || !plan || !todayReading) {
    return (
      <View style={[s.loadingRoot, { backgroundColor: '#0C0806' }]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      </View>
    );
  }

  const greeting   = getGreeting();
  const progress   = planProgress(activePlan);
  const completed  = isTodayCompleted(activePlan);
  const label      = passageLabel(todayReading.passages);
  const pct        = Math.round(progress * 100);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full-canvas gradient — the entire screen is one surface */}
      <LinearGradient
        colors={['#0C0806', '#161008', '#0A0806']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={s.safe} edges={['top']}>

        {/* Top nav — minimal, transparent */}
        <View style={s.topNav}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={s.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color="rgba(240,237,230,0.6)" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleChangePlan}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={s.changePlanText}>All Plans</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* ── Hero section ── */}
            <View style={[s.hero, { minHeight: SCREEN_H * 0.50 }]}>

              {/* Streak badge — floats in top right */}
              {activePlan.streak > 0 && (
                <View style={s.streakBadge}>
                  <Text style={s.streakFire}>🔥</Text>
                  <Text style={s.streakCount}>{activePlan.streak}</Text>
                </View>
              )}

              {/* Spacer pushes content to lower half of hero */}
              <View style={{ flex: 1 }} />

              {/* Greeting */}
              <Text style={s.greetingLabel}>{greeting.toUpperCase()}</Text>
              {displayName ? (
                <Text style={s.greetingName}>{displayName}</Text>
              ) : null}

              {/* Reading title — the visual centerpiece */}
              <Text style={s.readingTitle}>{todayReading.title}</Text>

              {/* Metadata row */}
              <View style={s.metaRow}>
                <Text style={s.metaText}>Day {activePlan.currentDay} of {plan.totalDays}</Text>
                <View style={s.metaDot} />
                <Text style={s.metaText}>{todayReading.estimatedMinutes} min</Text>
              </View>

              <View style={{ height: 28 }} />
            </View>

            {/* ── Progress bar — full width ── */}
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${pct}%` }]} />
            </View>
            <View style={s.progressLabels}>
              <Text style={s.progressPct}>{pct}% complete</Text>
              <Text style={s.progressPct}>{plan.totalDays - activePlan.currentDay + 1} days left</Text>
            </View>

            {/* ── Reflection section — flows naturally below hero ── */}
            <View style={s.reflectionSection}>

              {/* Passage reference */}
              <Text style={s.passageRef}>{label}</Text>

              {/* Thin gold rule */}
              <View style={s.goldRule} />

              {/* Reflection preview text */}
              <Text style={s.reflectionText}>
                {todayReading.reflection}
              </Text>

              {/* Plan name */}
              <Text style={s.planName}>{plan.title}</Text>

            </View>

            {/* ── CTA ── */}
            <View style={s.ctaSection}>
              {completed ? (
                <>
                  <View style={s.completedBanner}>
                    <Ionicons name="checkmark-circle" size={18} color="#C9A96B" />
                    <Text style={s.completedText}>Today's reading complete</Text>
                  </View>
                  <TouchableOpacity
                    style={s.ctaSecondary}
                    onPress={handleStart}
                    activeOpacity={0.8}
                  >
                    <Text style={s.ctaSecondaryText}>Read Again</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={s.cta}
                  onPress={handleStart}
                  activeOpacity={0.85}
                >
                  <Text style={s.ctaText}>
                    {activePlan.currentDay === 1 && activePlan.completedDays.length === 0
                      ? 'Begin Today\'s Reading'
                      : 'Continue Today\'s Reading'}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#1A1005" />
                </TouchableOpacity>
              )}
            </View>

          </Animated.View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const GOLD  = '#C9A96B';
const WHITE = '#F0EDE6';

const s = StyleSheet.create({
  root:        { flex: 1 },
  loadingRoot: { flex: 1 },
  safe:        { flex: 1 },
  scroll:      { flex: 1 },
  scrollContent: { flexGrow: 1 },

  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  backBtn:       { padding: 4 },
  changePlanText: {
    fontSize: 13,
    color: 'rgba(240,237,230,0.45)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────

  hero: {
    paddingHorizontal: 28,
    paddingBottom: 12,
  },

  streakBadge: {
    position: 'absolute',
    top: 0,
    right: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(201,169,107,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201,169,107,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  streakFire:  { fontSize: 14 },
  streakCount: { fontSize: 13, fontWeight: '700', color: GOLD },

  greetingLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    color: GOLD,
    marginBottom: 4,
  },
  greetingName: {
    fontSize: 14,
    color: 'rgba(240,237,230,0.45)',
    fontWeight: '400',
    letterSpacing: 0.3,
    marginBottom: 20,
  },

  readingTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: WHITE,
    lineHeight: 44,
    letterSpacing: -0.5,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(240,237,230,0.25)' },
  metaText: {
    fontSize: 13,
    color: 'rgba(240,237,230,0.45)',
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // ── Progress bar ──────────────────────────────────────────────────────────

  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(240,237,230,0.08)',
    marginHorizontal: 0,
  },
  progressFill: {
    height: 2,
    backgroundColor: GOLD,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    marginTop: 10,
  },
  progressPct: {
    fontSize: 11,
    color: 'rgba(240,237,230,0.30)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // ── Reflection section ────────────────────────────────────────────────────

  reflectionSection: {
    paddingHorizontal: 28,
    paddingTop: 36,
  },

  passageRef: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: 'rgba(201,169,107,0.65)',
    marginBottom: 16,
    textTransform: 'uppercase',
  },

  goldRule: {
    width: 32,
    height: 1,
    backgroundColor: 'rgba(201,169,107,0.35)',
    marginBottom: 20,
  },

  reflectionText: {
    fontSize: 18,
    lineHeight: 30,
    color: 'rgba(240,237,230,0.80)',
    fontStyle: 'italic',
    letterSpacing: 0.1,
    fontWeight: '400',
  },

  planName: {
    fontSize: 12,
    color: 'rgba(240,237,230,0.25)',
    marginTop: 24,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  // ── CTA ───────────────────────────────────────────────────────────────────

  ctaSection: {
    paddingHorizontal: 28,
    paddingTop: 40,
  },

  cta: {
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1005',
    letterSpacing: 0.2,
  },

  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  completedText: {
    fontSize: 14,
    color: GOLD,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  ctaSecondary: {
    borderWidth: 1,
    borderColor: 'rgba(201,169,107,0.35)',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(240,237,230,0.55)',
    letterSpacing: 0.2,
  },
});
