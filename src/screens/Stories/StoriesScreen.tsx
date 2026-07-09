import React, { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, Animated, Dimensions, Platform, AccessibilityInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { RootStackParamList } from '../../types/navigation';
import { STORIES, CATEGORIES, CATEGORY_TEXT_COLORS, type Story, type StoryCategory } from '../../data/stories';
import { useTheme } from '../../theme';
import PremiumSearchBar from '../../components/PremiumSearchBar';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H     = Math.round(SCREEN_W * 0.72);
const CARD_W     = (SCREEN_W - 18 * 2 - 12) / 2;
const CARD_H     = 240;
const CARD_ROW_H = CARD_H + 14;
const GOLD       = '#C9A96B';
const SERIF      = Platform.OS === 'ios' ? 'Georgia' : 'serif';

// ── Rotating hero image pool ──────────────────────────────────────────────────
// These are the stories-exclusive images. Swap in dedicated biblical images
// (Jerusalem, desert, rivers, olive groves, etc.) by replacing entries here.
const HERO_IMAGES: number[] = [
  require('../../assets/apostles.jpg'),
  require('../../assets/open-bible-in-the-morning.jpg'),
  require('../../assets/today-verse.jpg'),
  require('../../assets/hands-cluds.jpg'),
  require('../../assets/stones.jpg'),
];
const N_IMAGES    = HERO_IMAGES.length;
const HOLD_MS     = 6000;   // hold each image for 6 s
const XFADE_MS    = 1400;   // crossfade duration
const KB_SCALE    = 1.07;   // Ken Burns end scale (7% slow zoom)
const KB_DURATION = HOLD_MS + XFADE_MS; // scale spans full image lifetime

// ─── Dynamic rotating hero ────────────────────────────────────────────────────

const DynamicHeroSection = memo(function DynamicHeroSection({
  onBack,
  insets,
  reduceMotion,
}: {
  onBack:       () => void;
  insets:       ReturnType<typeof useSafeAreaInsets>;
  reduceMotion: boolean;
}) {
  // A/B opacity layers for seamless crossfade
  const opA = useRef(new Animated.Value(1)).current;   // Layer A starts visible
  const opB = useRef(new Animated.Value(0)).current;   // Layer B starts hidden
  // Ken Burns scale per layer — runs only on the native driver
  const kbA = useRef(new Animated.Value(1)).current;
  const kbB = useRef(new Animated.Value(1)).current;

  const [slotA, setSlotA] = useState(0);
  const [slotB, setSlotB] = useState(1 % N_IMAGES);

  const layerRef = useRef<'A' | 'B'>('A');  // which layer is currently on top
  const transRef = useRef(false);             // crossfade in flight guard
  const nextRef  = useRef(2 % N_IMAGES);     // index queued for the hidden slot

  const startKenBurns = useCallback((val: Animated.Value) => {
    val.setValue(1.0);
    Animated.timing(val, {
      toValue:         KB_SCALE,
      duration:        KB_DURATION,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (reduceMotion) return;

    // Kick off Ken Burns on the first visible image
    startKenBurns(kbA);

    const timer = setInterval(() => {
      if (transRef.current) return;
      transRef.current = true;
      const aIsActive = layerRef.current === 'A';

      // Start Ken Burns on the incoming layer before the crossfade begins
      startKenBurns(aIsActive ? kbB : kbA);

      Animated.parallel([
        Animated.timing(aIsActive ? opA : opB, {
          toValue: 0, duration: XFADE_MS, useNativeDriver: true,
        }),
        Animated.timing(aIsActive ? opB : opA, {
          toValue: 1, duration: XFADE_MS, useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished) { transRef.current = false; return; }
        layerRef.current = aIsActive ? 'B' : 'A';
        const ni = nextRef.current;
        nextRef.current = (ni + 1) % N_IMAGES;
        // Load next image into the now-hidden layer while it's invisible
        if (aIsActive) setSlotA(ni);
        else           setSlotB(ni);
        transRef.current = false;
      });
    }, HOLD_MS);

    return () => clearInterval(timer);
  // reduceMotion is the only value that changes and restarts the effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  return (
    <View style={{ height: HERO_H, overflow: 'hidden', backgroundColor: '#060810' }}>

      {reduceMotion ? (
        // Reduced Motion: single static image, no animation
        <ExpoImage
          source={HERO_IMAGES[0]}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="high"
        />
      ) : (
        <>
          {/* Layer A */}
          <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: opA }]}>
            <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ scale: kbA }] }]}>
              <ExpoImage
                source={HERO_IMAGES[slotA]}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                cachePolicy="memory-disk"
                priority="high"
              />
            </Animated.View>
          </Animated.View>

          {/* Layer B */}
          <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: opB }]}>
            <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ scale: kbB }] }]}>
              <ExpoImage
                source={HERO_IMAGES[slotB]}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                cachePolicy="memory-disk"
                priority="high"
              />
            </Animated.View>
          </Animated.View>
        </>
      )}

      {/* Top scrim — ensures back button legibility over any image */}
      <LinearGradient
        colors={['rgba(0,0,0,0.60)', 'rgba(0,0,0,0)'] as const}
        locations={[0, 0.32]}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Bottom scrim — ensures title legibility over any image */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.20)', 'rgba(0,0,0,0.84)'] as const}
        locations={[0, 0.40, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Back button */}
      <TouchableOpacity
        style={[hs.backBtn, { top: insets.top + 10 }]}
        onPress={onBack}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.90)" />
      </TouchableOpacity>

      {/* Bottom content */}
      <View style={hs.bottomContent}>
        <View style={hs.eyebrowRow}>
          <Ionicons name="compass-outline" size={11} color={GOLD} />
          <Text style={hs.eyebrow}>BIBLE STORIES</Text>
        </View>
        <Text style={hs.title}>Stories of{'\n'}God's Faithfulness</Text>
        <Text style={hs.scripture}>
          "Faith comes by hearing, and hearing{'\n'}by the word of God." — Rom 10:17
        </Text>
      </View>
    </View>
  );
});

const hs = StyleSheet.create({
  backBtn: {
    position: 'absolute', left: 18,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.30)',
    alignItems: 'center', justifyContent: 'center',
  },
  bottomContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 22, paddingBottom: 24,
  },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  eyebrow:    { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: GOLD },
  title: {
    fontFamily: SERIF,
    fontSize: 28, fontWeight: '400', lineHeight: 36, letterSpacing: -0.3,
    color: 'rgba(255,255,255,0.96)', marginBottom: 10,
  },
  scripture: {
    fontSize: 12, fontStyle: 'italic', fontFamily: SERIF,
    color: 'rgba(255,255,255,0.42)', lineHeight: 19,
  },
});

// ─── List header (hero + filters + count) ─────────────────────────────────────
// Defined outside StoriesScreen so its type reference is stable across renders.
// This prevents FlatList from unmounting/remounting the DynamicHeroSection when
// state changes (activeCategory, etc.) trigger a StoriesScreen re-render.

interface ListHeaderProps {
  headerAnim:        Animated.Value;
  onBack:            () => void;
  insets:            ReturnType<typeof useSafeAreaInsets>;
  reduceMotion:      boolean;
  activeCategory:    StoryCategory | 'All';
  onSelectCategory:  (c: StoryCategory | 'All') => void;
  gridCount:         number;
  isDark:            boolean;
  mutedColor:        string;
  // Search bar — lives in the header so it sits directly below the hero
  query:             string;
  onChangeText:      (text: string) => void;
  onActiveChange:    (active: boolean) => void;
}

const StoriesListHeader = memo(function StoriesListHeader({
  headerAnim,
  onBack,
  insets,
  reduceMotion,
  activeCategory,
  onSelectCategory,
  gridCount,
  isDark,
  mutedColor,
  query,
  onChangeText,
  onActiveChange,
}: ListHeaderProps) {
  return (
    <View>
      {/* Hero — breaks out of the FlatList's paddingHorizontal to stay full-bleed */}
      <View style={{ marginHorizontal: -18 }}>
        <Animated.View style={{
          height:   headerAnim.interpolate({ inputRange: [0, 1], outputRange: [insets.top, HERO_H] }),
          opacity:  headerAnim,
          overflow: 'hidden',
        }}>
          <DynamicHeroSection
            onBack={onBack}
            insets={insets}
            reduceMotion={reduceMotion}
          />
        </Animated.View>
      </View>

      {/* Search bar sits directly beneath the hero */}
      <PremiumSearchBar
        value={query}
        onChangeText={onChangeText}
        placeholder="Search stories, references…"
        onActiveChange={onActiveChange}
        style={{ marginBottom: 4 }}
      />

      {/* Category filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterContent}
      >
        {(['All', ...CATEGORIES] as const).map((cat) => {
          const isActive = activeCategory === cat;
          const color    = cat === 'All' ? GOLD : CATEGORY_TEXT_COLORS[cat as StoryCategory];
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => onSelectCategory(cat as StoryCategory | 'All')}
              style={[
                s.filterTab,
                isActive
                  ? { backgroundColor: color + '1E', borderColor: color + '70' }
                  : {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                      borderColor:     isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.09)',
                    },
              ]}
              activeOpacity={0.72}
            >
              <View style={[s.filterDot, { backgroundColor: color, opacity: isActive ? 1 : 0.40 }]} />
              <Text style={[s.filterTabText, { color: isActive ? color : mutedColor }]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={[s.countLabel, { color: mutedColor }]}>
        {gridCount} {gridCount === 1 ? 'story' : 'stories'}
      </Text>
    </View>
  );
});

// ─── Story grid card ──────────────────────────────────────────────────────────

const StoryCard = memo(function StoryCard({
  story, onPress,
}: { story: Story; onPress: () => void }) {
  const tagColor = CATEGORY_TEXT_COLORS[story.category];
  return (
    <TouchableOpacity
      style={[sc.card, { width: CARD_W }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <ExpoImage
        source={story.image}
        style={sc.image}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <LinearGradient
        colors={['transparent', 'rgba(4,5,15,0.50)', 'rgba(4,5,15,0.94)']}
        style={sc.gradient}
      />
      <View style={sc.content}>
        <View style={[sc.catPill, { borderColor: tagColor + '58' }]}>
          <Text style={[sc.catText, { color: tagColor }]}>{story.category.toUpperCase()}</Text>
        </View>
        <Text style={sc.title} numberOfLines={2}>{story.title}</Text>
        <View style={sc.meta}>
          <Text style={[sc.ref, { color: GOLD }]}>{story.reference}</Text>
          <Text style={sc.time}>{story.readTime} min</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const sc = StyleSheet.create({
  card:     { borderRadius: 18, overflow: 'hidden', height: CARD_H, backgroundColor: '#0A0B14' },
  image:    { ...StyleSheet.absoluteFillObject },
  gradient: { ...StyleSheet.absoluteFillObject },
  content:  { flex: 1, justifyContent: 'flex-end', padding: 14, gap: 6 },
  catPill:  { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginBottom: 2 },
  catText:  { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  title:    { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.95)', lineHeight: 20 },
  meta:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ref:      { fontSize: 10, fontWeight: '600' },
  time:     { fontSize: 10, color: 'rgba(255,255,255,0.42)' },
});

// ─── Search result row ────────────────────────────────────────────────────────

const SearchRow = memo(function SearchRow({
  story, onPress, isDark,
}: { story: Story; onPress: () => void; isDark: boolean }) {
  const tagColor   = CATEGORY_TEXT_COLORS[story.category];
  const textColor  = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const subColor   = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(24,18,8,0.55)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.32)' : 'rgba(24,18,8,0.32)';
  const divColor   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  return (
    <TouchableOpacity
      style={[sr.row, { borderBottomColor: divColor }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <ExpoImage
        source={story.image}
        style={sr.thumb}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <View style={sr.info}>
        <Text style={[sr.cat, { color: tagColor }]}>{story.category.toUpperCase()}</Text>
        <Text style={[sr.title, { color: textColor }]} numberOfLines={2}>{story.title}</Text>
        <View style={sr.metaRow}>
          <Text style={[sr.ref, { color: GOLD }]}>{story.reference}</Text>
          <Text style={[sr.time, { color: mutedColor }]}>{story.readTime} min read</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={14} color={subColor} />
    </TouchableOpacity>
  );
});

const sr = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb:   { width: 66, height: 66, borderRadius: 14 },
  info:    { flex: 1, gap: 3 },
  cat:     { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  title:   { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ref:     { fontSize: 11, fontWeight: '600' },
  time:    { fontSize: 11 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function StoriesScreen() {
  const navigation = useNavigation<NavProp>();
  const t      = useTheme();
  const insets = useSafeAreaInsets();

  const isDark     = t.statusBar === 'light-content';
  const rootBg     = isDark ? '#060810' : '#DDD5C4';
  const textColor  = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';

  const [activeCategory, setActiveCategory] = useState<StoryCategory | 'All'>('All');
  const [query, setQuery]                   = useState('');
  const [reduceMotion, setReduceMotion]     = useState(false);

  const headerAnim   = useRef(new Animated.Value(1)).current;
  const flatListRef  = useRef<FlatList>(null);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub?.remove();
  }, []);

  const onSearchActiveChange = useCallback((active: boolean) => {
    if (active) {
      // Scroll to top so the search bar (inside the list header) comes into view
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
    Animated.timing(headerAnim, {
      toValue:         active ? 0 : 1,
      duration:        250,
      useNativeDriver: false,
    }).start();
  }, [headerAnim]);

  const gridItems = useMemo(
    () => activeCategory === 'All' ? STORIES : STORIES.filter(s => s.category === activeCategory),
    [activeCategory],
  );

  // Pair stories into 2-column rows so FlatList never needs a key change.
  // Without this, switching numColumns requires remounting the FlatList (and its
  // ListHeaderComponent), which destroys the TextInput and cancels the search.
  const gridPairs = useMemo(() => {
    const pairs: Array<{ __type: 'pair'; id: string; left: Story; right: Story | null }> = [];
    for (let i = 0; i < gridItems.length; i += 2) {
      pairs.push({
        __type: 'pair',
        id: `pair-${gridItems[i].id}`,
        left:  gridItems[i],
        right: gridItems[i + 1] ?? null,
      });
    }
    return pairs;
  }, [gridItems]);

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

  // Stable element — StoriesListHeader defined outside this component gives React
  // a stable type reference so DynamicHeroSection never remounts on re-renders.
  const listHeader = (
    <StoriesListHeader
      headerAnim={headerAnim}
      onBack={handleBack}
      insets={insets}
      reduceMotion={reduceMotion}
      activeCategory={activeCategory}
      onSelectCategory={setActiveCategory}
      gridCount={isSearching ? searchResults.length : gridItems.length}
      isDark={isDark}
      mutedColor={mutedColor}
      query={query}
      onChangeText={setQuery}
      onActiveChange={onSearchActiveChange}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: rootBg }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/*
        Always numColumns={1} — grid rows are manually paired so the FlatList
        never needs a key change. Previously, switching from numColumns=2 to 1
        required a key prop change which remounted the entire list (including
        ListHeaderComponent → StoriesListHeader → PremiumSearchBar → TextInput),
        causing focus loss and search cancellation on the first keystroke.
      */}
      <FlatList
        ref={flatListRef}
        data={(isSearching ? searchResults : gridPairs) as any}
        keyExtractor={(item: any) => item.id}
        numColumns={1}
        contentContainerStyle={isSearching ? s.searchContent : s.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={isSearching ? 20 : 26}
        maxToRenderPerBatch={isSearching ? 20 : 26}
        windowSize={21}
        removeClippedSubviews
        ListHeaderComponent={listHeader}
        ListEmptyComponent={isSearching ? (
          <View style={s.emptyWrap}>
            <View style={[s.emptyIconWrap, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
            }]}>
              <Ionicons name="search-outline" size={28} color={mutedColor} />
            </View>
            <Text style={[s.emptyTitle, { color: textColor }]}>No stories found</Text>
            <Text style={[s.emptySub, { color: mutedColor }]}>
              Try a title, book name, or category
            </Text>
          </View>
        ) : null}
        renderItem={({ item }: any) => {
          if (item.__type === 'pair') {
            return (
              <View style={s.row}>
                <StoryCard story={item.left} onPress={() => openStory(item.left.id)} />
                {item.right ? (
                  <StoryCard story={item.right} onPress={() => openStory(item.right.id)} />
                ) : (
                  <View style={{ width: CARD_W }} />
                )}
              </View>
            );
          }
          return <SearchRow story={item} onPress={() => openStory(item.id)} isDark={isDark} />;
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  filterContent: { paddingHorizontal: 18, paddingVertical: 10, gap: 8, alignItems: 'center' },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1,
  },
  filterDot:     { width: 6, height: 6, borderRadius: 3, marginRight: 6, flexShrink: 0 },
  filterTabText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3, lineHeight: 14 },

  countLabel: { fontSize: 11, paddingHorizontal: 20, paddingTop: 2, paddingBottom: 6, letterSpacing: 0.4 },

  listContent:   { paddingHorizontal: 18, paddingBottom: 120 },
  searchContent: { paddingBottom: 120 },
  row:           { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },

  emptyWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle:    { fontSize: 17, fontWeight: '700' },
  emptySub:      { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
