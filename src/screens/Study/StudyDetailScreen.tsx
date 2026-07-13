import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import {
  getStudyById, getProgress, startStudy, getLockState, estimatedFinishDate,
} from '../../services/studyService';
import type { StudyProgress, LessonLockState } from '../../types/study';
import { HomeStackParamList } from '../../types/navigation';

type NavProp   = NativeStackNavigationProp<HomeStackParamList, 'StudyDetail'>;
type RoutePropT = RouteProp<HomeStackParamList, 'StudyDetail'>;

const GOLD  = '#C9A96B';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function StudyDetailScreen() {
  const t          = useTheme();
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RoutePropT>();
  const insets     = useSafeAreaInsets();
  const isDark     = t.statusBar === 'light-content';

  const study = getStudyById(route.params.studyId);
  const [progress, setProgress] = useState<StudyProgress | null>(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      getProgress(route.params.studyId).then(p => { if (mounted) setProgress(p); });
      return () => { mounted = false; };
    }, [route.params.studyId]),
  );

  if (!study) return null;

  const done    = progress?.completedDays.length ?? 0;
  const percent = Math.round((done / study.totalDays) * 100);

  const handleStart = async () => {
    const p = await startStudy(study.id);
    setProgress(p);
    const firstOpen = study.lessons.find(l => getLockState(p, l.day) === 'available');
    if (firstOpen) {
      navigation.navigate('LessonReader', { studyId: study.id, day: firstOpen.day });
    }
  };

  const openLesson = (day: number, state: LessonLockState) => {
    if (state === 'locked' || state === 'tomorrow') return;
    if (!progress) return;
    navigation.navigate('LessonReader', { studyId: study.id, day });
  };

  const rowColors = {
    text:  t.text,
    sub:   t.textSub,
    muted: t.textMuted,
    line:  isDark ? 'rgba(255,255,255,0.10)' : 'rgba(24,18,8,0.10)',
  };

  return (
    <View style={[s.root, { backgroundColor: t.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={t.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={study.lessons}
        keyExtractor={l => String(l.day)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
        ListHeaderComponent={
          <View>
            {/* Cover */}
            <LinearGradient colors={study.gradient} style={s.cover} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={s.coverIcon}>{study.icon}</Text>
              <Text style={[s.coverTitle, { fontFamily: SERIF }]}>{study.title}</Text>
              <Text style={s.coverSubtitle}>{study.subtitle}</Text>
              <Text style={s.coverDesc}>{study.description}</Text>

              {progress && (
                <>
                  <View style={s.progressTrack}>
                    <View style={[s.progressFill, { width: `${percent}%` }]} />
                  </View>
                  <Text style={s.progressLabel}>
                    {done} of {study.totalDays} complete
                    {!progress.finished && ` · finishes ~${estimatedFinishDate(study, progress)}`}
                  </Text>
                </>
              )}

              {!progress ? (
                <TouchableOpacity style={s.startBtn} activeOpacity={0.85} onPress={handleStart}>
                  <Text style={s.startBtnText}>Begin This Journey</Text>
                  <Ionicons name="arrow-forward" size={15} color="#1A1005" />
                </TouchableOpacity>
              ) : progress.finished ? (
                <TouchableOpacity
                  style={s.startBtn}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('StudyComplete', { studyId: study.id })}
                >
                  <Ionicons name="trophy-outline" size={15} color="#1A1005" />
                  <Text style={s.startBtnText}>View Completion</Text>
                </TouchableOpacity>
              ) : null}
            </LinearGradient>

            <Text style={[s.timelineLabel, { color: t.textMuted }]}>LESSON TIMELINE</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const state = getLockState(progress, item.day);
          const isLast = index === study.lessons.length - 1;
          return (
            <TouchableOpacity
              style={s.row}
              activeOpacity={state === 'locked' || state === 'tomorrow' ? 1 : 0.8}
              onPress={() => openLesson(item.day, state)}
            >
              {/* Timeline node + connector */}
              <View style={s.nodeCol}>
                <View style={[
                  s.node,
                  state === 'completed' && { backgroundColor: 'rgba(201,169,107,0.16)', borderColor: GOLD },
                  state === 'available' && { backgroundColor: GOLD, borderColor: GOLD },
                  (state === 'locked' || state === 'tomorrow') && { borderColor: rowColors.line },
                ]}>
                  {state === 'completed' && <Ionicons name="checkmark" size={14} color={GOLD} />}
                  {state === 'available' && <Ionicons name="play" size={11} color="#1A1005" />}
                  {state === 'tomorrow'  && <Ionicons name="moon-outline" size={12} color={rowColors.muted} />}
                  {state === 'locked'    && <Ionicons name="lock-closed" size={11} color={rowColors.muted} />}
                </View>
                {!isLast && <View style={[s.connector, { backgroundColor: rowColors.line }]} />}
              </View>

              {/* Lesson info */}
              <View style={s.rowBody}>
                <Text style={[s.rowDay, { color: state === 'available' ? GOLD : rowColors.muted }]}>
                  DAY {item.day}
                  {state === 'available' && '  ·  TODAY'}
                  {state === 'tomorrow'  && '  ·  UNLOCKS TOMORROW'}
                </Text>
                <Text
                  style={[
                    s.rowTitle,
                    { color: state === 'locked' ? rowColors.muted : rowColors.text, fontFamily: SERIF },
                  ]}
                >
                  {item.title}
                </Text>
                {state !== 'locked' && (
                  <Text style={[s.rowSub, { color: rowColors.sub }]} numberOfLines={1}>{item.subtitle}</Text>
                )}
              </View>

              {(state === 'completed' || state === 'available') && (
                <Ionicons name="chevron-forward" size={16} color={rowColors.muted} style={{ marginTop: 18 }} />
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  list: { paddingHorizontal: 18, paddingBottom: 130 },

  cover: { borderRadius: 24, padding: 24, marginBottom: 6 },
  coverIcon:     { fontSize: 30, marginBottom: 12 },
  coverTitle:    { fontSize: 30, fontWeight: '400', color: 'rgba(255,255,255,0.96)', lineHeight: 36 },
  coverSubtitle: { fontSize: 13, fontWeight: '600', color: 'rgba(201,169,107,0.85)', marginTop: 6 },
  coverDesc:     { fontSize: 13, color: 'rgba(255,255,255,0.60)', lineHeight: 20, marginTop: 12 },

  progressTrack: {
    height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.14)',
    marginTop: 18, overflow: 'hidden',
  },
  progressFill:  { height: 5, borderRadius: 3, backgroundColor: GOLD },
  progressLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 8 },

  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: GOLD, borderRadius: 30, paddingVertical: 14, marginTop: 20,
  },
  startBtnText: { fontSize: 14, fontWeight: '700', color: '#1A1005' },

  timelineLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginTop: 22, marginBottom: 14, paddingHorizontal: 2 },

  row: { flexDirection: 'row', gap: 14 },
  nodeCol: { alignItems: 'center', width: 28 },
  node: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', borderColor: 'transparent',
  },
  connector: { width: 1.5, flex: 1, marginVertical: 4, minHeight: 22 },

  rowBody:  { flex: 1, paddingBottom: 26 },
  rowDay:   { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 4, marginTop: 6 },
  rowTitle: { fontSize: 17, fontWeight: '400', lineHeight: 22 },
  rowSub:   { fontSize: 12, marginTop: 3 },
});
