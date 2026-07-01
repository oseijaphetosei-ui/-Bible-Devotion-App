import React, { useState, useMemo, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../types/navigation';
import { STORIES, CATEGORIES, CATEGORY_TEXT_COLORS, type Story, type StoryCategory } from '../../data/stories';
import { useTheme } from '../../theme';
import PremiumSearchBar from '../../components/PremiumSearchBar';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const HERO_H = 192;
const CARD_W = '48%';
const CARD_ROW_H = 256;
const LIST_PADDING_TOP = 8;

// ── Hero section ──────────────────────────────────────────────────────────────

const HeroSection = memo(function HeroSection({ onBack, t }: { onBack: () => void; t: any }) {
  const isDark = t.statusBar === 'light-content';
  return (
    <LinearGradient
      colors={isDark
        ? ['rgba(19,22,38,1)', 'rgba(13,15,26,0.92)']
        : ['rgba(237,231,217,1)', 'rgba(237,231,217,0.82)']}
      style={hs.container}
    >
      <View style={hs.navRow}>
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={26} color={t.text} />
        </TouchableOpacity>
      </View>
      <View style={hs.identRow}>
        <Ionicons name="compass-outline" size={14} color={t.accent} />
        <Text style={[hs.identLabel, { color: t.accent }]}>BIBLE STORIES</Text>
      </View>
      <Text style={[hs.quote, { color: t.textMuted }]}>
        {"\"Faith comes by hearing, and hearing\nby the word of God.\"\n— Romans 10:17"}
      </Text>
    </LinearGradient>
  );
});

const hs = StyleSheet.create({
  container:  { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24 },
  navRow:     { marginBottom: 26 },
  identRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  identLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  quote:      { fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
});

// ── Story grid card ───────────────────────────────────────────────────────────

const StoryCard = memo(function StoryCard({
  story, onPress, t,
}: { story: Story; onPress: () => void; t: any }) {
  const tagColor = CATEGORY_TEXT_COLORS[story.category];
  return (
    <TouchableOpacity style={sc.card} onPress={onPress} activeOpacity={0.88}>
      <Image source={story.image} style={sc.image} resizeMode="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(4,5,15,0.55)', 'rgba(4,5,15,0.94)']}
        style={sc.gradient}
      />
      <View style={sc.content}>
        <View style={[sc.catPill, { borderColor: tagColor + '60' }]}>
          <Text style={[sc.catText, { color: tagColor }]}>{story.category.toUpperCase()}</Text>
        </View>
        <Text style={sc.title} numberOfLines={2}>{story.title}</Text>
        <View style={sc.meta}>
          <Text style={[sc.ref, { color: t.gold }]}>{story.reference}</Text>
          <Text style={sc.time}>{story.readTime} min</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const sc = StyleSheet.create({
  card:     { width: CARD_W, borderRadius: 16, overflow: 'hidden', height: 240, backgroundColor: '#0A0B14' },
  image:    { position: 'absolute', width: '100%', height: '100%' },
  gradient: { position: 'absolute', width: '100%', height: '100%' },
  content:  { flex: 1, justifyContent: 'flex-end', padding: 14, gap: 6 },
  catPill: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 5,
    paddingHorizontal: 7, paddingVertical: 3, marginBottom: 2,
  },
  catText:  { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  title:    { fontSize: 14, fontWeight: '700', color: '#F0EFE9', lineHeight: 19 },
  meta:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ref:      { fontSize: 10, fontWeight: '600' },
  time:     { fontSize: 10, color: '#8B8FA8' },
});

// ── Search result row ─────────────────────────────────────────────────────────

const SearchRow = memo(function SearchRow({ story, onPress }: { story: Story; onPress: () => void }) {
  const t = useTheme();
  const tagColor = CATEGORY_TEXT_COLORS[story.category];
  return (
    <TouchableOpacity
      style={[sr.row, { borderBottomColor: t.divider }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Image source={story.image} style={sr.thumb} resizeMode="cover" />
      <View style={sr.info}>
        <Text style={[sr.cat, { color: tagColor }]}>{story.category.toUpperCase()}</Text>
        <Text style={[sr.title, { color: t.text }]} numberOfLines={2}>{story.title}</Text>
        <View style={sr.metaRow}>
          <Text style={[sr.ref, { color: t.gold }]}>{story.reference}</Text>
          <Text style={[sr.time, { color: t.textMuted }]}>{story.readTime} min read</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={14} color={t.textMuted} />
    </TouchableOpacity>
  );
});

const sr = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb:   { width: 66, height: 66, borderRadius: 12 },
  info:    { flex: 1, gap: 3 },
  cat:     { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  title:   { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ref:     { fontSize: 11, fontWeight: '600' },
  time:    { fontSize: 11 },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function StoriesScreen() {
  const navigation = useNavigation<NavProp>();
  const t = useTheme();

  const [activeCategory, setActiveCategory] = useState<StoryCategory | 'All'>('All');
  const [query, setQuery] = useState('');
  const headerAnim = useRef(new Animated.Value(1)).current;

  const onSearchActiveChange = useCallback((active: boolean) => {
    Animated.timing(headerAnim, {
      toValue: active ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [headerAnim]);

  // Grid items (category filter only)
  const gridItems = useMemo(
    () => activeCategory === 'All' ? STORIES : STORIES.filter(s => s.category === activeCategory),
    [activeCategory],
  );

  // Search results (text filter over all stories)
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return STORIES.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.reference.toLowerCase().includes(q) ||
      s.subtitle.toLowerCase().includes(q),
    );
  }, [query]);

  const isSearching = query.trim().length > 0;

  const openStory = useCallback((id: string) => {
    navigation.navigate('StoryReader', { storyId: id });
  }, [navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        {/* Hero — collapses when search is active */}
        <Animated.View
          style={{
            height: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, HERO_H] }),
            opacity: headerAnim,
            overflow: 'hidden',
          }}
        >
          <HeroSection onBack={() => navigation.goBack()} t={t} />
        </Animated.View>

        {/* Search bar */}
        <PremiumSearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search stories, references…"
          onActiveChange={onSearchActiveChange}
          style={{ marginBottom: 4 }}
        />

        {isSearching ? (
          /* ── Search results ──────────────────────────────────────────── */
          searchResults.length === 0 ? (
            <View style={s.emptyWrap}>
              <View style={[s.emptyIconWrap, { backgroundColor: t.filterInactiveBg }]}>
                <Ionicons name="search-outline" size={28} color={t.textMuted} />
              </View>
              <Text style={[s.emptyTitle, { color: t.text }]}>No stories found</Text>
              <Text style={[s.emptySub, { color: t.textMuted }]}>
                Try a title, book name, or category
              </Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingBottom: 120 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <SearchRow story={item} onPress={() => openStory(item.id)} />
              )}
            />
          )
        ) : (
          /* ── Normal grid with category filter ────────────────────────── */
          <>
            {/* Category filter tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.filterContent}
            >
              {(['All', ...CATEGORIES] as const).map((cat) => {
                const isActive = activeCategory === cat;
                const color = cat === 'All' ? t.gold : CATEGORY_TEXT_COLORS[cat as StoryCategory];
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setActiveCategory(cat as any)}
                    style={[
                      s.filterTab,
                      isActive
                        ? { backgroundColor: color + '22', borderColor: color + '80' }
                        : { backgroundColor: t.chipBg, borderColor: t.divider },
                    ]}
                    activeOpacity={0.72}
                  >
                    <View style={[s.filterDot, { backgroundColor: color, opacity: isActive ? 1 : 0.45 }]} />
                    <Text style={[s.filterTabText, { color: isActive ? color : t.text }]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Story count */}
            <Text style={[s.countLabel, { color: t.textMuted }]}>
              {gridItems.length} {gridItems.length === 1 ? 'story' : 'stories'}
            </Text>

            {/* Grid */}
            <FlatList
              data={gridItems}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={s.row}
              contentContainerStyle={s.listContent}
              showsVerticalScrollIndicator={false}
              initialNumToRender={52}
              maxToRenderPerBatch={52}
              windowSize={21}
              removeClippedSubviews
              getItemLayout={(_data, index) => ({
                length: CARD_ROW_H,
                offset: LIST_PADDING_TOP + Math.floor(index / 2) * CARD_ROW_H,
                index,
              })}
              renderItem={({ item }) => (
                <StoryCard
                  story={item}
                  t={t}
                  onPress={() => openStory(item.id)}
                />
              )}
            />
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1 },

  filterContent: { paddingHorizontal: 18, paddingVertical: 10, gap: 8, alignItems: 'center' },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    borderWidth: 1,
  },
  filterDot:     { width: 6, height: 6, borderRadius: 3, marginRight: 6, flexShrink: 0 },
  filterTabText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3, lineHeight: 14 },

  countLabel: {
    fontSize: 11, paddingHorizontal: 20, paddingTop: 2,
    paddingBottom: 6, letterSpacing: 0.4,
  },

  listContent: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 120 },
  row:         { justifyContent: 'space-between', marginBottom: 14 },

  emptyWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle:   { fontSize: 17, fontWeight: '700' },
  emptySub:     { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
