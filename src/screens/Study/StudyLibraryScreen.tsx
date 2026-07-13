import React, { useState, useCallback, memo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme';
import { getAllStudies, loadRemoteStudies } from '../../services/studyService';
import type { Study, StudyProgress, StudyCategory } from '../../types/study';
import { STUDY_CATEGORY_LABELS } from '../../types/study';
import { HomeStackParamList } from '../../types/navigation';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'StudyLibrary'>;

const GOLD  = '#C9A96B';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const PROGRESS_KEY = '@study_progress_v1';

const StudyCard = memo(function StudyCard({
  study, progress, onPress,
}: {
  study: Study;
  progress: StudyProgress | null;
  onPress: () => void;
}) {
  const done    = progress?.completedDays.length ?? 0;
  const percent = progress ? Math.round((done / study.totalDays) * 100) : 0;

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress}>
      <LinearGradient colors={study.gradient} style={c.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={c.topRow}>
          <Text style={c.icon}>{study.icon}</Text>
          {progress?.finished ? (
            <View style={c.badge}>
              <Ionicons name="checkmark-circle" size={13} color={GOLD} />
              <Text style={c.badgeText}>Completed</Text>
            </View>
          ) : progress ? (
            <View style={c.badge}>
              <Text style={c.badgeText}>{percent}%</Text>
            </View>
          ) : null}
        </View>

        <Text style={[c.title, { fontFamily: SERIF }]}>{study.title}</Text>
        <Text style={c.subtitle}>{study.subtitle}</Text>
        <Text style={c.desc} numberOfLines={2}>{study.description}</Text>

        {progress && !progress.finished && (
          <View style={c.progressTrack}>
            <View style={[c.progressFill, { width: `${percent}%` }]} />
          </View>
        )}

        <View style={c.footer}>
          <Text style={c.meta}>
            {study.totalDays} lessons · ~{study.readingMinutes} min/day
          </Text>
          <View style={c.cta}>
            <Text style={c.ctaText}>{progress?.finished ? 'Review' : progress ? 'Continue' : 'Start'}</Text>
            <Ionicons name="arrow-forward" size={13} color={GOLD} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
});

export default function StudyLibraryScreen() {
  const t          = useTheme();
  const navigation = useNavigation<NavProp>();
  const insets     = useSafeAreaInsets();

  const [studies,     setStudies]     = useState<Study[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, StudyProgress>>({});
  const [category,    setCategory]    = useState<StudyCategory | 'all'>('all');

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        await loadRemoteStudies();
        const raw = await AsyncStorage.getItem(PROGRESS_KEY);
        if (!mounted) return;
        setStudies(getAllStudies());
        setProgressMap(raw ? JSON.parse(raw) : {});
      })();
      return () => { mounted = false; };
    }, []),
  );

  const categories = ['all', ...new Set(studies.map(s => s.category))] as (StudyCategory | 'all')[];
  const filtered   = category === 'all' ? studies : studies.filter(s => s.category === category);

  return (
    <View style={[s.root, { backgroundColor: t.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={t.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: t.text, fontFamily: SERIF }]}>Study Library</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={st => st.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
        ListHeaderComponent={
          <FlatList
            data={categories}
            keyExtractor={cKey => cKey}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chips}
            style={{ marginBottom: 16 }}
            renderItem={({ item: cKey }) => {
              const active = category === cKey;
              return (
                <TouchableOpacity
                  style={[
                    s.chip,
                    { backgroundColor: active ? t.goldBg : t.filterInactiveBg,
                      borderColor: active ? t.goldBorder : t.filterInactiveBorder },
                  ]}
                  onPress={() => setCategory(cKey)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.chipText, { color: active ? GOLD : t.textMuted }]}>
                    {cKey === 'all' ? 'All Studies' : STUDY_CATEGORY_LABELS[cKey]}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        }
        renderItem={({ item }) => (
          <StudyCard
            study={item}
            progress={progressMap[item.id] ?? null}
            onPress={() => navigation.navigate('StudyDetail', { studyId: item.id })}
          />
        )}
      />
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

  list:  { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 130 },
  chips: { gap: 8 },
  chip:  { paddingHorizontal: 15, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '600' },
});

const c = StyleSheet.create({
  card: { borderRadius: 24, padding: 22, marginBottom: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  icon:   { fontSize: 26 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(201,169,107,0.14)', borderRadius: 12,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: GOLD },

  title:    { fontSize: 24, fontWeight: '400', color: 'rgba(255,255,255,0.96)', lineHeight: 30 },
  subtitle: { fontSize: 12, color: 'rgba(201,169,107,0.85)', marginTop: 4, fontWeight: '600' },
  desc:     { fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 19, marginTop: 10 },

  progressTrack: {
    height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.14)',
    marginTop: 14, overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: GOLD },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  meta:   { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  cta:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ctaText: { fontSize: 13, fontWeight: '700', color: GOLD },
});
