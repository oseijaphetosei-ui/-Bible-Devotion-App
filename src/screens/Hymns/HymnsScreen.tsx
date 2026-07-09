import React, { useState, useCallback, useMemo, useRef, memo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, TextInput, Keyboard, Platform, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { HYMNS, HYMN_CATEGORIES, type Hymn, type HymnCategory } from '../../data/hymns';
import { searchHymns, filterByCategory } from '../../services/hymnService';
import { HYMN_IDS_WITH_AUDIO } from '../../data/hymnAudioMap';
import { useFavorites } from '../../hooks/useFavorites';
import { RootStackParamList } from '../../types/navigation';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = Math.round(SCREEN_W * 0.55);
const GOLD   = '#C9A96B';
const SERIF  = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function glassStyle(isDark: boolean) {
  return isDark
    ? { backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }
    : { backgroundColor: 'rgba(255,255,255,0.68)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)' };
}

const FILTER_CATEGORIES: Array<HymnCategory | 'All'> = ['All', ...HYMN_CATEGORIES];

// ─── Hymn Card ────────────────────────────────────────────────────────────────

const HymnCard = memo(function HymnCard({
  hymn, hasAudio, onPress, isDark,
}: {
  hymn: Hymn; hasAudio: boolean; onPress: () => void; isDark: boolean;
}) {
  const textColor  = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const subColor   = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(24,18,8,0.55)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.32)' : 'rgba(24,18,8,0.32)';
  const glass = glassStyle(isDark);

  return (
    <TouchableOpacity
      style={[
        hc.card,
        glass,
        {
          shadowColor: isDark ? '#000' : 'rgba(47,42,36,0.10)',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.18 : 1,
          shadowRadius: 8,
          elevation: 3,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={hc.left}>
        <Text style={[hc.title, { color: textColor }]} numberOfLines={1}>{hymn.title}</Text>
        <Text style={[hc.author, { color: subColor }]} numberOfLines={1}>
          {hymn.author} · {hymn.year}
        </Text>
      </View>
      <View style={hc.right}>
        {hasAudio && (
          <View style={[hc.audioBadge, { backgroundColor: 'rgba(201,169,107,0.12)', borderColor: 'rgba(201,169,107,0.30)' }]}>
            <Ionicons name="musical-notes" size={11} color={GOLD} />
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={mutedColor} />
      </View>
    </TouchableOpacity>
  );
});

const hc = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 15,
    marginBottom: 10,
  },
  left:  { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  author: { fontSize: 12 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  audioBadge: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HymnsScreen() {
  const t          = useTheme();
  const navigation = useNavigation<NavProp>();
  const insets     = useSafeAreaInsets();
  const { favorites } = useFavorites();

  const isDark     = t.statusBar === 'light-content';
  const rootBg     = isDark ? '#060810' : '#DDD5C4';
  const textColor  = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';

  const [query,    setQuery]    = useState('');
  const [category, setCategory] = useState<HymnCategory | 'All'>('All');
  const [focused,  setFocused]  = useState(false);
  const inputRef = useRef<TextInput>(null);

  const byAudioFirst = useCallback((a: Hymn, b: Hymn) => {
    const aAudio = HYMN_IDS_WITH_AUDIO.has(a.id) ? 0 : 1;
    const bAudio = HYMN_IDS_WITH_AUDIO.has(b.id) ? 0 : 1;
    return aAudio - bAudio || a.number - b.number;
  }, []);

  const displayed = useMemo(() => {
    const base = query.trim() ? searchHymns(query) : filterByCategory(category);
    return [...base].sort(byAudioFirst);
  }, [query, category, byAudioFirst]);

  const favoriteHymns = useMemo(
    () => HYMNS.filter(h => favorites.has(h.id)),
    [favorites],
  );

  const handleCategoryPress = useCallback((cat: HymnCategory | 'All') => {
    setCategory(cat);
    setQuery('');
  }, []);

  const handleCancel = useCallback(() => {
    setQuery('');
    setFocused(false);
    Keyboard.dismiss();
    inputRef.current?.blur();
  }, []);

  const renderHymn = useCallback(({ item }: { item: Hymn }) => (
    <HymnCard
      hymn={item}
      hasAudio={HYMN_IDS_WITH_AUDIO.has(item.id)}
      onPress={() => navigation.navigate('HymnReader', { hymnId: item.id })}
      isDark={isDark}
    />
  ), [navigation, isDark]);

  return (
    <View style={{ flex: 1, backgroundColor: rootBg }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <FlatList
        data={displayed}
        keyExtractor={h => h.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        windowSize={11}
        maxToRenderPerBatch={10}
        ListHeaderComponent={(
          <View>
            {/* Cinematic hero — scrolls naturally with content */}
            <View style={{ marginHorizontal: -18 }}>
              <View style={{ height: HERO_H, overflow: 'hidden', backgroundColor: '#06080E' }}>
                <ExpoImage
                  source={require('../../assets/intro-background.jpg')}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  priority="high"
                  transition={0}
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)']}
                  locations={[0, 0.3]}
                  style={StyleSheet.absoluteFillObject}
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.80)']}
                  locations={[0, 0.4, 1]}
                  style={StyleSheet.absoluteFillObject}
                />

                {/* Back button */}
                <TouchableOpacity
                  style={[s.heroBackBtn, { top: insets.top + 10 }]}
                  onPress={() => navigation.goBack()}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.90)" />
                </TouchableOpacity>

                {/* Hero content */}
                <View style={s.heroContent}>
                  <View style={s.heroEyebrowRow}>
                    <Ionicons name="musical-notes-outline" size={11} color={GOLD} />
                    <Text style={s.heroEyebrow}>HYMNAL</Text>
                  </View>
                  <Text style={s.heroTitle}>Timeless{'\n'}Hymns of Faith</Text>
                  <Text style={s.heroMeta}>{HYMNS.length} hymns of worship</Text>
                </View>
              </View>
            </View>

            {/* Search */}
            <View style={{ paddingTop: 16 }} />
            <View style={[
              s.searchRow,
              glassStyle(isDark),
              { borderColor: focused ? GOLD : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.88)') },
            ]}>
              <Ionicons name="search" size={16} color={focused ? GOLD : mutedColor} />
              <TextInput
                ref={inputRef}
                style={[s.searchInput, { color: textColor }]}
                placeholder="Search by title, author, or lyric…"
                placeholderTextColor={mutedColor}
                value={query}
                onChangeText={setQuery}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                returnKeyType="search"
                onSubmitEditing={Keyboard.dismiss}
              />
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={() => setQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.6}
                >
                  <Ionicons name="close-circle" size={17} color={mutedColor} />
                </TouchableOpacity>
              )}
              {focused && (
                <TouchableOpacity onPress={handleCancel} activeOpacity={0.7} style={s.cancelBtn}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Favorites */}
            {!query.trim() && category === 'All' && (
              <View style={s.favSection}>
                <Text style={[s.sectionLabel, { color: mutedColor }]}>FAVORITE HYMNS</Text>
                {favoriteHymns.length > 0 ? (
                  <FlatList
                    data={favoriteHymns}
                    keyExtractor={h => h.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[s.favCard, glassStyle(isDark), {
                          borderColor: isDark ? 'rgba(201,169,107,0.22)' : 'rgba(201,169,107,0.35)',
                        }]}
                        onPress={() => navigation.navigate('HymnReader', { hymnId: item.id })}
                        activeOpacity={0.8}
                      >
                        <View style={s.favIconWrap}>
                          <Ionicons name="heart" size={15} color="#E05C5C" />
                        </View>
                        <Text style={[s.favTitle, { color: textColor }]} numberOfLines={2}>{item.title}</Text>
                        <Text style={[s.favAuthor, { color: mutedColor }]} numberOfLines={1}>{item.author}</Text>
                      </TouchableOpacity>
                    )}
                  />
                ) : (
                  <View style={s.favEmpty}>
                    <Ionicons name="heart-outline" size={18} color={mutedColor} />
                    <Text style={[s.favEmptyText, { color: mutedColor }]}>
                      Tap ♥ on any hymn to save it here
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Category filter chips */}
            {!query.trim() && (
              <View>
                <Text style={[s.sectionLabel, { color: mutedColor }]}>BROWSE BY CATEGORY</Text>
                <FlatList
                  data={FILTER_CATEGORIES}
                  keyExtractor={c => c}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingBottom: 4, marginBottom: 4 }}
                  renderItem={({ item: cat }) => {
                    const active = category === cat;
                    return (
                      <TouchableOpacity
                        style={[
                          s.chip,
                          active
                            ? { backgroundColor: 'rgba(201,169,107,0.16)', borderColor: 'rgba(201,169,107,0.40)' }
                            : { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                                borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.09)' },
                        ]}
                        onPress={() => handleCategoryPress(cat)}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.chipText, { color: active ? GOLD : mutedColor }]}>{cat}</Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}

            <Text style={[s.sectionLabel, { color: mutedColor, marginTop: 16 }]}>
              {query.trim() ? `RESULTS · ${displayed.length}` :
                `${category === 'All' ? 'ALL HYMNS' : category.toUpperCase()} · ${displayed.length}`}
            </Text>
          </View>
        )}
        ListEmptyComponent={(
          <View style={s.empty}>
            <Ionicons name="musical-notes-outline" size={40} color={mutedColor} />
            <Text style={[s.emptyText, { color: mutedColor }]}>No hymns found</Text>
          </View>
        )}
        renderItem={renderHymn}
      />
    </View>
  );
}

const s = StyleSheet.create({
  heroBackBtn: {
    position: 'absolute', left: 18,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.30)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 22, paddingBottom: 22,
  },
  heroEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  heroEyebrow:    { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: GOLD },
  heroTitle: {
    fontFamily: SERIF,
    fontSize: 26, fontWeight: '400', lineHeight: 34, letterSpacing: -0.3,
    color: 'rgba(255,255,255,0.96)', marginBottom: 8,
  },
  heroMeta: { fontSize: 12, color: 'rgba(255,255,255,0.42)', letterSpacing: 0.4 },

  list: { paddingHorizontal: 18, paddingBottom: 120 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 20,
  },
  searchInput: { flex: 1, fontSize: 14 },
  cancelBtn:   { paddingLeft: 8 },
  cancelText:  { fontSize: 14, fontWeight: '600', color: GOLD },

  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginBottom: 10 },

  favSection: { marginBottom: 20 },
  favCard: {
    width: 130, borderRadius: 16, padding: 14, gap: 10,
  },
  favIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(224,92,92,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  favTitle:  { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  favAuthor: { fontSize: 11 },
  favEmpty:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14 },
  favEmptyText: { fontSize: 13 },

  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '600' },

  empty:     { paddingTop: 60, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 15 },
});
