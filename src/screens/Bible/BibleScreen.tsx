import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  TextInput,
  Animated,
  Share,
  Keyboard,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { BOOKS } from '../../constants/books';
import {
  loadChapter,
  loadOnlineBibles,
  checkOnline,
  OFFLINE_BIBLES,
  type Verse,
  type BibleVersion,
  type ChapterResult,
} from '../../services/bibleService';
import { API_BIBLE_KEY } from '../../config/bibleConfig';
import GlassSearchBar from '../../components/GlassSearchBar';
import { speakText } from '../../services/ttsService';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const GOLD        = '#D4B574';
const GOLD_DIM    = 'rgba(212,181,116,0.12)';
const GOLD_BORDER = 'rgba(212,181,116,0.20)';
const BG          = '#0A0A0A';
const BG_CARD     = '#111111';
const T_PRIMARY   = '#F5F5F5';
const T_SEC       = 'rgba(255,255,255,0.62)';
const T_MUTED     = 'rgba(255,255,255,0.35)';
const DIVIDER     = 'rgba(255,255,255,0.06)';

const TOP_H  = 50;  // floating header content height (below status bar)
const CTRL_H = 52;  // floating control bar height

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type Params  = { bookIndex?: number; chapter?: number; verseToScroll?: number };

// ─── Highlighted search text ───────────────────────────────────────────────────
function HighlightedText({ text, query, style }: { text: string; query: string; style?: object }) {
  const q = query.toLowerCase();
  const parts: Array<{ t: string; hi: boolean }> = [];
  let i = 0;
  while (i < text.length) {
    const m = text.toLowerCase().indexOf(q, i);
    if (m === -1) { parts.push({ t: text.slice(i), hi: false }); break; }
    if (m > i) parts.push({ t: text.slice(i, m), hi: false });
    parts.push({ t: text.slice(m, m + q.length), hi: true });
    i = m + q.length;
  }
  return (
    <Text style={style} numberOfLines={2}>
      {parts.map((p, k) =>
        p.hi ? <Text key={k} style={s.resultHighlight}>{p.t}</Text> : p.t
      )}
    </Text>
  );
}

// ─── Chapter header ────────────────────────────────────────────────────────────
function ChapterHeader({ bookName, chapter }: { bookName: string; chapter: number }) {
  return (
    <View style={s.chapterHeader}>
      <Text style={s.chapterHeaderBook}>{bookName.toUpperCase()}</Text>
      <Text style={s.chapterHeaderNum}>{chapter}</Text>
      <View style={s.chapterHeaderRule} />
    </View>
  );
}

// ─── Verse row ─────────────────────────────────────────────────────────────────
// Memoized so that only the 1–2 verses whose isPlaying/isTarget state changed
// actually re-render when audio playback advances or a target verse is highlighted.
type VerseRowProps = {
  item: Verse;
  isPlaying: boolean;
  isTarget: boolean;
  onLongPress: () => void;
};

const VerseRow = memo(function VerseRow({ item, isPlaying, isTarget, onLongPress }: VerseRowProps) {
  return (
    <TouchableOpacity
      onLongPress={onLongPress}
      delayLongPress={450}
      activeOpacity={0.88}
      style={[
        s.verseBlock,
        isPlaying && s.verseBlockPlaying,
        isTarget  && s.verseBlockTarget,
      ]}
    >
      <Text style={s.verseContent}>
        <Text style={s.verseNum}>{item.verse}{'  '}</Text>
        {item.text}
      </Text>
    </TouchableOpacity>
  );
});

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function BibleScreen() {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute();
  const params     = (route.params ?? {}) as Params;
  const { top: safeTop, bottom: safeBottom } = useSafeAreaInsets();

  const flatListRef     = useRef<FlatList>(null);
  const lastScrollY     = useRef(0);
  const barsVisible     = useRef(true);
  const isPlayingRef    = useRef(false);
  const soundRef        = useRef<Audio.Sound | null>(null);
  const searchModeRef   = useRef(false);
  const searchInputRef  = useRef<TextInput>(null);

  // ── Scroll-hide animation ─────────────────────────────────────────────────
  const headerAnim  = useRef(new Animated.Value(0)).current;
  const controlAnim = useRef(new Animated.Value(0)).current;

  // ── Search animations ─────────────────────────────────────────────────────
  const navOp      = useRef(new Animated.Value(1)).current;   // nav row opacity
  const searchOp   = useRef(new Animated.Value(0)).current;   // search row opacity
  const cancelW    = useRef(new Animated.Value(0)).current;   // cancel btn width (JS thread)
  const resultsOp  = useRef(new Animated.Value(0)).current;   // results panel opacity

  // ── Search state ──────────────────────────────────────────────────────────
  const [searchMode,  setSearchMode]  = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Reading state ─────────────────────────────────────────────────────────
  const [bookIndex,   setBookIndex]   = useState(params.bookIndex ?? 42);
  const [chapter,     setChapter]     = useState(params.chapter ?? 1);
  const [verses,      setVerses]      = useState<Verse[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // ── Picker state ──────────────────────────────────────────────────────────
  const [bookPickerVisible,        setBookPickerVisible]        = useState(false);
  const [bookPickerStep,           setBookPickerStep]           = useState<'books' | 'chapters'>('books');
  const [pendingBookIdx,           setPendingBookIdx]           = useState<number | null>(null);
  const [bookSearch,               setBookSearch]               = useState('');
  const [translationPickerVisible, setTranslationPickerVisible] = useState(false);
  const [onlineBibles,             setOnlineBibles]             = useState<BibleVersion[]>([]);
  const [onlineBiblesLoading,      setOnlineBiblesLoading]      = useState(false);
  const [selectedBible,            setSelectedBible]            = useState<BibleVersion>(OFFLINE_BIBLES[0]);

  // ── Interaction state ─────────────────────────────────────────────────────
  const [selectedVerse,       setSelectedVerse]       = useState<Verse | null>(null);
  const [verseActionsVisible, setVerseActionsVisible] = useState(false);
  const [isPlaying,           setIsPlaying]           = useState(false);
  const [playingVerse,        setPlayingVerse]        = useState<number | null>(null);

  const book = BOOKS[bookIndex];

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchChapter = useCallback(async (bIdx: number, ch: number, bible: BibleVersion) => {
    setLoading(true);
    setError(null);
    setVerses([]);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    try {
      const result: ChapterResult = await loadChapter(bIdx, BOOKS[bIdx].usfm, ch, bible);
      setVerses(result.verses);
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (params.bookIndex !== undefined) setBookIndex(params.bookIndex);
    if (params.chapter   !== undefined) setChapter(params.chapter);
  }, [route.params]);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!verses.length || !params.verseToScroll) return;
    const idx = params.verseToScroll - 1;
    if (idx < 0 || idx >= verses.length) return;
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.2 });
    }, 220);
  }, [verses, params.verseToScroll]);

  useEffect(() => {
    fetchChapter(bookIndex, chapter, selectedBible);
  }, [bookIndex, chapter, selectedBible]);

  // Stop playback when chapter changes
  useEffect(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setPlayingVerse(null);
    soundRef.current?.stopAsync().catch(() => {});
    soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;
  }, [bookIndex, chapter]);

  // ── Scroll-based bar visibility ───────────────────────────────────────────
  const showBars = useCallback(() => {
    if (barsVisible.current) return;
    barsVisible.current = true;
    Animated.parallel([
      Animated.spring(headerAnim,  { toValue: 0, tension: 140, friction: 22, useNativeDriver: true }),
      Animated.spring(controlAnim, { toValue: 0, tension: 140, friction: 22, useNativeDriver: true }),
    ]).start();
  }, []);

  const hideBars = useCallback(() => {
    if (!barsVisible.current) return;
    barsVisible.current = false;
    Animated.parallel([
      Animated.spring(headerAnim,  { toValue: 1, tension: 140, friction: 22, useNativeDriver: true }),
      Animated.spring(controlAnim, { toValue: 1, tension: 140, friction: 22, useNativeDriver: true }),
    ]).start();
  }, []);

  const onScroll = useCallback((e: any) => {
    if (searchModeRef.current) return;
    const y    = e.nativeEvent.contentOffset.y;
    const diff = y - lastScrollY.current;
    lastScrollY.current = y;
    if (diff > 10 && y > 80) hideBars();
    else if (diff < -10)      showBars();
  }, [showBars, hideBars]);

  // ── Audio playback via shared TTS helper ──────────────────────────────────
  const playFromIndex = useCallback(async (startIdx: number, allVerses: Verse[]) => {
    if (!isPlayingRef.current || startIdx >= allVerses.length) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setPlayingVerse(null);
      return;
    }
    const v = allVerses[startIdx];
    setPlayingVerse(v.verse);
    // Auto-scroll to playing verse
    flatListRef.current?.scrollToIndex({ index: startIdx, animated: true, viewPosition: 0.35 });
    try {
      const cacheKey = `bible-${bookIndex}-${chapter}-${v.verse}`;
      const sound = await speakText(v.text, cacheKey);
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          soundRef.current?.unloadAsync().catch(() => {});
          soundRef.current = null;
          if (isPlayingRef.current) {
            void playFromIndex(startIdx + 1, allVerses);
          }
        }
      });
    } catch {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setPlayingVerse(null);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setPlayingVerse(null);
      soundRef.current?.stopAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    } else {
      isPlayingRef.current = true;
      setIsPlaying(true);
      void playFromIndex(0, verses);
    }
  }, [isPlaying, verses, playFromIndex]);

  // ── Book & translation pickers ────────────────────────────────────────────
  const openTranslationPicker = async () => {
    setTranslationPickerVisible(true);
    if (onlineBibles.length > 0 || !API_BIBLE_KEY) return;
    const online = await checkOnline();
    if (!online) return;
    setOnlineBiblesLoading(true);
    try {
      const list = await loadOnlineBibles();
      setOnlineBibles(list);
    } catch {}
    finally { setOnlineBiblesLoading(false); }
  };

  const closeBookPicker = () => {
    setBookPickerVisible(false);
    setBookPickerStep('books');
    setPendingBookIdx(null);
    setBookSearch('');
  };

  // Step 1 — user taps a book: move to chapter grid, don't navigate yet
  const selectBook = (idx: number) => {
    setPendingBookIdx(idx);
    setBookPickerStep('chapters');
    setBookSearch('');
  };

  // Step 2 — user taps a chapter: navigate and close
  const selectChapter = (ch: number) => {
    if (pendingBookIdx === null) return;
    setBookIndex(pendingBookIdx);
    setChapter(ch);
    closeBookPicker();
  };

  const selectTranslation = (bible: BibleVersion) => {
    setSelectedBible(bible);
    setTranslationPickerVisible(false);
  };

  // Precompute {book, index} pairs so the FlatList renderItem never needs
  // BOOKS.indexOf(item), which is O(66) per row on every render.
  const filteredBooks = useMemo(() => {
    const q = bookSearch.toLowerCase();
    return BOOKS
      .map((book, index) => ({ book, index }))
      .filter(({ book }) => !bookSearch || book.name.toLowerCase().includes(q));
  }, [bookSearch]);

  // ── Verse actions ─────────────────────────────────────────────────────────
  const openVerseActions = useCallback((verse: Verse) => {
    setSelectedVerse(verse);
    setVerseActionsVisible(true);
  }, []);

  const handleShare = async () => {
    if (!selectedVerse) return;
    await Share.share({
      message: `"${selectedVerse.text}" — ${book.name} ${chapter}:${selectedVerse.verse} (${selectedBible.abbreviation})`,
    });
    setVerseActionsVisible(false);
  };

  const handleAskVerse = () => {
    if (!selectedVerse) return;
    setVerseActionsVisible(false);
    (navigation as any).navigate('ScriptureChat', {
      reference: `${book.name} ${chapter}:${selectedVerse.verse}`,
      contextType: 'verse',
      context: `${selectedVerse.verse}. ${selectedVerse.text}`,
    });
  };

  const openAsk = () => {
    const context = verses.slice(0, 30).map(v => `${v.verse}. ${v.text}`).join('\n');
    (navigation as any).navigate('ScriptureChat', {
      reference: `${book.name} ${chapter}`,
      contextType: 'chapter',
      context,
    });
  };

  // ── Search ────────────────────────────────────────────────────────────────
  const enterSearch = useCallback(() => {
    searchModeRef.current = true;
    setSearchMode(true);
    showBars();
    // Native-driver animations (opacity)
    Animated.parallel([
      Animated.timing(navOp,    { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(searchOp, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    // JS-driver animation (width) runs in parallel but separately
    Animated.spring(cancelW, { toValue: 72, tension: 160, friction: 22, useNativeDriver: false }).start();
    setTimeout(() => searchInputRef.current?.focus(), 120);
  }, [showBars, navOp, searchOp, cancelW]);

  const exitSearch = useCallback(() => {
    Keyboard.dismiss();
    setSearchQuery('');
    // Native-driver animations
    Animated.parallel([
      Animated.timing(searchOp,  { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(navOp,     { toValue: 1, duration: 210, useNativeDriver: true }),
      Animated.timing(resultsOp, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      searchModeRef.current = false;
      setSearchMode(false);
    });
    // JS-driver animation
    Animated.spring(cancelW, { toValue: 0, tension: 160, friction: 22, useNativeDriver: false }).start();
  }, [searchOp, navOp, cancelW, resultsOp]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return verses.filter(v => v.text.toLowerCase().includes(q));
  }, [searchQuery, verses]);

  useEffect(() => {
    if (!searchModeRef.current) return;
    if (searchQuery.length >= 2) {
      Animated.timing(resultsOp, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else {
      Animated.timing(resultsOp, { toValue: 0, duration: 140, useNativeDriver: true }).start();
    }
  }, [searchQuery, resultsOp]);

  const scrollToVerse = useCallback((verse: Verse) => {
    const idx = verses.findIndex(v => v.verse === verse.verse);
    exitSearch();
    if (idx >= 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.25 });
      }, 280);
    }
  }, [verses, exitSearch]);

  // ── Animated transforms ───────────────────────────────────────────────────
  const headerTranslateY = headerAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, -(safeTop + TOP_H + 10)],
  });
  // Position control bar flush above the tab bar with an 8px gap.
  // Tab bar height ≈ paddingTop(4) + tabRow(~62) + paddingBottom(max(bottom-22,2)).
  const ctrlBottom = 66 + Math.max(safeBottom - 22, 2) + 8;

  const controlTranslateY = controlAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, CTRL_H + 100],
  });

  // ── Layout ────────────────────────────────────────────────────────────────
  const topPad    = safeTop + TOP_H + 20;
  const bottomPad = ctrlBottom + CTRL_H + 16;

  // ── Verse renderer ────────────────────────────────────────────────────────
  // Stable callback — playingVerse/verseToScroll are passed via extraData so
  // FlatList re-evaluates items when they change, while VerseRow's memo skips
  // re-rendering any row whose isPlaying/isTarget props didn't actually change.
  const renderVerse = useCallback(({ item }: { item: Verse }) => (
    <VerseRow
      item={item}
      isPlaying={playingVerse === item.verse}
      isTarget={params.verseToScroll === item.verse}
      onLongPress={() => openVerseActions(item)}
    />
  ), [playingVerse, params.verseToScroll, openVerseActions]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Main reading content ──────────────────────────────────────── */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={GOLD} size="large" />
          <Text style={s.statusLabel}>Loading scripture…</Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Ionicons name="cloud-offline-outline" size={44} color={T_SEC} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => fetchChapter(bookIndex, chapter, selectedBible)}
            style={s.retryBtn}
          >
            <Text style={s.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={verses}
          keyExtractor={v => String(v.verse)}
          extraData={[playingVerse, params.verseToScroll]}
          ListHeaderComponent={
            <ChapterHeader bookName={book.name} chapter={chapter} />
          }
          contentContainerStyle={[s.verseList, { paddingTop: topPad, paddingBottom: bottomPad }]}
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          initialNumToRender={20}
          maxToRenderPerBatch={15}
          windowSize={5}
          removeClippedSubviews
          onScrollToIndexFailed={({ index }) => {
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.2 });
            }, 300);
          }}
          renderItem={renderVerse}
        />
      )}

      {/* Top vignette — fades content into the header */}
      <LinearGradient
        colors={[BG, BG, 'transparent']}
        style={[s.vignette, s.vignetteTop, { height: topPad + 8 }]}
        pointerEvents="none"
      />

      {/* ── Search results panel ──────────────────────────────────────── */}
      {searchMode && searchQuery.length >= 2 && (
        <Animated.View
          style={[s.resultsPanel, { top: safeTop + TOP_H, opacity: resultsOp }]}
        >
          <BlurView intensity={82} tint="dark" style={s.resultsPanelBlur}>
            {searchResults.length === 0 ? (
              <View style={s.resultsEmpty}>
                <Ionicons name="search-outline" size={22} color={T_MUTED} />
                <Text style={s.resultsEmptyText}>No results in {book.name} {chapter}</Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={v => String(v.verse)}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingVertical: 6 }}
                ItemSeparatorComponent={() => (
                  <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: DIVIDER, marginHorizontal: 16 }} />
                )}
                renderItem={({ item }) => (
                  <TouchableOpacity style={s.resultRow} onPress={() => scrollToVerse(item)}>
                    <Text style={s.resultVerseNum}>{book.name} {chapter}:{item.verse}</Text>
                    <HighlightedText text={item.text} query={searchQuery} style={s.resultText} />
                  </TouchableOpacity>
                )}
              />
            )}
          </BlurView>
        </Animated.View>
      )}

      {/* ── Floating top bar ──────────────────────────────────────────── */}
      <Animated.View
        style={[s.topBar, { transform: [{ translateY: headerTranslateY }] }]}
      >
        <BlurView intensity={70} tint="dark" style={s.topBarBlur}>
          {/* Status bar spacer */}
          <View style={{ height: safeTop }} />

          <View style={s.topBarContent}>
            {/* NAV ROW — fades out when searching */}
            <Animated.View
              pointerEvents={searchMode ? 'none' : 'auto'}
              style={[s.topBarRow, { opacity: navOp }]}
            >
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={s.topBarIconBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-back" size={22} color={GOLD} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setBookPickerVisible(true)}
                style={s.topBarCenter}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text style={s.topBarTitle} numberOfLines={1}>
                  {book.name} {chapter}
                </Text>
                <Ionicons name="chevron-down" size={12} color={GOLD} style={s.topBarChevron} />
              </TouchableOpacity>
              <View style={s.topBarRight}>
                <TouchableOpacity
                  onPress={openTranslationPicker}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Text style={s.topBarBadge}>{selectedBible.abbreviation}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={enterSearch}
                  style={s.topBarIconBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                >
                  <Ionicons name="search-outline" size={18} color={T_SEC} />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* SEARCH ROW — fades in when searching */}
            <Animated.View
              pointerEvents={searchMode ? 'auto' : 'none'}
              style={[s.topBarRow, { opacity: searchOp }]}
            >
              <View style={s.searchGlassBar}>
                <View style={s.searchGlassInner}>
                  <Ionicons name="search" size={14} color={T_SEC} />
                  <TextInput
                    ref={searchInputRef}
                    style={s.searchGlassInput}
                    placeholder="Search this chapter…"
                    placeholderTextColor={T_MUTED}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCorrect={false}
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={15} color={T_MUTED} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <Animated.View style={{ width: cancelW, overflow: 'hidden' }}>
                <TouchableOpacity style={s.searchCancelBtn} onPress={exitSearch}>
                  <Text style={s.searchCancelText}>Cancel</Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </View>
        </BlurView>
      </Animated.View>

      {/* ── Floating control bar ──────────────────────────────────────── */}
      {verses.length > 0 && (
        <Animated.View
          style={[
            s.ctrlBar,
            {
              bottom:    ctrlBottom,
              transform: [{ translateY: controlTranslateY }],
            },
          ]}
        >
          <BlurView intensity={76} tint="dark" style={s.ctrlBarInner}>
            {/* Book + Translation — black rectangular pill */}
            <View style={s.ctrlInfoBox}>
              <TouchableOpacity
                onPress={() => setBookPickerVisible(true)}
                style={s.ctrlBookBtn}
              >
                <Text style={s.ctrlBookText} numberOfLines={1}>
                  {book.name} {chapter}
                </Text>
                <Ionicons name="chevron-up" size={9} color={T_SEC} style={{ marginLeft: 3 }} />
              </TouchableOpacity>
              <View style={s.ctrlInfoDivider} />
              <TouchableOpacity
                onPress={openTranslationPicker}
                style={s.ctrlTransBtn}
              >
                <Text style={s.ctrlTransText}>{selectedBible.abbreviation}</Text>
              </TouchableOpacity>
            </View>

            <View style={s.ctrlSep} />

            {/* Ask */}
            <TouchableOpacity onPress={openAsk} style={s.ctrlAskBtn}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={GOLD} />
              <Text style={s.ctrlAskText}>Ask</Text>
            </TouchableOpacity>

            <View style={s.ctrlSep} />

            {/* Prev chapter — always white */}
            <TouchableOpacity
              onPress={() => setChapter(c => Math.max(1, c - 1))}
              style={s.ctrlNavBtn}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Ionicons name="chevron-back" size={20} color={T_PRIMARY} />
            </TouchableOpacity>

            {/* Play / Pause — KJV only, no circle */}
            {selectedBible.id === 'kjv' && (
              <TouchableOpacity onPress={togglePlay} style={s.ctrlPlayBtn}>
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={18}
                  color={T_PRIMARY}
                />
              </TouchableOpacity>
            )}

            {/* Next chapter — always white */}
            <TouchableOpacity
              onPress={() => setChapter(c => Math.min(book.chapters, c + 1))}
              style={s.ctrlNavBtn}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Ionicons name="chevron-forward" size={20} color={T_PRIMARY} />
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      )}

      {/* ── Verse action sheet ────────────────────────────────────────── */}
      <Modal
        visible={verseActionsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setVerseActionsVisible(false)}
      >
        <View style={s.sheetOverlayRow}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setVerseActionsVisible(false)}
          />
        </View>
        <View style={[s.sheet, { paddingBottom: safeBottom + 12 }]}>
          {selectedVerse && (
            <Text style={s.sheetQuote} numberOfLines={3}>
              "{selectedVerse.text}"
            </Text>
          )}
          <Text style={s.sheetRef}>
            {book.name} {chapter}:{selectedVerse?.verse} · {selectedBible.abbreviation}
          </Text>
          <View style={s.sheetDivider} />
          {([
            { icon: 'bookmark-outline',           label: 'Bookmark',              onPress: () => setVerseActionsVisible(false) },
            { icon: 'pencil-outline',              label: 'Add Note',              onPress: () => setVerseActionsVisible(false) },
            { icon: 'share-social-outline',        label: 'Share',                 onPress: handleShare },
            { icon: 'chatbubble-ellipses-outline', label: 'Ask About This Verse',  onPress: handleAskVerse },
          ] as const).map(a => (
            <TouchableOpacity key={a.label} style={s.sheetRow} onPress={a.onPress}>
              <View style={s.sheetRowIcon}>
                <Ionicons name={a.icon as any} size={18} color={GOLD} />
              </View>
              <Text style={s.sheetRowLabel}>{a.label}</Text>
              <Ionicons name="chevron-forward" size={14} color={T_MUTED} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[s.sheetCancel, { marginBottom: 4 }]}
            onPress={() => setVerseActionsVisible(false)}
          >
            <Text style={s.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Book picker modal (2-step: books → chapters) ─────────────── */}
      <Modal
        visible={bookPickerVisible}
        animationType="slide"
        onRequestClose={closeBookPicker}
      >
        <View style={s.modalRoot}>
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>

            {bookPickerStep === 'books' ? (
              /* ── Step 1: Book list ──────────────────────────────── */
              <>
                <View style={s.modalHeader}>
                  <Text style={s.modalTitle}>Books of the Bible</Text>
                  <TouchableOpacity
                    onPress={closeBookPicker}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={s.modalCloseBtn}
                  >
                    <Ionicons name="close" size={20} color={T_PRIMARY} />
                  </TouchableOpacity>
                </View>
                <GlassSearchBar
                  value={bookSearch}
                  onChangeText={setBookSearch}
                  placeholder="Search books…"
                  dark
                  showCancel={false}
                  style={{ margin: 16 }}
                />
                <FlatList
                  data={filteredBooks}
                  keyExtractor={({ book }) => book.usfm}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item: { book, index: idx } }) => {
                    const isSelected = idx === bookIndex;
                    return (
                      <TouchableOpacity
                        onPress={() => selectBook(idx)}
                        style={[s.pickerRow, isSelected && s.pickerRowSelected]}
                      >
                        <Text style={[s.pickerRowText, isSelected && s.pickerRowTextSel]}>
                          {book.name}
                        </Text>
                        <View style={s.pickerRowRight}>
                          <Text style={[s.pickerRowMeta, isSelected && { color: GOLD }]}>
                            {book.chapters} ch
                          </Text>
                          <Ionicons name="chevron-forward" size={14} color={T_MUTED} />
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              </>
            ) : (
              /* ── Step 2: Chapter grid ───────────────────────────── */
              <>
                <View style={s.modalHeader}>
                  {/* Back to book list */}
                  <TouchableOpacity
                    onPress={() => setBookPickerStep('books')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={s.modalBackBtn}
                  >
                    <Ionicons name="arrow-back" size={20} color={T_PRIMARY} />
                  </TouchableOpacity>

                  <Text style={s.modalTitle}>
                    {pendingBookIdx !== null ? BOOKS[pendingBookIdx].name : ''}
                  </Text>

                  {/* Close entire picker */}
                  <TouchableOpacity
                    onPress={closeBookPicker}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={s.modalCloseBtn}
                  >
                    <Ionicons name="close" size={20} color={T_PRIMARY} />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={
                    pendingBookIdx !== null
                      ? Array.from({ length: BOOKS[pendingBookIdx].chapters }, (_, i) => i + 1)
                      : []
                  }
                  keyExtractor={ch => String(ch)}
                  numColumns={5}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={s.chapterGrid}
                  renderItem={({ item: ch }) => {
                    const isActive = pendingBookIdx === bookIndex && ch === chapter;
                    return (
                      <TouchableOpacity
                        onPress={() => selectChapter(ch)}
                        style={[s.chapterCell, isActive && s.chapterCellActive]}
                      >
                        <Text style={[s.chapterCellText, isActive && s.chapterCellTextActive]}>
                          {ch}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </>
            )}

          </SafeAreaView>
        </View>
      </Modal>

      {/* ── Translation picker modal ──────────────────────────────────── */}
      <Modal
        visible={translationPickerVisible}
        animationType="slide"
        onRequestClose={() => setTranslationPickerVisible(false)}
      >
        <View style={s.modalRoot}>
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Translation</Text>
              <TouchableOpacity
                onPress={() => setTranslationPickerVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={T_SEC} />
              </TouchableOpacity>
            </View>
            <Text style={s.sectionLabel}>OFFLINE</Text>
            {OFFLINE_BIBLES.map(bible => {
              const isSel = bible.id === selectedBible.id;
              return (
                <TouchableOpacity
                  key={bible.id}
                  onPress={() => selectTranslation(bible)}
                  style={[s.pickerRow, isSel && s.pickerRowSelected]}
                >
                  <View>
                    <Text style={[s.pickerRowText, isSel && s.pickerRowTextSel]}>{bible.name}</Text>
                    <Text style={s.pickerRowMeta}>{bible.language}</Text>
                  </View>
                  <Text style={[s.pickerRowMeta, isSel && { color: GOLD }]}>{bible.abbreviation}</Text>
                </TouchableOpacity>
              );
            })}
            {API_BIBLE_KEY && (
              <>
                <Text style={s.sectionLabel}>ONLINE · API.BIBLE</Text>
                {onlineBiblesLoading && (
                  <View style={[s.center, { flex: 0, paddingVertical: 28 }]}>
                    <ActivityIndicator color={GOLD} />
                  </View>
                )}
                {!onlineBiblesLoading && onlineBibles.map(item => {
                  const isSel = item.id === selectedBible.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => selectTranslation(item)}
                      style={[s.pickerRow, isSel && s.pickerRowSelected]}
                    >
                      <Text style={[s.pickerRowText, isSel && s.pickerRowTextSel]}>{item.name}</Text>
                      <Text style={[s.pickerRowMeta, isSel && { color: GOLD }]}>{item.abbreviation}</Text>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: BG },
  center:      { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', gap: 14 },
  statusLabel: { color: T_MUTED, fontSize: 13 },
  errorText:   { color: T_SEC, fontSize: 15, textAlign: 'center', paddingHorizontal: 40, lineHeight: 24 },
  retryBtn:    { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: GOLD_BORDER, backgroundColor: GOLD_DIM },
  retryBtnText:{ color: GOLD, fontSize: 14, fontWeight: '600' },

  // ── FlatList ────────────────────────────────────────────────────────────
  verseList: { paddingHorizontal: 24 },

  // ── Chapter header ──────────────────────────────────────────────────────
  chapterHeader: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 36,
    gap: 6,
  },
  chapterHeaderBook: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    color: T_MUTED,
  },
  chapterHeaderNum: {
    fontSize: 80,
    fontWeight: '200',
    color: GOLD,
    lineHeight: 86,
    letterSpacing: -3,
  },
  chapterHeaderRule: {
    width: 32,
    height: 1,
    backgroundColor: GOLD_BORDER,
    borderRadius: 1,
    marginTop: 4,
  },

  // ── Verse blocks ────────────────────────────────────────────────────────
  verseBlock: {
    marginBottom: 2,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  verseBlockPlaying: {
    backgroundColor: 'rgba(212,181,116,0.09)',
  },
  verseBlockTarget: {
    backgroundColor: 'rgba(212,181,116,0.14)',
  },
  verseContent: {
    fontSize: 17,
    lineHeight: 30,
    letterSpacing: 0.15,
    color: T_PRIMARY,
    fontWeight: '400',
  },
  verseNum: {
    fontSize: 10,
    color: GOLD,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Vignette ────────────────────────────────────────────────────────────
  vignette:    { position: 'absolute', left: 0, right: 0, zIndex: 5 },
  vignetteTop: { top: 0 },

  // ── Floating top bar ────────────────────────────────────────────────────
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
  },
  topBarBlur: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GOLD_BORDER,
  },
  topBarContent: {
    height: TOP_H,
  },
  topBarRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  topBarIconBtn: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: T_PRIMARY,
    letterSpacing: 0.1,
  },
  topBarChevron: {
    marginLeft: 4,
    marginTop: 1,
  },
  topBarRight: {
    width: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 14,
  },
  topBarBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 0.6,
  },

  // ── Floating control bar ────────────────────────────────────────────────
  ctrlBar: {
    position: 'absolute',
    left: 14, right: 14,
    zIndex: 10,
  },
  ctrlBarInner: {
    height: CTRL_H,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: CTRL_H / 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    paddingHorizontal: 4,
  },
  // Black rectangular box around Book + Translation
  ctrlInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
    marginLeft: 6,
    overflow: 'hidden',
  },
  ctrlInfoDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  ctrlBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  ctrlBookText: {
    color: T_PRIMARY,
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 72,
  },
  ctrlTransBtn: {
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  ctrlTransText: {
    color: T_SEC,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  ctrlSep: {
    width: 1,
    height: 20,
    backgroundColor: DIVIDER,
    marginHorizontal: 4,
  },
  ctrlAskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  ctrlAskText: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '600',
  },
  ctrlNavBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  // Play button — plain icon, no circle/border
  ctrlPlayBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  // ── Verse action sheet ──────────────────────────────────────────────────
  sheetOverlayRow: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: '#161616',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderTopColor: GOLD_BORDER,
    paddingHorizontal: 22,
    paddingTop: 22,
  },
  sheetQuote: {
    color: T_SEC,
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  sheetRef: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sheetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: DIVIDER,
    marginVertical: 16,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  sheetRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: GOLD_DIM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetRowLabel: {
    flex: 1,
    color: T_PRIMARY,
    fontSize: 15,
    fontWeight: '500',
  },
  sheetCancel: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: DIVIDER,
  },
  sheetCancelText: {
    color: T_SEC,
    fontSize: 15,
    fontWeight: '600',
  },

  // ── Modals ──────────────────────────────────────────────────────────────
  modalRoot: { flex: 1, backgroundColor: BG_CARD },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DIVIDER,
  },
  modalTitle:    { color: T_PRIMARY, fontSize: 17, fontWeight: '700' },
  sectionLabel:  {
    color: T_MUTED,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 8,
  },
  searchInput: {
    margin: 16,
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: T_PRIMARY,
    fontSize: 15,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DIVIDER,
  },
  pickerRowSelected:  { backgroundColor: GOLD_DIM },
  pickerRowText:      { color: T_PRIMARY, fontSize: 15 },
  pickerRowTextSel:   { color: GOLD, fontWeight: '600' },
  pickerRowMeta:      { color: T_MUTED, fontSize: 12 },
  pickerRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // ── Modal header buttons ─────────────────────────────────────────────────
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Chapter grid (step 2) ────────────────────────────────────────────────
  chapterGrid: {
    padding: 16,
  },
  chapterCell: {
    flex: 1,
    margin: 5,
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterCellActive: {
    backgroundColor: GOLD_DIM,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
  },
  chapterCellText: {
    color: T_SEC,
    fontSize: 15,
    fontWeight: '500',
  },
  chapterCellTextActive: {
    color: GOLD,
    fontWeight: '700',
  },

  // ── Search bar (inside top bar) ──────────────────────────────────────────
  searchGlassBar: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchGlassInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212,181,116,0.22)',
  },
  searchGlassInput: {
    flex: 1,
    color: T_PRIMARY,
    fontSize: 15,
    height: 22,
    padding: 0,
  },
  searchCancelBtn: {
    paddingLeft: 10,
    paddingRight: 2,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCancelText: {
    color: GOLD,
    fontSize: 15,
    fontWeight: '500',
  },

  // ── Search results panel ─────────────────────────────────────────────────
  resultsPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9,
    maxHeight: 340,
  },
  resultsPanelBlur: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GOLD_BORDER,
  },
  resultsEmpty: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 30,
  },
  resultsEmptyText: {
    color: T_MUTED,
    fontSize: 14,
  },
  resultRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultVerseNum: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  resultText: {
    color: T_SEC,
    fontSize: 14,
    lineHeight: 20,
  },
  resultHighlight: {
    color: T_PRIMARY,
    fontWeight: '700',
    backgroundColor: 'rgba(212,181,116,0.20)',
  },
});
