import React, { useState, useCallback, useRef, memo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Alert, Animated,
  Dimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../theme';
import type { AppTheme } from '../../theme';
import type { RootStackParamList } from '../../types/navigation';
import { getSermons, deleteSermon, toggleSermonFavorite } from '../../services/sermonService';
import type { SermonDraft } from '../../types/sermon';

const SCREEN_W = Dimensions.get('window').width;
const HERO_H   = Math.round(SCREEN_W * 0.92);

const LIGHT_GLASS = {
  backgroundColor: 'rgba(255,255,255,0.62)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.80)',
  shadowColor: 'rgba(47,42,36,0.12)',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 1 as number,
  shadowRadius: 12,
  elevation: 3,
};

const DARK_GLASS = {
  backgroundColor: 'rgba(255,255,255,0.06)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.10)',
  shadowColor: '#000' as string,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.28 as number,
  shadowRadius: 14,
  elevation: 5,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

const FEATURE_PILLS = [
  { icon: 'people-outline', label: 'Audience-Tailored' },
  { icon: 'book-outline', label: 'Scripture-Grounded' },
  { icon: 'bulb-outline', label: 'Rich Illustrations' },
  { icon: 'star-outline', label: 'Memory Verse' },
  { icon: 'heart-outline', label: 'Prayers Included' },
  { icon: 'people-circle-outline', label: 'Discussion Guide' },
  { icon: 'musical-notes-outline', label: 'Worship Songs' },
];

// ─── Cinematic Hero ───────────────────────────────────────────────────────────

const CinematicHero = memo(function CinematicHero({
  insets, onBack, onNew, ctaScale, sermonCount,
}: {
  insets: { top: number };
  onBack: () => void;
  onNew: () => void;
  ctaScale: Animated.Value;
  sermonCount: number;
}) {
  return (
    <View style={{ height: HERO_H, overflow: 'hidden' }}>
      <ExpoImage
        source={require('../../assets/apostles.jpg')}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={350}
        cachePolicy="memory-disk"
      />
      {/* Bottom gradient scrim */}
      <LinearGradient
        colors={['rgba(0,0,0,0.04)', 'rgba(0,0,0,0.28)', 'rgba(0,0,0,0.90)']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Top gradient for status bar / back button legibility */}
      <LinearGradient
        colors={['rgba(0,0,0,0.48)', 'rgba(0,0,0,0)']}
        locations={[0, 0.3]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top nav row */}
      <View style={[heroS.topRow, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onBack} style={heroS.topBtn} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.92)" />
        </TouchableOpacity>
        {sermonCount > 0 && (
          <BlurView intensity={20} tint="dark" style={heroS.countPill}>
            <Ionicons name="library-outline" size={11} color="rgba(255,255,255,0.72)" />
            <Text style={heroS.countPillText}>{sermonCount} saved</Text>
          </BlurView>
        )}
      </View>

      {/* Bottom content block */}
      <View style={heroS.content}>
        <Text style={heroS.eyebrow}>AI SERMON BUILDER</Text>
        <Text style={heroS.title}>Craft Your{'\n'}Best Message.</Text>
        <Text style={heroS.sub}>
          Scripture-rooted. Audience-tailored.{'\n'}
          Supporting your pastoral heart.
        </Text>
        <Animated.View style={{ transform: [{ scale: ctaScale }], marginTop: 22, alignSelf: 'flex-start' }}>
          <TouchableOpacity style={heroS.cta} onPress={onNew} activeOpacity={1}>
            <Ionicons name="sparkles" size={16} color="#08071A" />
            <Text style={heroS.ctaText}>Build a New Sermon</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
});

const heroS = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  topBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  countPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.78)',
  },
  content: {
    position: 'absolute',
    bottom: 28,
    left: 22,
    right: 22,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.4,
    color: 'rgba(201,169,107,0.88)',
    marginBottom: 10,
  },
  title: {
    fontSize: 38,
    fontFamily: 'Georgia',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.96)',
    lineHeight: 48,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  sub: {
    fontSize: 13,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.52)',
    fontStyle: 'italic',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#C9A96B',
    borderRadius: 30,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#08071A',
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SermonBuilderHub() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isDark = t.statusBar === 'light-content';

  const [sermons, setSermons] = useState<SermonDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const ctaScale = useRef(new Animated.Value(1)).current;

  const load = useCallback(async () => {
    try {
      const data = await getSermons();
      setSermons(data);
    } catch {
      setSermons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleCtaPress = useCallback(() => {
    Animated.sequence([
      Animated.spring(ctaScale, { toValue: 0.95, tension: 200, friction: 10, useNativeDriver: true }),
      Animated.spring(ctaScale, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }),
    ]).start(() => (navigation as any).navigate('SermonWizard'));
  }, [ctaScale, navigation]);

  const handleDelete = useCallback((sermon: SermonDraft) => {
    Alert.alert(
      'Delete Sermon',
      `Delete "${sermon.selectedTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            await deleteSermon(sermon.id);
            setSermons(prev => prev.filter(s => s.id !== sermon.id));
          },
        },
      ],
    );
  }, []);

  const handleToggleFavorite = useCallback(async (sermon: SermonDraft) => {
    await toggleSermonFavorite(sermon);
    setSermons(prev => prev.map(s =>
      s.id === sermon.id ? { ...s, isFavorite: !s.isFavorite } : s,
    ));
  }, []);

  const favorites = sermons.filter(s => s.isFavorite);
  const recent    = sermons.filter(s => !s.isFavorite).slice(0, 10);
  const totalDuration = sermons.reduce((sum, s) => sum + s.duration, 0);
  const glassStyle = isDark ? DARK_GLASS : LIGHT_GLASS;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
      >
        {/* Cinematic Hero */}
        <CinematicHero
          insets={insets}
          onBack={() => navigation.goBack()}
          onNew={handleCtaPress}
          ctaScale={ctaScale}
          sermonCount={sermons.length}
        />

        {/* Stats row — only when there are saved sermons */}
        {!loading && sermons.length > 0 && (
          <View style={[s.statsRow, glassStyle, { borderRadius: 18 }]}>
            <View style={s.statItem}>
              <Text style={[s.statNum, { color: t.text }]}>{sermons.length}</Text>
              <Text style={[s.statLabel, { color: t.textMuted }]}>Sermons</Text>
            </View>
            <View style={[s.statDivider, { backgroundColor: t.divider }]} />
            <View style={s.statItem}>
              <Text style={[s.statNum, { color: t.gold }]}>{favorites.length}</Text>
              <Text style={[s.statLabel, { color: t.textMuted }]}>Saved</Text>
            </View>
            <View style={[s.statDivider, { backgroundColor: t.divider }]} />
            <View style={s.statItem}>
              <Text style={[s.statNum, { color: t.accent }]}>{totalDuration}</Text>
              <Text style={[s.statLabel, { color: t.textMuted }]}>Total min</Text>
            </View>
          </View>
        )}

        {/* Feature pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.pillsRow}
          style={{ flexGrow: 0 }}
        >
          {FEATURE_PILLS.map(f => (
            <View key={f.label} style={[s.featurePill, glassStyle, { borderRadius: 20 }]}>
              <Ionicons name={f.icon as any} size={12} color={t.gold} />
              <Text style={[s.featurePillText, { color: t.textSub }]}>{f.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Library */}
        {!loading && sermons.length === 0 ? (
          <View style={s.empty}>
            <View style={[s.emptyIcon, glassStyle, { borderRadius: 24 }]}>
              <Ionicons name="library-outline" size={36} color={t.gold} />
            </View>
            <Text style={[s.emptyTitle, { color: t.text, fontFamily: 'Georgia' }]}>
              Your sermon library is empty
            </Text>
            <Text style={[s.emptySub, { color: t.textMuted }]}>
              Build your first AI sermon to begin your personal library of ministry resources.
            </Text>
          </View>
        ) : (
          <View style={s.library}>
            {favorites.length > 0 && (
              <>
                <View style={s.sectionHead}>
                  <Ionicons name="bookmark" size={13} color={t.gold} />
                  <Text style={[s.sectionLabel, { color: t.textMuted }]}>SAVED</Text>
                </View>
                {favorites.map(sr => (
                  <SermonCard
                    key={sr.id}
                    sermon={sr}
                    isDark={isDark}
                    onOpen={() => (navigation as any).navigate('SermonResult', { sermonId: sr.id })}
                    onFavorite={() => handleToggleFavorite(sr)}
                    onDelete={() => handleDelete(sr)}
                  />
                ))}
              </>
            )}

            {recent.length > 0 && (
              <>
                <View style={[s.sectionHead, favorites.length > 0 && { marginTop: 8 }]}>
                  <Ionicons name="time-outline" size={13} color={t.textMuted} />
                  <Text style={[s.sectionLabel, { color: t.textMuted }]}>RECENT</Text>
                </View>
                {recent.map(sr => (
                  <SermonCard
                    key={sr.id}
                    sermon={sr}
                    isDark={isDark}
                    onOpen={() => (navigation as any).navigate('SermonResult', { sermonId: sr.id })}
                    onFavorite={() => handleToggleFavorite(sr)}
                    onDelete={() => handleDelete(sr)}
                  />
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Sermon Card ──────────────────────────────────────────────────────────────

function SermonCard({
  sermon, isDark, onOpen, onFavorite, onDelete,
}: {
  sermon: SermonDraft;
  isDark: boolean;
  onOpen: () => void;
  onFavorite: () => void;
  onDelete: () => void;
}) {
  const t = useTheme();
  const glassStyle = isDark ? DARK_GLASS : LIGHT_GLASS;
  return (
    <TouchableOpacity
      style={[sc.card, glassStyle, { overflow: 'hidden' }]}
      onPress={onOpen}
      activeOpacity={0.82}
    >
      {/* Left accent bar */}
      <View style={[sc.accent, { backgroundColor: sermon.isFavorite ? t.gold : t.accentBorder }]} />

      <View style={sc.body}>
        <Text style={[sc.title, { color: t.text }]} numberOfLines={2}>{sermon.selectedTitle}</Text>

        <View style={sc.chips}>
          <View style={[sc.chip, { backgroundColor: t.goldBg, borderWidth: 1, borderColor: t.goldBorder }]}>
            <Text style={[sc.chipText, { color: t.gold }]}>{sermon.sermonType}</Text>
          </View>
          <View style={[sc.chip, { backgroundColor: t.filterInactiveBg }]}>
            <Text style={[sc.chipText, { color: t.textSub }]}>{sermon.duration} min</Text>
          </View>
        </View>

        <View style={sc.footer}>
          <Text style={[sc.audience, { color: t.textMuted }]} numberOfLines={1}>{sermon.audienceLabel}</Text>
          <Text style={[sc.date, { color: t.textMuted }]}>{formatDate(sermon.createdAt)}</Text>
        </View>
      </View>

      <View style={sc.actions}>
        <TouchableOpacity
          onPress={onFavorite}
          hitSlop={{ top: 8, bottom: 8, left: 10, right: 10 }}
          style={sc.actionBtn}
        >
          <Ionicons
            name={sermon.isFavorite ? 'bookmark' : 'bookmark-outline'}
            size={19}
            color={sermon.isFavorite ? t.gold : t.textMuted}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 10, right: 10 }}
          style={sc.actionBtn}
        >
          <Ionicons name="trash-outline" size={17} color={t.textMuted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 18,
    padding: 16,
  },
  statItem:    { flex: 1, alignItems: 'center', gap: 4 },
  statNum:     { fontSize: 22, fontWeight: '800' },
  statLabel:   { fontSize: 11, fontWeight: '500' },
  statDivider: { width: StyleSheet.hairlineWidth, marginVertical: 4 },

  pillsRow: { paddingHorizontal: 16, paddingVertical: 16, gap: 8 },
  featurePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 13, paddingVertical: 8,
  },
  featurePillText: { fontSize: 12, fontWeight: '600' },

  library: { paddingHorizontal: 16, gap: 10 },
  sectionHead: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 4, marginTop: 4,
  },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.6 },

  empty: { alignItems: 'center', paddingTop: 48, gap: 14, paddingHorizontal: 40 },
  emptyIcon: {
    width: 80, height: 80,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '400', textAlign: 'center' },
  emptySub:   { fontSize: 14, lineHeight: 22, textAlign: 'center' },
});

const sc = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 18,
  },
  accent: { width: 4 },
  body:   { flex: 1, padding: 16, gap: 10 },
  title:  { fontSize: 15, fontWeight: '700', lineHeight: 22 },
  chips:  { flexDirection: 'row', gap: 6 },
  chip:   { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  chipText: { fontSize: 11, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  audience: { fontSize: 11, flex: 1, marginRight: 8 },
  date:   { fontSize: 11 },
  actions: { justifyContent: 'center', gap: 0, paddingRight: 4 },
  actionBtn: { padding: 12 },
});
