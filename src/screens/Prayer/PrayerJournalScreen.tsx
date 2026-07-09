import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable,
  StyleSheet, Animated, StatusBar, Dimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme';
import {
  loadPrayers, getPrayerStats, toggleFavorite, invalidateCache,
} from '../../services/prayerService';
import type { Prayer, PrayerStats } from '../../types/prayer';
import type { HomeStackParamList } from '../../types/navigation';
import { CATEGORY_META, STATUS_META, formatDate } from './prayerConfig';
import type { PrayerStatus } from '../../types/prayer';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const SCREEN_W = Dimensions.get('window').width;
const HERO_H = Math.round(SCREEN_W * 0.95);

const LIGHT_GLASS = {
  backgroundColor: 'rgba(255,255,255,0.62)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.80)',
  shadowColor: 'rgba(47,42,36,0.12)',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 1 as number,
  shadowRadius: 12,
  elevation: 3,
} as const;

const DARK_GLASS = {
  backgroundColor: 'rgba(255,255,255,0.06)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.10)',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.28 as number,
  shadowRadius: 14,
  elevation: 5,
} as const;

// ─── Cinematic Hero ───────────────────────────────────────────────────────────

const CinematicHero = memo(function CinematicHero({
  stats, insets, onBack, onAdd,
}: {
  stats: PrayerStats;
  insets: ReturnType<typeof useSafeAreaInsets>;
  onBack: () => void;
  onAdd: () => void;
}) {
  return (
    <View style={{ height: HERO_H, overflow: 'hidden' }}>
      <ExpoImage
        source={require('../../assets/dove.jpg')}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={350}
        cachePolicy="memory-disk"
      />
      {/* Bottom cinematic scrim */}
      <LinearGradient
        colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.32)', 'rgba(0,0,0,0.88)']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Top safety scrim */}
      <LinearGradient
        colors={['rgba(0,0,0,0.52)', 'rgba(0,0,0,0)']}
        locations={[0, 0.32]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Nav row */}
      <View style={[ch.navRow, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.75}
          style={ch.navBtn}
        >
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.92)" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onAdd}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.75}
          style={ch.navBtn}
        >
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Ionicons name="add" size={22} color="rgba(255,255,255,0.92)" />
        </TouchableOpacity>
      </View>

      {/* Hero content */}
      <View style={ch.contentBlock}>
        <View style={ch.eyebrowRow}>
          <Ionicons name="heart-outline" size={12} color="rgba(201,169,107,0.85)" />
          <Text style={ch.eyebrow}>PRAYER JOURNAL</Text>
        </View>

        <Text style={ch.title}>Your Conversations{'\n'}with God</Text>

        <Text style={ch.scripture}>
          "Do not be anxious about anything, but in{'\n'}everything by prayer…" — Phil 4:6
        </Text>

        {/* Glass stats pill */}
        <View style={ch.statsWrap}>
          <BlurView intensity={38} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 18 }]} />
          <View style={ch.statsInner}>
            <StatPill value={stats.active} label="Active" icon="radio-button-on-outline" />
            <View style={ch.statDivider} />
            <StatPill value={stats.answered} label="Answered" icon="checkmark-circle-outline" />
            <View style={ch.statDivider} />
            <StatPill value={stats.streak} label="Day Streak" icon="flame-outline" />
          </View>
        </View>
      </View>
    </View>
  );
});

function StatPill({ value, label, icon }: { value: number; label: string; icon: string }) {
  return (
    <View style={ch.statItem}>
      <Text style={ch.statValue}>{value}</Text>
      <View style={ch.statLabelRow}>
        <Ionicons name={icon as any} size={10} color="rgba(255,255,255,0.45)" />
        <Text style={ch.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

const ch = StyleSheet.create({
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  contentBlock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.2,
    color: 'rgba(201,169,107,0.85)',
  },
  title: {
    fontSize: 36,
    fontFamily: 'Georgia',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.96)',
    lineHeight: 46,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  scripture: {
    fontSize: 13,
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.48)',
    lineHeight: 20,
    marginBottom: 20,
  },
  statsWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  statsInner: {
    flexDirection: 'row',
    paddingVertical: 14,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.14)' },
  statValue: { fontSize: 22, fontWeight: '700', color: 'rgba(255,255,255,0.92)', letterSpacing: -0.3 },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statLabel: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.45)' },
});

// ─── Filter Row ───────────────────────────────────────────────────────────────

function FilterRow({ active, onChange }: {
  active: PrayerStatus | 'all';
  onChange: (f: PrayerStatus | 'all') => void;
}) {
  const t = useTheme();
  const isDark = t.statusBar === 'light-content';
  const filters: Array<{ key: PrayerStatus | 'all'; label: string; icon?: string }> = [
    { key: 'all',      label: 'All' },
    { key: 'active',   label: 'Active',   icon: STATUS_META.active.icon },
    { key: 'waiting',  label: 'Waiting',  icon: STATUS_META.waiting.icon },
    { key: 'answered', label: 'Answered', icon: STATUS_META.answered.icon },
    { key: 'ongoing',  label: 'Ongoing',  icon: STATUS_META.ongoing.icon },
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
        const glassStyle = isDark ? DARK_GLASS : LIGHT_GLASS;
        return (
          <Pressable
            key={f.key}
            style={[
              fr.chip,
              isActive
                ? { backgroundColor: color + '22', borderColor: color + '55', borderWidth: 1 }
                : { ...glassStyle, borderRadius: 20 },
            ]}
            onPress={() => onChange(f.key)}
          >
            <View style={fr.chipContent}>
              {f.icon && (
                <Ionicons
                  name={f.icon as any}
                  size={11}
                  color={isActive ? color : t.textMuted}
                />
              )}
              <Text style={[fr.chipLabel, { color: isActive ? color : t.textMuted }]}>
                {f.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const fr = StyleSheet.create({
  row: { paddingHorizontal: 18, paddingVertical: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    overflow: 'hidden',
  },
  chipContent: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  chipLabel: { fontSize: 13, fontWeight: '500' },
});

// ─── Prayer Card ──────────────────────────────────────────────────────────────

const PrayerCard = memo(function PrayerCard({
  prayer, onPress, onFavorite,
}: {
  prayer: Prayer;
  onPress: () => void;
  onFavorite: () => void;
}) {
  const t = useTheme();
  const isDark = t.statusBar === 'light-content';
  const status = STATUS_META[prayer.status];
  const cat = CATEGORY_META[prayer.category];
  const glassStyle = isDark ? DARK_GLASS : LIGHT_GLASS;

  const favAnim = useRef(new Animated.Value(prayer.isFavorite ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(favAnim, { toValue: prayer.isFavorite ? 1 : 0, tension: 180, friction: 10, useNativeDriver: true }).start();
  }, [prayer.isFavorite, favAnim]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        pc.card,
        glassStyle,
        { borderRadius: 18, overflow: 'hidden' },
        pressed && { opacity: 0.78 },
      ]}
    >
      {/* Status accent bar */}
      <View style={[pc.accentBar, { backgroundColor: status.color }]} />

      <View style={pc.body}>
        <View style={pc.topRow}>
          <Text style={[pc.title, { color: t.text }]} numberOfLines={1}>{prayer.title}</Text>
          <Pressable
            hitSlop={10}
            onPress={e => { e.stopPropagation(); onFavorite(); }}
          >
            <Animated.View style={{ transform: [{ scale: favAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) }] }}>
              <Ionicons
                name={prayer.isFavorite ? 'bookmark' : 'bookmark-outline'}
                size={15}
                color={prayer.isFavorite ? t.gold : t.textMuted}
              />
            </Animated.View>
          </Pressable>
        </View>

        <Text style={[pc.preview, { color: t.textMuted }]} numberOfLines={2}>
          {prayer.content || 'No content yet.'}
        </Text>

        <View style={pc.metaRow}>
          <Text style={[pc.metaDate, { color: t.textMuted }]}>{formatDate(prayer.createdAt)}</Text>
          <View style={[pc.metaDot, { backgroundColor: t.textMuted }]} />
          <View style={[pc.catBadge, { backgroundColor: cat.color + '22' }]}>
            <Text style={[pc.catLabel, { color: cat.color }]}>{cat.label}</Text>
          </View>
          {prayer.bibleRef && (
            <>
              <View style={[pc.metaDot, { backgroundColor: t.textMuted }]} />
              <Ionicons name="book-outline" size={10} color={t.textMuted} />
              <Text style={[pc.metaRef, { color: t.textMuted }]}>{prayer.bibleRef.label}</Text>
            </>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={13} color={t.textMuted} style={{ marginTop: 2, marginRight: 4 }} />
    </Pressable>
  );
});

const pc = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingRight: 12,
  },
  accentBar: { width: 3, alignSelf: 'stretch', borderRadius: 0, marginRight: 14 },
  body: { flex: 1, marginRight: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  title: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8, letterSpacing: 0.05 },
  preview: { fontSize: 13, lineHeight: 20, marginBottom: 8, fontFamily: 'Georgia', fontStyle: 'italic' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  metaDate: { fontSize: 11, fontWeight: '500' },
  metaDot: { width: 2, height: 2, borderRadius: 1, opacity: 0.4 },
  catBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  catLabel: { fontSize: 10, fontWeight: '600' },
  metaRef: { fontSize: 11 },
});

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onStart }: { onStart: () => void }) {
  const t = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 520, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[es.container, { opacity: fadeAnim }]}>
      <View style={es.iconArea}>
        <View style={[es.ring, { borderColor: t.goldBorder }]} />
        <View style={[es.iconWrap, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}>
          <Ionicons name="heart-outline" size={26} color={t.gold} />
        </View>
      </View>
      <Text style={[es.heading, { color: t.text, fontFamily: 'Georgia' }]}>
        Every prayer begins{'\n'}with a conversation.
      </Text>
      <Text style={[es.body, { color: t.textMuted }]}>
        This is your sacred space to pour out your heart, bring your needs before God, and witness His faithfulness over time.
      </Text>
      <TouchableOpacity
        style={[es.btn, { backgroundColor: t.gold }]}
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
  iconArea: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  ring: { position: 'absolute', width: 88, height: 88, borderRadius: 44, borderWidth: 1, opacity: 0.5 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  heading: { fontSize: 22, fontWeight: '400', textAlign: 'center', lineHeight: 32, marginBottom: 14 },
  body: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 32 },
  btn: { borderRadius: 30, paddingVertical: 14, paddingHorizontal: 32 },
  btnLabel: { fontSize: 15, fontWeight: '700', color: '#08071A' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PrayerJournalScreen() {
  const navigation = useNavigation<Nav>();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const fabBottom = Math.max(insets.bottom, 8) + 8 + 66 + 12;

  const [prayers, setPrayers]   = useState<Prayer[]>([]);
  const [stats, setStats]       = useState<PrayerStats>({ total: 0, active: 0, answered: 0, waiting: 0, ongoing: 0, streak: 0 });
  const [filter, setFilter]     = useState<PrayerStatus | 'all'>('all');
  const [loading, setLoading]   = useState(true);

  const fabAnim = useRef(new Animated.Value(0)).current;

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

  const isDark = t.statusBar === 'light-content';
  const rootBg = isDark ? '#060810' : '#DDD5C4';

  return (
    <View style={{ flex: 1, backgroundColor: rootBg }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <CinematicHero
          stats={stats}
          insets={insets}
          onBack={() => navigation.goBack()}
          onAdd={() => navigation.navigate('PrayerEditor', undefined)}
        />

        <FilterRow active={filter} onChange={setFilter} />

        <View style={{ paddingHorizontal: 18, gap: 10 }}>
          {displayed.length === 0 && !loading ? (
            <EmptyState onStart={() => navigation.navigate('PrayerEditor', undefined)} />
          ) : (
            <>
              {filter === 'all' && favorites.length > 0 && (
                <View style={{ gap: 10 }}>
                  <Text style={[sl.label, { color: t.textMuted }]}>PINNED</Text>
                  {favorites.map(p => (
                    <PrayerCard
                      key={p.id}
                      prayer={p}
                      onPress={() => navigation.navigate('PrayerDetail', { prayerId: p.id })}
                      onFavorite={() => handleFavorite(p.id)}
                    />
                  ))}
                  <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.divider, marginVertical: 8 }} />
                </View>
              )}

              {(filter === 'all' ? displayed.filter(p => !p.isFavorite) : displayed).map(p => (
                <PrayerCard
                  key={p.id}
                  prayer={p}
                  onPress={() => navigation.navigate('PrayerDetail', { prayerId: p.id })}
                  onFavorite={() => handleFavorite(p.id)}
                />
              ))}
            </>
          )}
        </View>
      </ScrollView>

      <Animated.View
        style={[
          fab.btn,
          {
            bottom: fabBottom,
            backgroundColor: t.gold,
            opacity: fabAnim,
            transform: [{ scale: fabAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('PrayerEditor', undefined)}
          activeOpacity={0.85}
          style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
          accessibilityLabel="New Prayer"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={28} color="#08071A" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const sl = StyleSheet.create({
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 4, marginLeft: 4 },
});

const fab = StyleSheet.create({
  btn: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },
});
