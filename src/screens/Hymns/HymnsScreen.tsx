import React, { useState, useCallback, useMemo, useRef, memo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, TextInput, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { HYMNS, HYMN_CATEGORIES, type Hymn, type HymnCategory } from '../../data/hymns';
import { searchHymns, filterByCategory } from '../../services/hymnService';
import { HYMN_IDS_WITH_AUDIO } from '../../data/hymnAudioMap';
import { useFavorites } from '../../hooks/useFavorites';
import { RootStackParamList } from '../../types/navigation';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// ── Hymn card ─────────────────────────────────────────────────────────────────

const HymnCard = memo(function HymnCard({
  hymn, hasAudio, onPress, text, textSub, textMuted, card, cardBorder, gold, goldBg, goldBorder,
}: {
  hymn: Hymn; hasAudio: boolean; onPress: () => void;
  text: string; textSub: string; textMuted: string;
  card: string; cardBorder: string;
  gold: string; goldBg: string; goldBorder: string;
}) {
  return (
    <TouchableOpacity
      style={[hc.card, { backgroundColor: card, borderColor: cardBorder }]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={hc.left}>
        <View style={hc.info}>
          <Text style={[hc.title, { color: text }]} numberOfLines={1}>{hymn.title}</Text>
          <Text style={[hc.author, { color: textSub }]} numberOfLines={1}>
            {hymn.author} · {hymn.year}
          </Text>
        </View>
      </View>
      <View style={hc.right}>
        {hasAudio && (
          <View style={[hc.audioBadge, { backgroundColor: goldBg, borderColor: goldBorder }]}>
            <Ionicons name="musical-notes" size={11} color={gold} />
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={textMuted} />
      </View>
    </TouchableOpacity>
  );
});

const hc = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 14,
    marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  left: { flex: 1 },
  info: { flex: 1 },
  title:  { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  author: { fontSize: 12 },
  right:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  audioBadge: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
});

// ── Category chip ─────────────────────────────────────────────────────────────

const FILTER_CATEGORIES: Array<HymnCategory | 'All'> = ['All', ...HYMN_CATEGORIES];

// ── Main screen ───────────────────────────────────────────────────────────────

export default function HymnsScreen() {
  const t          = useTheme();
  const navigation = useNavigation<NavProp>();
  const { favorites } = useFavorites();

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
      text={t.text}
      textSub={t.textSub}
      textMuted={t.textMuted}
      card={t.card}
      cardBorder={t.cardBorder}
      gold={t.gold}
      goldBg={t.goldBg}
      goldBorder={t.goldBorder}
    />
  ), [navigation, t]);

  const isDark = t.statusBar === 'light-content';

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={26} color={t.text} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={[s.headerTitle, { color: t.text }]}>Hymnal</Text>
            <Text style={[s.headerSub, { color: t.textMuted }]}>{HYMNS.length} hymns</Text>
          </View>
          <View style={{ width: 34 }} />
        </View>

        {/* Search */}
        <View style={s.searchWrap}>
          <View style={[
            s.searchRow,
            { backgroundColor: t.card, borderColor: focused ? t.gold : t.cardBorder },
          ]}>
            <Ionicons name="search" size={16} color={focused ? t.gold : t.textMuted} />
            <TextInput
              ref={inputRef}
              style={[s.searchInput, { color: t.text }]}
              placeholder="Search by title, author, or lyric…"
              placeholderTextColor={t.textMuted}
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
                <Ionicons name="close-circle" size={17} color={t.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          {focused && (
            <TouchableOpacity
              onPress={handleCancel}
              activeOpacity={0.7}
              style={s.cancelBtn}
            >
              <Text style={[s.cancelText, { color: t.gold }]}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={displayed}
          keyExtractor={h => h.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={!query.trim() ? (
            <View>
              {/* Favorites section */}
              {category === 'All' && (
                <View style={s.featuredSection}>
                  <Text style={[s.sectionLabel, { color: t.textMuted }]}>FAVORITE HYMNS</Text>
                  {favoriteHymns.length > 0 ? (
                    <FlatList
                      data={favoriteHymns}
                      keyExtractor={h => h.id}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={s.featuredList}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[s.featuredCard, {
                            backgroundColor: t.goldBg,
                            borderColor: t.goldBorder,
                          }]}
                          onPress={() => navigation.navigate('HymnReader', { hymnId: item.id })}
                          activeOpacity={0.8}
                        >
                          <View style={s.featuredIconWrap}>
                            <Ionicons name="heart" size={16} color={'#E05C5C'} />
                          </View>
                          <Text style={[s.featuredTitle, { color: t.text }]} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <Text style={[s.featuredAuthor, { color: t.textMuted }]} numberOfLines={1}>
                            {item.author}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                  ) : (
                    <View style={s.favEmpty}>
                      <Ionicons name="heart-outline" size={20} color={t.textMuted} />
                      <Text style={[s.favEmptyText, { color: t.textMuted }]}>
                        Tap ♥ on any hymn to save it here
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Category filters */}
              <Text style={[s.sectionLabel, { color: t.textMuted, marginTop: category === 'All' ? 4 : 0 }]}>
                BROWSE BY CATEGORY
              </Text>
              <FlatList
                data={FILTER_CATEGORIES}
                keyExtractor={c => c}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.chipList}
                renderItem={({ item: cat }) => {
                  const active = category === cat;
                  return (
                    <TouchableOpacity
                      style={[
                        s.chip,
                        { backgroundColor: t.filterInactiveBg, borderColor: t.filterInactiveBorder },
                        active && { backgroundColor: t.goldBg, borderColor: t.goldBorder },
                      ]}
                      onPress={() => handleCategoryPress(cat)}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.chipText, { color: t.textMuted }, active && { color: t.gold }]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />

              {/* Results label */}
              <Text style={[s.sectionLabel, { color: t.textMuted, marginTop: 16 }]}>
                {category === 'All' ? 'ALL HYMNS' : category.toUpperCase()} · {displayed.length}
              </Text>
            </View>
          ) : (
            <Text style={[s.sectionLabel, { color: t.textMuted }]}>
              RESULTS · {displayed.length}
            </Text>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="musical-notes-outline" size={40} color={t.textMuted} />
              <Text style={[s.emptyText, { color: t.textMuted }]}>No hymns found</Text>
            </View>
          }
          renderItem={renderHymn}
        />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: 18, fontWeight: '700' },
  headerSub:    { fontSize: 11, marginTop: 1 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 18, marginBottom: 12, gap: 10,
  },
  searchRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 14 },
  cancelBtn:  { paddingVertical: 4 },
  cancelText: { fontSize: 14, fontWeight: '600' },

  list: { paddingHorizontal: 18, paddingBottom: 120 },

  sectionLabel: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1.2,
    marginBottom: 10,
  },

  featuredSection: { marginBottom: 20 },
  featuredList:    { gap: 10, paddingBottom: 4 },
  featuredCard: {
    width: 130, borderRadius: 14, borderWidth: 1,
    padding: 14, gap: 10,
  },
  featuredIconWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(201,169,107,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  featuredTitle:  { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  featuredAuthor: { fontSize: 11 },

  favEmpty: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 4,
  },
  favEmptyText: { fontSize: 13 },

  chipList: { gap: 8, paddingBottom: 4, marginBottom: 0 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '600' },

  empty: { paddingTop: 60, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 15 },
});
