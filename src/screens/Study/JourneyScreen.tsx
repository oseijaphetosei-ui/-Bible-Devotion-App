import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar,
  Animated, ActivityIndicator, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import {
  getJourneySnapshot, loadRemoteStudies, pullRemoteProgress, estimatedFinishDate,
} from '../../services/studyService';
import type { JourneySnapshot } from '../../types/study';
import { HomeStackParamList } from '../../types/navigation';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'Journey'>;

const GOLD  = '#C9A96B';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function JourneyScreen() {
  const t          = useTheme();
  const navigation = useNavigation<NavProp>();
  const insets     = useSafeAreaInsets();
  const isDark     = t.statusBar === 'light-content';

  const [snapshot, setSnapshot] = useState<JourneySnapshot | null>(null);
  const [loading,  setLoading]  = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        await Promise.all([loadRemoteStudies(), pullRemoteProgress()]);
        const snap = await getJourneySnapshot();
        if (!mounted) return;
        setSnapshot(snap);
        setLoading(false);
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      })();
      return () => { mounted = false; };
    }, [fadeAnim]),
  );

  const glass = isDark
    ? { backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }
    : { backgroundColor: 'rgba(255,255,255,0.68)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)' };

  if (loading) {
    return (
      <View style={[s.root, { backgroundColor: t.bg, paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />
        <ActivityIndicator color={GOLD} size="large" />
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: t.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={t.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: t.text, fontFamily: SERIF }]}>Your Journey</Text>
        <TouchableOpacity onPress={() => navigation.navigate('StudyLibrary')} style={s.libBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="library-outline" size={21} color={GOLD} />
        </TouchableOpacity>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {snapshot ? (
          <ActiveJourney snapshot={snapshot} isDark={isDark} glass={glass} navigation={navigation} t={t} />
        ) : (
          <EmptyJourney isDark={isDark} navigation={navigation} t={t} />
        )}
      </Animated.View>
    </View>
  );
}

// ── Active journey ────────────────────────────────────────────────────────────

function ActiveJourney({ snapshot, isDark, glass, navigation, t }: any) {
  const { study, progress, todayLesson, doneForToday, percent, streak } = snapshot;
  const done = progress.completedDays.length;

  return (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      {/* Current study hero */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('StudyDetail', { studyId: study.id })}
      >
        <LinearGradient colors={study.gradient} style={s.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={s.heroEyebrow}>CONTINUE YOUR JOURNEY</Text>
          <Text style={[s.heroTitle, { fontFamily: SERIF }]}>{study.title}</Text>
          <Text style={s.heroMeta}>
            Day {Math.min(progress.currentDay, study.totalDays)} of {study.totalDays}
            {'  ·  '}finishes ~{estimatedFinishDate(study, progress)}
          </Text>

          {/* Progress bar */}
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${Math.round(percent * 100)}%` }]} />
          </View>
          <View style={s.heroStatsRow}>
            <Text style={s.heroStat}>{done} of {study.totalDays} lessons</Text>
            {streak > 0 && (
              <View style={s.streakPill}>
                <Ionicons name="flame" size={12} color={GOLD} />
                <Text style={s.streakText}>{streak} day{streak === 1 ? '' : 's'}</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Today's lesson */}
      <Text style={[s.sectionLabel, { color: t.textMuted }]}>
        {doneForToday ? "TODAY — COMPLETE" : "TODAY'S LESSON"}
      </Text>

      {todayLesson && !progress.finished ? (
        <TouchableOpacity
          style={[s.lessonCard, glass]}
          activeOpacity={0.85}
          disabled={doneForToday}
          onPress={() => navigation.navigate('LessonReader', { studyId: study.id, day: todayLesson.day })}
        >
          <View style={[s.dayBadge, { backgroundColor: doneForToday ? t.accentBg : 'rgba(201,169,107,0.14)' }]}>
            {doneForToday
              ? <Ionicons name="checkmark" size={20} color={t.accent} />
              : <Text style={[s.dayBadgeText, { color: GOLD }]}>{todayLesson.day}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.lessonTitle, { color: t.text, fontFamily: SERIF }]}>{todayLesson.title}</Text>
            <Text style={[s.lessonSub, { color: t.textSub }]} numberOfLines={2}>{todayLesson.subtitle}</Text>
            <Text style={[s.lessonMeta, { color: t.textMuted }]}>
              {doneForToday ? 'Day complete — next lesson unlocks tomorrow' : `${todayLesson.readingMinutes} min read`}
            </Text>
          </View>
          {!doneForToday && <Ionicons name="chevron-forward" size={18} color={t.textMuted} />}
        </TouchableOpacity>
      ) : progress.finished ? (
        <TouchableOpacity
          style={[s.lessonCard, glass]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('StudyComplete', { studyId: study.id })}
        >
          <View style={[s.dayBadge, { backgroundColor: 'rgba(201,169,107,0.14)' }]}>
            <Ionicons name="trophy" size={18} color={GOLD} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.lessonTitle, { color: t.text, fontFamily: SERIF }]}>Study complete!</Text>
            <Text style={[s.lessonSub, { color: t.textSub }]}>Revisit your journey or begin a new one.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
        </TouchableOpacity>
      ) : null}

      {/* Timeline shortcut */}
      <TouchableOpacity
        style={[s.rowBtn, glass]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('StudyDetail', { studyId: study.id })}
      >
        <Ionicons name="git-commit-outline" size={19} color={GOLD} />
        <Text style={[s.rowBtnText, { color: t.text }]}>Lesson Timeline</Text>
        <Text style={[s.rowBtnMeta, { color: t.textMuted }]}>{done} ✓</Text>
        <Ionicons name="chevron-forward" size={16} color={t.textMuted} />
      </TouchableOpacity>

      {/* Library */}
      <TouchableOpacity
        style={[s.rowBtn, glass]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('StudyLibrary')}
      >
        <Ionicons name="library-outline" size={19} color={GOLD} />
        <Text style={[s.rowBtnText, { color: t.text }]}>Browse Study Library</Text>
        <Ionicons name="chevron-forward" size={16} color={t.textMuted} />
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyJourney({ isDark, navigation, t }: any) {
  return (
    <View style={s.empty}>
      <View style={[s.emptyIcon, { backgroundColor: 'rgba(201,169,107,0.12)', borderColor: 'rgba(201,169,107,0.28)' }]}>
        <Ionicons name="map-outline" size={34} color={GOLD} />
      </View>
      <Text style={[s.emptyTitle, { color: t.text, fontFamily: SERIF }]}>Begin a Journey</Text>
      <Text style={[s.emptySub, { color: t.textSub }]}>
        Guided Bible studies that walk with you one day at a time — with a clear beginning, a
        steady path, and a destination worth reaching.
      </Text>
      <TouchableOpacity
        style={s.emptyCta}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('StudyLibrary')}
      >
        <Text style={s.emptyCtaText}>Explore Studies</Text>
        <Ionicons name="arrow-forward" size={16} color="#1A1005" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, height: 56, gap: 10,
  },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '400', letterSpacing: -0.3 },
  libBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  scroll: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 130, gap: 12 },

  hero: {
    borderRadius: 24, padding: 22, marginBottom: 8,
  },
  heroEyebrow: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1.8,
    color: 'rgba(201,169,107,0.85)', marginBottom: 10,
  },
  heroTitle: { fontSize: 28, fontWeight: '400', color: 'rgba(255,255,255,0.96)', lineHeight: 34 },
  heroMeta:  { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 6 },
  progressTrack: {
    height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.14)',
    marginTop: 18, overflow: 'hidden',
  },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: GOLD },
  heroStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  heroStat:     { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  streakPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(201,169,107,0.14)', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  streakText: { fontSize: 11, fontWeight: '700', color: GOLD },

  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginTop: 8, marginBottom: 2, paddingHorizontal: 2 },

  lessonCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 20, padding: 18,
  },
  dayBadge: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  dayBadgeText: { fontSize: 17, fontWeight: '700' },
  lessonTitle:  { fontSize: 17, fontWeight: '400' },
  lessonSub:    { fontSize: 12, marginTop: 3, lineHeight: 17 },
  lessonMeta:   { fontSize: 11, marginTop: 6 },

  rowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 18, paddingHorizontal: 18, paddingVertical: 15,
  },
  rowBtnText: { flex: 1, fontSize: 14, fontWeight: '600' },
  rowBtnMeta: { fontSize: 12, fontWeight: '600' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 80 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 22,
  },
  emptyTitle: { fontSize: 26, fontWeight: '400', marginBottom: 10 },
  emptySub:   { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 26 },
  emptyCta: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: GOLD, borderRadius: 30,
    paddingHorizontal: 26, paddingVertical: 14,
  },
  emptyCtaText: { fontSize: 14, fontWeight: '700', color: '#1A1005' },
});
