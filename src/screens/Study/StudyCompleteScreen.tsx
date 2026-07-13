import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar,
  Animated, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { getStudyById, getProgress, getAllStudies } from '../../services/studyService';
import type { Study, StudyProgress } from '../../types/study';
import { HomeStackParamList } from '../../types/navigation';

type NavProp    = NativeStackNavigationProp<HomeStackParamList, 'StudyComplete'>;
type RoutePropT = RouteProp<HomeStackParamList, 'StudyComplete'>;

const GOLD  = '#C9A96B';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function StudyCompleteScreen() {
  const t          = useTheme();
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RoutePropT>();
  const insets     = useSafeAreaInsets();

  const study = getStudyById(route.params.studyId);
  const [progress, setProgress] = useState<StudyProgress | null>(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    getProgress(route.params.studyId).then(setProgress);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 100, friction: 16, useNativeDriver: true }),
    ]).start();
  }, [route.params.studyId, fadeAnim, slideAnim]);

  if (!study) return null;

  // Days studied = distinct calendar days with a completion
  const daysStudied = progress
    ? new Set(Object.values(progress.completionTimes).map(iso => iso.slice(0, 10))).size
    : 0;
  const minutesInvested = study.lessons.reduce((sum, l) => sum + l.readingMinutes, 0);

  // Recommend the next unfinished study, preferring a different category
  const next = getAllStudies().find(st => st.id !== study.id && st.category !== study.category)
    ?? getAllStudies().find(st => st.id !== study.id);

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Trophy */}
          <View style={s.trophyWrap}>
            <View style={s.trophyRing}>
              <Ionicons name="trophy" size={40} color={GOLD} />
            </View>
          </View>

          <Text style={[s.eyebrow, { color: GOLD }]}>STUDY COMPLETED</Text>
          <Text style={[s.title, { color: t.text, fontFamily: SERIF }]}>{study.title}</Text>
          <Text style={[s.sub, { color: t.textSub }]}>
            You walked every step of this journey. Well done, good and faithful servant.
          </Text>

          {/* Stats */}
          <View style={s.statsRow}>
            <Stat value={String(study.totalDays)} label="Lessons" t={t} />
            <Stat value={String(daysStudied)} label="Days studied" t={t} />
            <Stat value={`${minutesInvested}m`} label="Time in the Word" t={t} />
          </View>

          {/* Memory verses collected */}
          <Text style={[s.sectionLabel, { color: t.textMuted }]}>VERSES YOU CARRIED</Text>
          <View style={[s.verseCard, { backgroundColor: 'rgba(201,169,107,0.09)', borderColor: 'rgba(201,169,107,0.26)' }]}>
            {study.lessons.slice(0, 4).map(l => (
              <Text key={l.day} style={[s.verseRef, { color: t.textSub }]}>
                <Text style={{ color: GOLD, fontWeight: '700' }}>· </Text>
                {l.memoryVerse.reference}
              </Text>
            ))}
            {study.lessons.length > 4 && (
              <Text style={[s.verseRef, { color: t.textMuted }]}>…and {study.lessons.length - 4} more</Text>
            )}
          </View>

          {/* Next journey */}
          {next && (
            <>
              <Text style={[s.sectionLabel, { color: t.textMuted }]}>YOUR NEXT JOURNEY</Text>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => navigation.replace('StudyDetail', { studyId: next.id })}
              >
                <LinearGradient colors={next.gradient} style={s.nextCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={s.nextIcon}>{next.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.nextTitle, { fontFamily: SERIF }]}>{next.title}</Text>
                    <Text style={s.nextSub}>{next.subtitle}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={18} color={GOLD} />
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[s.libraryBtn, { borderColor: t.goldBorder }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('StudyLibrary')}
          >
            <Text style={[s.libraryBtnText, { color: GOLD }]}>Browse All Studies</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.homeBtn}
            activeOpacity={0.8}
            onPress={() => navigation.popToTop()}
          >
            <Text style={[s.homeBtnText, { color: t.textMuted }]}>Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function Stat({ value, label, t }: { value: string; label: string; t: any }) {
  return (
    <View style={s.stat}>
      <Text style={[s.statValue, { color: GOLD, fontFamily: SERIF }]}>{value}</Text>
      <Text style={[s.statLabel, { color: t.textMuted }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { paddingHorizontal: 26, paddingBottom: 140 },

  trophyWrap: { alignItems: 'center', marginBottom: 24 },
  trophyRing: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(201,169,107,0.12)',
    borderWidth: 1.5, borderColor: 'rgba(201,169,107,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },

  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 2, textAlign: 'center', marginBottom: 10 },
  title:   { fontSize: 32, fontWeight: '400', textAlign: 'center', lineHeight: 38 },
  sub:     { fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 12, paddingHorizontal: 10 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 30, marginBottom: 8 },
  stat:      { alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '400' },
  statLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.4, marginTop: 4 },

  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginTop: 30, marginBottom: 12 },

  verseCard: { borderRadius: 18, borderWidth: 1, padding: 18, gap: 8 },
  verseRef:  { fontSize: 13, lineHeight: 20 },

  nextCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 20, padding: 20,
  },
  nextIcon:  { fontSize: 24 },
  nextTitle: { fontSize: 19, color: 'rgba(255,255,255,0.95)' },
  nextSub:   { fontSize: 12, color: 'rgba(201,169,107,0.8)', marginTop: 3, fontWeight: '600' },

  libraryBtn: {
    borderWidth: 1, borderRadius: 30, paddingVertical: 14,
    alignItems: 'center', marginTop: 16,
  },
  libraryBtnText: { fontSize: 14, fontWeight: '700' },

  homeBtn:     { alignItems: 'center', paddingVertical: 16 },
  homeBtnText: { fontSize: 13, fontWeight: '600' },
});
