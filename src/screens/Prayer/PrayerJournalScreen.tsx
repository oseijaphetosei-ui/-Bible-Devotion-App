import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable,
  StyleSheet, Animated, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import {
  loadPrayers, getPrayerStats, toggleFavorite, invalidateCache,
} from '../../services/prayerService';
import type { Prayer, PrayerStats } from '../../types/prayer';
import type { HomeStackParamList } from '../../types/navigation';
import { CATEGORY_META, STATUS_META, formatDate, PRAYER_STATUSES } from './prayerConfig';
import type { PrayerStatus } from '../../types/prayer';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

// ─── Hero Section ─────────────────────────────────────────────────────────────

const HeroSection = memo(function HeroSection({ stats }: { stats: PrayerStats }) {
  const t = useTheme();
  const isDark = t.statusBar === 'light-content';

  return (
    <LinearGradient
      colors={isDark
        ? ['rgba(19,22,38,1)', 'rgba(13,15,26,0.92)']
        : ['rgba(237,231,217,1)', 'rgba(237,231,217,0.82)']}
      style={hs.container}
    >
      {/* Journal identity */}
      <View style={hs.topRow}>
        <Ionicons name="book-outline" size={18} color={t.accent} />
        <Text style={[hs.label, { color: t.accent }]}>PRAYER JOURNAL</Text>
      </View>

      <Text style={[hs.heading, { color: t.text }]}>
        Your Conversations{'\n'}with God
      </Text>

      <Text style={[hs.quote, { color: t.textMuted }]}>
        "Do not be anxious about anything, but in everything by prayer…"{'\n'}
        — Philippians 4:6
      </Text>

      {/* Stats */}
      <View style={[hs.statsRow, { borderTopColor: t.divider }]}>
        <View style={hs.statItem}>
          <Text style={[hs.statValue, { color: t.text }]}>{stats.active}</Text>
          <Text style={[hs.statLabel, { color: t.textMuted }]}>🙏 Active</Text>
        </View>
        <View style={[hs.statDivider, { backgroundColor: t.divider }]} />
        <View style={hs.statItem}>
          <Text style={[hs.statValue, { color: t.text }]}>{stats.answered}</Text>
          <Text style={[hs.statLabel, { color: t.textMuted }]}>✨ Answered</Text>
        </View>
        <View style={[hs.statDivider, { backgroundColor: t.divider }]} />
        <View style={hs.statItem}>
          <Text style={[hs.statValue, { color: t.text }]}>{stats.streak}</Text>
          <Text style={[hs.statLabel, { color: t.textMuted }]}>📖 Day Streak</Text>
        </View>
      </View>
    </LinearGradient>
  );
});

const hs = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 0,
    marginBottom: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 36,
    marginBottom: 14,
  },
  quote: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 18,
    paddingBottom: 20,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
  statValue: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  statLabel: { fontSize: 11, fontWeight: '500' },
});

// ─── Status Filter Row ────────────────────────────────────────────────────────

function FilterRow({ active, onChange }: {
  active: PrayerStatus | 'all';
  onChange: (f: PrayerStatus | 'all') => void;
}) {
  const t = useTheme();
  const filters: Array<{ key: PrayerStatus | 'all'; label: string }> = [
    { key: 'all',      label: 'All' },
    { key: 'active',   label: '🙏 Active' },
    { key: 'waiting',  label: '⏳ Waiting' },
    { key: 'answered', label: '✨ Answered' },
    { key: 'ongoing',  label: '❤️ Ongoing' },
  ];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={fr.row}
    >
      {filters.map(f => {
        const isActive = active === f.key;
        const color = f.key !== 'all' ? STATUS_META[f.key as PrayerStatus].color : t.accent;
        return (
          <Pressable
            key={f.key}
            style={[
              fr.chip,
              {
                backgroundColor: isActive ? color + '22' : t.card,
                borderColor: isActive ? color + '55' : t.inputBorder,
              },
            ]}
            onPress={() => onChange(f.key)}
          >
            <Text style={[fr.chipLabel, { color: isActive ? color : t.textMuted }]}>
              {f.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const fr = StyleSheet.create({
  row: { paddingHorizontal: 20, paddingVertical: 14, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipLabel: { fontSize: 13, fontWeight: '500' },
});

// ─── Prayer Entry (Timeline Row) ──────────────────────────────────────────────

const PrayerEntry = memo(function PrayerEntry({
  prayer, onPress, onFavorite,
}: {
  prayer: Prayer;
  onPress: () => void;
  onFavorite: () => void;
}) {
  const t = useTheme();
  const status = STATUS_META[prayer.status];
  const cat = CATEGORY_META[prayer.category];
  const favAnim = useRef(new Animated.Value(prayer.isFavorite ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(favAnim, { toValue: prayer.isFavorite ? 1 : 0, tension: 180, friction: 10, useNativeDriver: true }).start();
  }, [prayer.isFavorite, favAnim]);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pe.row, pressed && { opacity: 0.75 }]}>
      {/* Status colour strip */}
      <View style={[pe.strip, { backgroundColor: status.color }]} />

      <View style={pe.body}>
        <View style={pe.topRow}>
          <Text style={[pe.title, { color: t.text }]} numberOfLines={1}>{prayer.title}</Text>
          <Pressable
            hitSlop={10}
            onPress={e => { e.stopPropagation(); onFavorite(); }}
          >
            <Animated.View style={{ transform: [{ scale: favAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }] }}>
              <Ionicons
                name={prayer.isFavorite ? 'bookmark' : 'bookmark-outline'}
                size={15}
                color={prayer.isFavorite ? t.gold : t.textMuted}
              />
            </Animated.View>
          </Pressable>
        </View>

        <Text style={[pe.preview, { color: t.textMuted }]} numberOfLines={2}>
          {prayer.content || 'No content yet.'}
        </Text>

        <View style={pe.metaRow}>
          <Text style={[pe.metaDate, { color: t.textMuted }]}>{formatDate(prayer.createdAt)}</Text>
          <View style={[pe.metaDot, { backgroundColor: t.textMuted }]} />
          <View style={[pe.catBadge, { backgroundColor: cat.color + '22' }]}>
            <Text style={[pe.catLabel, { color: cat.color }]}>{cat.label}</Text>
          </View>
          {prayer.bibleRef && (
            <>
              <View style={[pe.metaDot, { backgroundColor: t.textMuted }]} />
              <Ionicons name="book-outline" size={10} color={t.textMuted} />
              <Text style={[pe.metaRef, { color: t.textMuted }]}>{prayer.bibleRef.label}</Text>
            </>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={14} color={t.textMuted} style={{ marginTop: 2 }} />
    </Pressable>
  );
});

const pe = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingRight: 16,
  },
  strip: { width: 3, alignSelf: 'stretch', borderRadius: 2, marginRight: 14, marginLeft: 20 },
  body: { flex: 1, marginRight: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  title: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8, letterSpacing: 0.1 },
  preview: { fontSize: 13, lineHeight: 19, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  metaDate: { fontSize: 11, fontWeight: '500' },
  metaDot: { width: 2, height: 2, borderRadius: 1, opacity: 0.4 },
  catBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  catLabel: { fontSize: 10, fontWeight: '600' },
  metaRef: { fontSize: 11 },
});

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  const t = useTheme();
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: t.divider, marginLeft: 37 }]} />;
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onStart }: { onStart: () => void }) {
  const t = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[es.container, { opacity: fadeAnim }]}>
      <View style={[es.iconWrap, { backgroundColor: t.accentBg }]}>
        <Ionicons name="chatbubble-ellipses-outline" size={36} color={t.accent} />
      </View>
      <Text style={[es.heading, { color: t.text }]}>Every prayer begins{'\n'}with a conversation.</Text>
      <Text style={[es.body, { color: t.textMuted }]}>
        This is your sacred space to pour out your heart, bring your needs before God, and witness His faithfulness over time.
      </Text>
      <TouchableOpacity
        style={[es.btn, { backgroundColor: t.accent }]}
        onPress={onStart}
        activeOpacity={0.82}
      >
        <Text style={es.btnLabel}>Start Your First Prayer</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const es = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 36, paddingVertical: 48 },
  iconWrap: { width: 76, height: 76, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  heading: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, textAlign: 'center', lineHeight: 30, marginBottom: 12 },
  body: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 32 },
  btn: { borderRadius: 30, paddingVertical: 14, paddingHorizontal: 32 },
  btnLabel: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PrayerJournalScreen() {
  const navigation = useNavigation<Nav>();
  const t = useTheme();

  const [prayers, setPrayers]   = useState<Prayer[]>([]);
  const [stats, setStats]       = useState<PrayerStats>({ total: 0, active: 0, answered: 0, waiting: 0, ongoing: 0, streak: 0 });
  const [filter, setFilter]     = useState<PrayerStatus | 'all'>('all');
  const [loading, setLoading]   = useState(true);

  const fabAnim  = useRef(new Animated.Value(0)).current;

  const reload = useCallback(async () => {
    setLoading(true);
    invalidateCache();
    const [all, s] = await Promise.all([loadPrayers(), getPrayerStats()]);
    setPrayers(all);
    setStats(s);
    setLoading(false);
    Animated.spring(fabAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }).start();
  }, [fabAnim]);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const handleFavorite = useCallback(async (id: string) => {
    const updated = await toggleFavorite(id);
    if (updated) {
      setPrayers(prev => prev.map(p => p.id === id ? updated : p));
    }
  }, []);

  const displayed = filter === 'all'
    ? prayers
    : prayers.filter(p => p.status === filter);

  const favorites = prayers.filter(p => p.isFavorite && (filter === 'all' || p.status === filter));

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        {/* Sticky header */}
        <View style={[sc.header, { borderBottomColor: t.divider }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={12}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={t.text} />
          </TouchableOpacity>
          <Text style={[sc.headerTitle, { color: t.text }]}>Prayer Journal</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('PrayerEditor', undefined)}
            hitSlop={12}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color={t.accent} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Hero */}
          <HeroSection stats={stats} />

          {/* Filter */}
          <FilterRow active={filter} onChange={setFilter} />

          {/* Timeline */}
          {displayed.length === 0 && !loading ? (
            <EmptyState onStart={() => navigation.navigate('PrayerEditor', undefined)} />
          ) : (
            <View style={[sc.list, { borderColor: t.divider }]}>
              {/* Pinned favorites (only in 'all' filter) */}
              {filter === 'all' && favorites.length > 0 && (
                <>
                  <Text style={[sc.sectionLabel, { color: t.textMuted, paddingHorizontal: 20 }]}>
                    PINNED
                  </Text>
                  {favorites.map((p, i) => (
                    <React.Fragment key={p.id}>
                      <PrayerEntry
                        prayer={p}
                        onPress={() => navigation.navigate('PrayerDetail', { prayerId: p.id })}
                        onFavorite={() => handleFavorite(p.id)}
                      />
                      {i < favorites.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                  <View style={[sc.sectionSep, { backgroundColor: t.divider }]} />
                </>
              )}

              {/* All (or filtered) prayers */}
              {(filter === 'all' ? displayed.filter(p => !p.isFavorite) : displayed).map((p, i, arr) => (
                <React.Fragment key={p.id}>
                  <PrayerEntry
                    prayer={p}
                    onPress={() => navigation.navigate('PrayerDetail', { prayerId: p.id })}
                    onFavorite={() => handleFavorite(p.id)}
                  />
                  {i < arr.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </View>
          )}
        </ScrollView>

        {/* FAB */}
        <Animated.View
          style={[sc.fab, {
            backgroundColor: t.accent,
            opacity: fabAnim,
            transform: [{ scale: fabAnim }],
          }]}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('PrayerEditor', undefined)}
            activeOpacity={0.85}
            style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
            accessibilityLabel="New Prayer"
            accessibilityRole="button"
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const sc = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  list: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginTop: 20,
    marginBottom: 4,
  },
  sectionSep: { height: StyleSheet.hairlineWidth, marginHorizontal: 20, marginVertical: 8 },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
});
