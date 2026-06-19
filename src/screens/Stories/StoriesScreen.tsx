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
import { RootStackParamList } from '../../types/navigation';
import { STORIES, CATEGORIES, CATEGORY_TEXT_COLORS, type Story, type StoryCategory } from '../../data/stories';
import { useTheme } from '../../theme';
import PremiumSearchBar from '../../components/PremiumSearchBar';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const HEADER_H = 58;
const CARD_W = '48%';
const CARD_ROW_H = 236;
const LIST_PADDING_TOP = 8;

// ── Story grid card ───────────────────────────────────────────────────────────

const StoryCard = memo(function StoryCard({
  story, onPress, gold,
}: { story: Story; onPress: () => void; gold: string }) {
  const tagColor = CATEGORY_TEXT_COLORS[story.category];

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <Image source={story.image} style={s.cardImage} resizeMode="cover" />
      <View style={s.cardOverlay} />
      <View style={s.cardBody}>
        <View style={s.cardGlass}>
          <View style={[s.categoryTag, { borderColor: tagColor + '60' }]}>
            <Text style={[s.categoryTagText, { color: tagColor }]}>{story.category.toUpperCase()}</Text>
          </View>
          <Text style={s.cardTitle} numberOfLines={2}>{story.title}</Text>
          <Text style={s.cardSubtitle} numberOfLines={1}>{story.subtitle}</Text>
          <View style={s.cardMeta}>
            <Text style={[s.cardRef, { color: gold }]}>{story.reference}</Text>
            <Text style={s.cardTime}>{story.readTime} min</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ── Search result row ─────────────────────────────────────────────────────────

const SearchRow = memo(function SearchRow({
  story, onPress,
}: { story: Story; onPress: () => void }) {
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
        <View style={[sr.tag, { borderColor: tagColor + '55' }]}>
          <Text style={[sr.tagText, { color: tagColor }]}>{story.category.toUpperCase()}</Text>
        </View>
        <Text style={[sr.title, { color: t.text }]} numberOfLines={2}>{story.title}</Text>
        <Text style={[sr.ref, { color: t.gold }]}>{story.reference}</Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={t.textMuted} />
    </TouchableOpacity>
  );
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

        {/* Header — collapses when search is active */}
        <Animated.View
          style={{
            height: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, HEADER_H] }),
            opacity: headerAnim,
            overflow: 'hidden',
          }}
        >
          <View style={[s.header, { borderBottomColor: t.divider }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Text style={[s.backIcon, { color: t.gold }]}>‹</Text>
            </TouchableOpacity>
            <Text style={[s.headerTitle, { color: t.textMuted }]}>BIBLE STORIES</Text>
            <View style={s.headerSpacer} />
          </View>
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
              <Ionicons name="search-outline" size={36} color={t.textMuted} />
              <Text style={[s.emptyTitle, { color: t.textSub }]}>No stories found</Text>
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
                        ? { backgroundColor: color + '28', borderColor: color + '90' }
                        : { backgroundColor: t.filterInactiveBg, borderColor: t.filterInactiveBorder },
                    ]}
                    activeOpacity={0.72}
                  >
                    <View style={[s.filterDot, { backgroundColor: color, opacity: isActive ? 1 : 0.35 }]} />
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
                  gold={t.gold}
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 44, alignItems: 'flex-start' },
  backIcon: { fontSize: 30, lineHeight: 34 },
  headerTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  headerSpacer: { width: 44 },

  filterContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 10, alignItems: 'center' },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterDot: {
    width: 7, height: 7, borderRadius: 4,
    marginRight: 8, flexShrink: 0,
  },
  filterTabText: { fontSize: 14, fontWeight: '600', letterSpacing: 0.3, lineHeight: 18 },

  countLabel: {
    fontSize: 11, paddingHorizontal: 20, paddingTop: 4,
    paddingBottom: 4, letterSpacing: 0.4,
  },

  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120 },
  row: { justifyContent: 'space-between', marginBottom: 16 },

  card: {
    width: CARD_W, borderRadius: 14, overflow: 'hidden',
    height: 220, backgroundColor: '#111',
  },
  cardImage: { position: 'absolute', width: '100%', height: '100%' },
  cardOverlay: {
    position: 'absolute', width: '100%', height: '100%',
    backgroundColor: 'rgba(8,9,18,0.22)',
  },
  cardBody: { flex: 1, justifyContent: 'flex-end' },
  cardGlass: {
    backgroundColor: 'rgba(8,8,20,0.82)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.09)',
    padding: 12,
  },
  categoryTag: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2, marginBottom: 6,
  },
  categoryTagText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  cardTitle: {
    fontSize: 13, fontWeight: '700', color: '#F0EFE9', lineHeight: 18, marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 10, color: '#8B8FA8', lineHeight: 14, marginBottom: 8, fontStyle: 'italic',
  },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardRef: { fontSize: 9, fontWeight: '600', flex: 1 },
  cardTime: { fontSize: 9, color: '#555870' },

  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 12, paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});

const sr = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb: { width: 64, height: 64, borderRadius: 10 },
  info: { flex: 1, gap: 4 },
  tag: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  tagText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  title: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  ref: { fontSize: 11, fontWeight: '600' },
});
