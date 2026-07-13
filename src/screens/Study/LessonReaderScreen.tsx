import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar,
  Animated, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { getStudyById, getProgress, completeLesson } from '../../services/studyService';
import type { StudyProgress } from '../../types/study';
import { HomeStackParamList } from '../../types/navigation';

type NavProp    = NativeStackNavigationProp<HomeStackParamList, 'LessonReader'>;
type RoutePropT = RouteProp<HomeStackParamList, 'LessonReader'>;

const GOLD  = '#C9A96B';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function LessonReaderScreen() {
  const t          = useTheme();
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RoutePropT>();
  const insets     = useSafeAreaInsets();
  const isDark     = t.statusBar === 'light-content';

  const { studyId, day } = route.params;
  const study  = getStudyById(studyId);
  const lesson = study?.lessons.find(l => l.day === day);

  const [progress,   setProgress]   = useState<StudyProgress | null>(null);
  const [completing, setCompleting] = useState(false);

  // Completion celebration overlay
  const overlayOp   = useRef(new Animated.Value(0)).current;
  const checkScale  = useRef(new Animated.Value(0.4)).current;

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      getProgress(studyId).then(p => { if (mounted) setProgress(p); });
      return () => { mounted = false; };
    }, [studyId]),
  );

  if (!study || !lesson) return null;

  const alreadyCompleted = progress?.completedDays.includes(day) ?? false;
  const isFinal = day === study.totalDays;

  const handleComplete = async () => {
    if (completing || alreadyCompleted) return;
    setCompleting(true);

    const updated = await completeLesson(studyId, day);
    setProgress(updated);

    // Subtle premium celebration: fade in scrim, spring the gold check
    Animated.parallel([
      Animated.timing(overlayOp, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(checkScale, { toValue: 1, tension: 120, friction: 10, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      Animated.timing(overlayOp, { toValue: 0, duration: 240, useNativeDriver: true }).start(() => {
        if (updated.finished) {
          navigation.replace('StudyComplete', { studyId });
        } else {
          navigation.goBack();
        }
      });
    }, 1600);
  };

  const card = {
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.66)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.85)',
  };
  const goldCard = {
    backgroundColor: 'rgba(201,169,107,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(201,169,107,0.26)',
  };

  return (
    <View style={[s.root, { backgroundColor: t.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={t.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerStudy, { color: t.textMuted }]} numberOfLines={1}>{study.title}</Text>
          <Text style={[s.headerDay, { color: GOLD }]}>Day {day} of {study.totalDays}</Text>
        </View>
        {alreadyCompleted && (
          <View style={s.doneBadge}>
            <Ionicons name="checkmark-circle" size={14} color={GOLD} />
            <Text style={s.doneBadgeText}>Complete</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={[s.title, { color: t.text, fontFamily: SERIF }]}>{lesson.title}</Text>
        <Text style={[s.subtitle, { color: t.textSub }]}>{lesson.subtitle}</Text>
        <Text style={[s.readTime, { color: t.textMuted }]}>
          <Ionicons name="time-outline" size={11} color={t.textMuted} /> {lesson.readingMinutes} min read
        </Text>

        {/* Opening prayer */}
        <Section label="OPENING PRAYER" t={t}>
          <View style={[s.card, goldCard]}>
            <Text style={[s.prayerText, { color: t.textSub, fontFamily: SERIF }]}>{lesson.openingPrayer}</Text>
          </View>
        </Section>

        {/* Memory verse */}
        <Section label="MEMORY VERSE" t={t}>
          <View style={[s.card, goldCard]}>
            <Text style={[s.verseText, { color: t.text, fontFamily: SERIF }]}>
              "{lesson.memoryVerse.text}"
            </Text>
            <Text style={[s.verseRef, { color: GOLD }]}>— {lesson.memoryVerse.reference}</Text>
          </View>
        </Section>

        {/* Scripture passage */}
        <Section label="TODAY'S SCRIPTURE" t={t}>
          <View style={[s.card, card]}>
            <Text style={[s.passageLabel, { color: GOLD, fontFamily: SERIF }]}>{lesson.passage.label}</Text>
            <Text style={[s.passageText, { color: t.textSub, fontFamily: SERIF }]}>{lesson.passage.excerpt}</Text>
            <TouchableOpacity
              style={[s.readFullBtn, { borderColor: t.goldBorder }]}
              activeOpacity={0.78}
              onPress={() => navigation.navigate('Bible', {
                bookIndex: lesson.passage.bookIndex,
                chapter: lesson.passage.chapter,
              })}
            >
              <Ionicons name="book-outline" size={13} color={GOLD} />
              <Text style={[s.readFullText, { color: GOLD }]}>Read Full Chapter</Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* Context */}
        <Section label="CONTEXT" t={t}>
          <Text style={[s.body, { color: t.textSub }]}>{lesson.context}</Text>
        </Section>

        {/* Teaching */}
        <Section label="TEACHING" t={t}>
          {lesson.teaching.map((p, i) => (
            <Text key={i} style={[s.body, { color: t.textSub, marginBottom: i < lesson.teaching.length - 1 ? 14 : 0 }]}>
              {p}
            </Text>
          ))}
        </Section>

        {/* Application */}
        <Section label="LIVE IT TODAY" t={t}>
          <Text style={[s.body, { color: t.textSub }]}>{lesson.application}</Text>
        </Section>

        {/* Reflection */}
        <Section label="REFLECT" t={t}>
          {lesson.reflectionQuestions.map((q, i) => (
            <View key={i} style={s.qRow}>
              <Text style={[s.qNum, { color: GOLD }]}>{i + 1}</Text>
              <Text style={[s.qText, { color: t.textSub }]}>{q}</Text>
            </View>
          ))}
        </Section>

        {/* Closing prayer */}
        <Section label="PRAYER" t={t}>
          <View style={[s.card, goldCard]}>
            <Text style={[s.prayerText, { color: t.textSub, fontFamily: SERIF }]}>{lesson.closingPrayer}</Text>
          </View>
        </Section>

        {/* Challenge */}
        <Section label="TODAY'S CHALLENGE" t={t}>
          <View style={[s.card, card, s.challengeRow]}>
            <Ionicons name="flag-outline" size={18} color={GOLD} />
            <Text style={[s.challengeText, { color: t.text }]}>{lesson.challenge}</Text>
          </View>
        </Section>

        {/* Key takeaway */}
        <Section label="KEY TAKEAWAY" t={t}>
          <Text style={[s.takeaway, { color: t.text, fontFamily: SERIF }]}>
            "{lesson.keyTakeaway}"
          </Text>
        </Section>

        {/* Tomorrow preview */}
        {lesson.tomorrowPreview && (
          <View style={[s.card, card, s.previewCard]}>
            <Text style={[s.previewLabel, { color: t.textMuted }]}>TOMORROW</Text>
            <Text style={[s.previewText, { color: t.textSub, fontFamily: SERIF }]}>{lesson.tomorrowPreview}</Text>
          </View>
        )}

        {/* Complete CTA */}
        {!alreadyCompleted ? (
          <TouchableOpacity style={s.completeBtn} activeOpacity={0.85} onPress={handleComplete} disabled={completing}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#1A1005" />
            <Text style={s.completeBtnText}>
              {isFinal ? 'Complete the Journey' : `Complete Day ${day}`}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={[s.completedNote, { borderColor: t.goldBorder }]}>
            <Ionicons name="checkmark-circle" size={16} color={GOLD} />
            <Text style={[s.completedNoteText, { color: t.textSub }]}>
              Completed{progress?.completionTimes[String(day)]
                ? ` on ${new Date(progress.completionTimes[String(day)]).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
                : ''}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Celebration overlay */}
      {completing && (
        <Animated.View style={[s.overlay, { opacity: overlayOp }]} pointerEvents="none">
          <Animated.View style={[s.overlayCheck, { transform: [{ scale: checkScale }] }]}>
            <Ionicons name="checkmark" size={44} color="#1A1005" />
          </Animated.View>
          <Text style={[s.overlayTitle, { fontFamily: SERIF }]}>Day {day} Complete</Text>
          <Text style={s.overlaySub}>
            {isFinal ? 'You finished the journey!' : "Tomorrow's lesson unlocks in the morning"}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

function Section({ label, t, children }: { label: string; t: any; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={[s.sectionLabel, { color: t.textMuted }]}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, height: 56, gap: 8,
  },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerStudy: { fontSize: 11, fontWeight: '600' },
  headerDay:   { fontSize: 13, fontWeight: '700', marginTop: 1 },
  doneBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(201,169,107,0.12)', borderRadius: 12,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  doneBadgeText: { fontSize: 11, fontWeight: '700', color: GOLD },

  scroll: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 140 },

  title:    { fontSize: 30, fontWeight: '400', lineHeight: 37, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, marginTop: 8, lineHeight: 20 },
  readTime: { fontSize: 11, marginTop: 10 },

  section:      { marginTop: 30 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginBottom: 12 },

  card: { borderRadius: 18, padding: 18 },

  prayerText: { fontSize: 15, lineHeight: 24, fontStyle: 'italic' },

  verseText: { fontSize: 17, lineHeight: 27 },
  verseRef:  { fontSize: 12, fontWeight: '700', marginTop: 10 },

  passageLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  passageText:  { fontSize: 15, lineHeight: 25 },
  readFullBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    borderWidth: 1, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 8, marginTop: 14,
  },
  readFullText: { fontSize: 12, fontWeight: '700' },

  body: { fontSize: 15, lineHeight: 25 },

  qRow:  { flexDirection: 'row', gap: 12, marginBottom: 14 },
  qNum:  { fontSize: 14, fontWeight: '800', width: 16, marginTop: 1 },
  qText: { flex: 1, fontSize: 15, lineHeight: 24 },

  challengeRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  challengeText: { flex: 1, fontSize: 14, lineHeight: 21, fontWeight: '500' },

  takeaway: { fontSize: 18, lineHeight: 28, fontStyle: 'italic' },

  previewCard:  { marginTop: 30 },
  previewLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginBottom: 8 },
  previewText:  { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },

  completeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: GOLD, borderRadius: 30, paddingVertical: 16, marginTop: 34,
  },
  completeBtnText: { fontSize: 15, fontWeight: '700', color: '#1A1005' },

  completedNote: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderRadius: 30, paddingVertical: 15, marginTop: 34,
  },
  completedNoteText: { fontSize: 13, fontWeight: '600' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,8,16,0.88)',
    alignItems: 'center', justifyContent: 'center',
  },
  overlayCheck: {
    width: 92, height: 92, borderRadius: 46, backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center', marginBottom: 22,
  },
  overlayTitle: { fontSize: 26, color: 'rgba(255,255,255,0.95)', marginBottom: 8 },
  overlaySub:   { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
});
