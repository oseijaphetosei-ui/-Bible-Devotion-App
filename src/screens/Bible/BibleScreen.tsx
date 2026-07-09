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
  KeyboardAvoidingView,
  Platform,
  Vibration,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
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
import { getNotes, createNote, type Note } from '../../services/notesService';

// ─── Reading modes ────────────────────────────────────────────────────────────
type ReadingMode = 'dark' | 'sepia' | 'light';

type ModeTokens = {
  bg: string; bgCard: string; bgModal: string;
  text: string; textSec: string; textMuted: string;
  divider: string;
  gold: string; goldDim: string; goldBorder: string;
  blurTint: 'dark' | 'light';
  statusBar: 'light-content' | 'dark-content';
  modeIcon: string; modeName: string;
  gradientColors: [string, string, string];
  pickerSelected: string;
  versePlayBg: string; verseTargetBg: string;
};

const MODES: Record<ReadingMode, ModeTokens> = {
  dark: {
    bg:           '#080A12',
    bgCard:       '#0D0F1A',
    bgModal:      '#0D0F1A',
    text:         '#E8E2D8',
    textSec:      'rgba(232,226,216,0.60)',
    textMuted:    'rgba(232,226,216,0.30)',
    divider:      'rgba(232,226,216,0.07)',
    gold:         '#C9A96B',
    goldDim:      'rgba(201,169,107,0.09)',
    goldBorder:   'rgba(201,169,107,0.18)',
    blurTint:     'dark',
    statusBar:    'light-content',
    modeIcon:     'moon-outline',
    modeName:     'Dark',
    gradientColors: ['#080A12', '#080A12', 'transparent'],
    pickerSelected: 'rgba(201,169,107,0.09)',
    versePlayBg:    'rgba(201,169,107,0.09)',
    verseTargetBg:  'rgba(201,169,107,0.05)',
  },
  sepia: {
    bg:           '#F4EDD7',
    bgCard:       '#EDE3C4',
    bgModal:      '#EDE3C4',
    text:         '#2C1F0F',
    textSec:      'rgba(44,31,15,0.65)',
    textMuted:    'rgba(44,31,15,0.38)',
    divider:      'rgba(44,31,15,0.10)',
    gold:         '#8B6914',
    goldDim:      'rgba(139,105,20,0.10)',
    goldBorder:   'rgba(139,105,20,0.22)',
    blurTint:     'light',
    statusBar:    'dark-content',
    modeIcon:     'book-outline',
    modeName:     'Sepia',
    gradientColors: ['#F4EDD7', '#F4EDD7', 'transparent'],
    pickerSelected: 'rgba(139,105,20,0.10)',
    versePlayBg:    'rgba(139,105,20,0.10)',
    verseTargetBg:  'rgba(139,105,20,0.06)',
  },
  light: {
    bg:           '#FAFAF8',
    bgCard:       '#F0F0EE',
    bgModal:      '#FAFAF8',
    text:         '#1C1C1A',
    textSec:      'rgba(28,28,26,0.65)',
    textMuted:    'rgba(28,28,26,0.38)',
    divider:      'rgba(28,28,26,0.08)',
    gold:         '#9E7320',
    goldDim:      'rgba(158,115,32,0.08)',
    goldBorder:   'rgba(158,115,32,0.20)',
    blurTint:     'light',
    statusBar:    'dark-content',
    modeIcon:     'sunny-outline',
    modeName:     'Light',
    gradientColors: ['#FAFAF8', '#FAFAF8', 'transparent'],
    pickerSelected: 'rgba(158,115,32,0.08)',
    versePlayBg:    'rgba(158,115,32,0.08)',
    verseTargetBg:  'rgba(158,115,32,0.04)',
  },
};

const MODE_ORDER: ReadingMode[] = ['dark', 'sepia', 'light'];

// ─── Font sizes ───────────────────────────────────────────────────────────────
type BibleFontSize = 'sm' | 'md' | 'lg' | 'xl';
const BIBLE_FONT_SIZES: Record<BibleFontSize, number> = { sm: 15, md: 19.5, lg: 23, xl: 27 };
const BIBLE_FONT_ORDER: BibleFontSize[] = ['sm', 'md', 'lg', 'xl'];
// Shows visually different Aa per size level
const FONT_AA_SIZES: Record<BibleFontSize, number> = { sm: 12, md: 14, lg: 16, xl: 18 };

const SERIF = 'Georgia';

const TOP_H  = 50; // floating header content height
const CTRL_H = 58; // floating control bar height

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type Params  = { bookIndex?: number; chapter?: number; verseToScroll?: number };

function parseBibleRef(ref: string): { bookIndex: number; chapter: number; verse: number } | null {
  const match = ref.match(/^(.+)\s+(\d+):(\d+)$/);
  if (!match) return null;
  const bookName = match[1].trim();
  const chNum = parseInt(match[2], 10);
  const verseNum = parseInt(match[3], 10);
  const bIdx = BOOKS.findIndex(b => b.name.toLowerCase() === bookName.toLowerCase());
  if (bIdx === -1) return null;
  return { bookIndex: bIdx, chapter: chNum, verse: verseNum };
}

// ─── Highlighted search text ──────────────────────────────────────────────────
function HighlightedText({ text, query, style, goldColor }: { text: string; query: string; style?: object; goldColor: string }) {
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
        p.hi
          ? <Text key={k} style={{ fontWeight: '700', color: goldColor, backgroundColor: `${goldColor}22` }}>{p.t}</Text>
          : p.t
      )}
    </Text>
  );
}

// ─── Chapter header ───────────────────────────────────────────────────────────
function ChapterHeader({ bookName, chapter, chapterCount, m }: {
  bookName: string; chapter: number; chapterCount: number; m: ModeTokens;
}) {
  return (
    <View style={s.chapterHeader}>
      {/* Ambient glow behind the chapter number */}
      <View style={[s.chapterGlow, { backgroundColor: m.goldBorder }]} pointerEvents="none" />

      <Text style={[s.chapterHeaderBook, { color: m.textMuted }]}>
        {bookName.toUpperCase()}
      </Text>
      <Text style={[s.chapterHeaderNum, { color: m.text, fontFamily: SERIF }]}>
        {chapter}
      </Text>

      {/* Decorative ornament */}
      <View style={s.chapterOrnament}>
        <View style={[s.chapterOrnamentLine, { backgroundColor: m.goldBorder }]} />
        <Text style={[s.chapterOrnamentDot, { color: m.gold }]}>✦</Text>
        <View style={[s.chapterOrnamentLine, { backgroundColor: m.goldBorder }]} />
      </View>

      <Text style={[s.chapterHeaderLabel, { color: m.gold, fontFamily: SERIF }]}>
        Chapter {chapter}
      </Text>
      <Text style={[s.chapterHeaderCount, { color: m.textMuted }]}>
        {chapterCount} chapters in this book
      </Text>
    </View>
  );
}

// ─── Verse row ────────────────────────────────────────────────────────────────
type VerseRowProps = {
  item: Verse;
  isPlaying: boolean;
  isTarget: boolean;
  hasNote: boolean;
  fontSize: number;
  onLongPress: () => void;
  textColor: string;
  textSecColor: string;
  goldColor: string;
  goldBorder: string;
  versePlayBg: string;
  verseTargetBg: string;
};

const VerseRow = memo(function VerseRow({
  item, isPlaying, isTarget, hasNote, fontSize, onLongPress,
  textColor, textSecColor, goldColor, goldBorder, versePlayBg, verseTargetBg,
}: VerseRowProps) {
  return (
    <TouchableOpacity
      onLongPress={onLongPress}
      delayLongPress={420}
      activeOpacity={0.86}
      accessibilityLabel={`Verse ${item.verse}. ${item.text}`}
      accessibilityHint="Long press for actions"
      accessibilityRole="button"
      style={[
        s.verseBlock,
        isPlaying && { backgroundColor: versePlayBg },
        isTarget  && { backgroundColor: verseTargetBg },
      ]}
    >
      {hasNote && (
        <View style={[s.noteMarker, { backgroundColor: `${goldColor}80` }]} />
      )}
      <Text style={[s.verseContent, { fontSize, lineHeight: fontSize * 1.8, color: textColor }]}>
        <Text style={[s.verseNum, { color: goldColor }]}>{item.verse}{'  '}</Text>
        {item.text}
      </Text>
    </TouchableOpacity>
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function BibleScreen() {
  const navigation = useNavigation<NavProp>();
  const route      = useRoute();
  const params     = (route.params ?? {}) as Params;
  const { top: safeTop, bottom: safeBottom } = useSafeAreaInsets();

  const flatListRef    = useRef<FlatList>(null);
  const lastScrollY    = useRef(0);
  const barsVisible    = useRef(true);
  const isPlayingRef   = useRef(false);
  const soundRef       = useRef<Audio.Sound | null>(null);
  const searchModeRef  = useRef(false);
  const searchInputRef = useRef<TextInput>(null);

  // ── Reading mode ──────────────────────────────────────────────────────────
  const [readingMode, setReadingMode] = useState<ReadingMode>('dark');
  const m = MODES[readingMode];

  const cycleMode = useCallback(() => {
    setReadingMode(prev => {
      const idx = MODE_ORDER.indexOf(prev);
      return MODE_ORDER[(idx + 1) % MODE_ORDER.length];
    });
  }, []);

  // ── Scroll progress ───────────────────────────────────────────────────────
  const [scrollProgress, setScrollProgress] = useState(0);

  // ── Scroll-hide animation ─────────────────────────────────────────────────
  const headerAnim  = useRef(new Animated.Value(0)).current;
  const controlAnim = useRef(new Animated.Value(0)).current;

  // ── Search animations ─────────────────────────────────────────────────────
  const navOp      = useRef(new Animated.Value(1)).current;
  const searchOp   = useRef(new Animated.Value(0)).current;
  const cancelW    = useRef(new Animated.Value(0)).current;
  const resultsOp  = useRef(new Animated.Value(0)).current;

  // ── Search state ──────────────────────────────────────────────────────────
  const [searchMode,  setSearchMode]  = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Reading state ─────────────────────────────────────────────────────────
  const [bookIndex, setBookIndex] = useState(params.bookIndex ?? 42);
  const [chapter,   setChapter]   = useState(params.chapter   ?? 1);
  const [verses,    setVerses]    = useState<Verse[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // ── Picker state ──────────────────────────────────────────────────────────
  const [bookPickerVisible,        setBookPickerVisible]        = useState(false);
  const [bookPickerStep,           setBookPickerStep]           = useState<'books' | 'chapters'>('books');
  const [pendingBookIdx,           setPendingBookIdx]           = useState<number | null>(null);
  const [bookSearch,               setBookSearch]               = useState('');
  const [testamentFilter,          setTestamentFilter]          = useState<'all' | 'ot' | 'nt'>('all');
  const [translationPickerVisible, setTranslationPickerVisible] = useState(false);
  const [onlineBibles,             setOnlineBibles]             = useState<BibleVersion[]>([]);
  const [onlineBiblesLoading,      setOnlineBiblesLoading]      = useState(false);
  const [selectedBible,            setSelectedBible]            = useState<BibleVersion>(OFFLINE_BIBLES[0]);

  // ── Interaction state ─────────────────────────────────────────────────────
  const [selectedVerse,       setSelectedVerse]       = useState<Verse | null>(null);
  const [verseActionsVisible, setVerseActionsVisible] = useState(false);
  const [isPlaying,           setIsPlaying]           = useState(false);
  const [playingVerse,        setPlayingVerse]        = useState<number | null>(null);

  // ── Note state ────────────────────────────────────────────────────────────
  const [noteVerseSet,     setNoteVerseSet]     = useState<Set<number>>(new Set());
  const [notesByVerse,     setNotesByVerse]     = useState<Map<number, Note[]>>(new Map());
  const [noteSheetVisible, setNoteSheetVisible] = useState(false);
  const [noteText,         setNoteText]         = useState('');
  const [noteSaving,       setNoteSaving]       = useState(false);
  const noteInputRef = useRef<TextInput>(null);

  // ── Font size ─────────────────────────────────────────────────────────────
  const [bibleFont, setBibleFont] = useState<BibleFontSize>('md');
  const cycleBibleFont = useCallback(() => {
    setBibleFont(prev => BIBLE_FONT_ORDER[(BIBLE_FONT_ORDER.indexOf(prev) + 1) % BIBLE_FONT_ORDER.length]);
  }, []);

  const book = BOOKS[bookIndex];

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchChapter = useCallback(async (bIdx: number, ch: number, bible: BibleVersion) => {
    setLoading(true);
    setError(null);
    setVerses([]);
    setScrollProgress(0);
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

  const loadNotesForChapter = useCallback(async () => {
    try {
      const allNotes = await getNotes();
      const verseSet = new Set<number>();
      const verseMap = new Map<number, Note[]>();
      allNotes.forEach(note => {
        if (!note.bibleReference) return;
        const parsed = parseBibleRef(note.bibleReference);
        if (!parsed || parsed.bookIndex !== bookIndex || parsed.chapter !== chapter) return;
        verseSet.add(parsed.verse);
        verseMap.set(parsed.verse, [...(verseMap.get(parsed.verse) ?? []), note]);
      });
      setNoteVerseSet(verseSet);
      setNotesByVerse(verseMap);
    } catch { /* offline */ }
  }, [bookIndex, chapter]);

  useFocusEffect(useCallback(() => { loadNotesForChapter(); }, [loadNotesForChapter]));

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

  useEffect(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setPlayingVerse(null);
    soundRef.current?.stopAsync().catch(() => {});
    soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;
    loadNotesForChapter();
  }, [bookIndex, chapter, loadNotesForChapter]);

  // ── Scroll-based bar visibility + progress tracking ───────────────────────
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
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const y    = contentOffset.y;
    const diff = y - lastScrollY.current;
    lastScrollY.current = y;

    // Progress tracking
    const maxScroll = contentSize.height - layoutMeasurement.height;
    if (maxScroll > 0) {
      setScrollProgress(Math.max(0, Math.min(1, y / maxScroll)));
    }

    if (searchModeRef.current) return;
    if (diff > 10 && y > 80)  hideBars();
    else if (diff < -10)       showBars();
  }, [showBars, hideBars]);

  // ── Audio playback ────────────────────────────────────────────────────────
  const playFromIndex = useCallback(async (startIdx: number, allVerses: Verse[]) => {
    if (!isPlayingRef.current || startIdx >= allVerses.length) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setPlayingVerse(null);
      return;
    }
    const v = allVerses[startIdx];
    setPlayingVerse(v.verse);
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
          if (isPlayingRef.current) void playFromIndex(startIdx + 1, allVerses);
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
    setTestamentFilter('all');
  };

  const selectBook = (idx: number) => {
    setPendingBookIdx(idx);
    setBookPickerStep('chapters');
    setBookSearch('');
  };

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

  const filteredBooks = useMemo(() => {
    const q = bookSearch.toLowerCase();
    return BOOKS
      .map((book, index) => ({ book, index }))
      .filter(({ book, index }) => {
        const matchesSearch = !bookSearch || book.name.toLowerCase().includes(q);
        const matchesTestament =
          testamentFilter === 'all' ||
          (testamentFilter === 'ot' && index < 39) ||
          (testamentFilter === 'nt' && index >= 39);
        return matchesSearch && matchesTestament;
      });
  }, [bookSearch, testamentFilter]);

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

  // ── Note actions ──────────────────────────────────────────────────────────
  const handleAddNote = useCallback(() => {
    setVerseActionsVisible(false);
    setTimeout(() => {
      setNoteText('');
      setNoteSheetVisible(true);
      setTimeout(() => noteInputRef.current?.focus(), 160);
    }, 350);
  }, []);

  const handleViewNote = useCallback(() => {
    if (!selectedVerse) return;
    const notes = notesByVerse.get(selectedVerse.verse);
    const noteId = notes?.[0]?.id;
    if (!noteId) return;
    setVerseActionsVisible(false);
    setTimeout(() => {
      (navigation as any).navigate('MainTabs', {
        screen: 'NotesTab',
        params: { screen: 'NoteEditor', params: { noteId } },
      });
    }, 300);
  }, [selectedVerse, notesByVerse, navigation]);

  const handleSaveNote = useCallback(async () => {
    if (!selectedVerse || !noteText.trim() || noteSaving) return;
    setNoteSaving(true);
    try {
      const ref = `${book.name} ${chapter}:${selectedVerse.verse}`;
      const newNote = await createNote({
        title: ref,
        content: noteText.trim(),
        bibleReference: ref,
        devotionId: undefined,
        tags: [],
      });
      setNoteVerseSet(prev => new Set([...prev, selectedVerse.verse]));
      setNotesByVerse(prev => {
        const updated = new Map(prev);
        updated.set(selectedVerse.verse, [newNote, ...(updated.get(selectedVerse.verse) ?? [])]);
        return updated;
      });
      if (Platform.OS !== 'web') Vibration.vibrate(40);
      setNoteSheetVisible(false);
      setNoteText('');
    } catch { /* keep sheet open on error */ }
    finally { setNoteSaving(false); }
  }, [selectedVerse, noteText, noteSaving, book.name, chapter]);

  // ── Search ────────────────────────────────────────────────────────────────
  const enterSearch = useCallback(() => {
    searchModeRef.current = true;
    setSearchMode(true);
    // Snap bars to fully visible position — prevents the search bar appearing
    // behind the Dynamic Island when enterSearch fires while bars are mid-animation
    // (e.g. user tapped search during the bar-reappear spring from a scroll-hide).
    barsVisible.current = true;
    headerAnim.stopAnimation();
    controlAnim.stopAnimation();
    headerAnim.setValue(0);
    controlAnim.setValue(0);
    Animated.parallel([
      Animated.timing(navOp,    { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(searchOp, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    Animated.spring(cancelW, { toValue: 72, tension: 160, friction: 22, useNativeDriver: false }).start();
    setTimeout(() => searchInputRef.current?.focus(), 120);
  }, [navOp, searchOp, cancelW]);

  const exitSearch = useCallback(() => {
    Keyboard.dismiss();
    setSearchQuery('');
    Animated.parallel([
      Animated.timing(searchOp,  { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(navOp,     { toValue: 1, duration: 210, useNativeDriver: true }),
      Animated.timing(resultsOp, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      searchModeRef.current = false;
      setSearchMode(false);
    });
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

  const ctrlBottom = 66 + Math.max(safeBottom - 22, 2) + 8;

  const controlTranslateY = controlAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, CTRL_H + 100],
  });

  const topPad    = safeTop + TOP_H + 24;
  const bottomPad = ctrlBottom + CTRL_H + 20;

  // ── Verse renderer ────────────────────────────────────────────────────────
  const renderVerse = useCallback(({ item }: { item: Verse }) => (
    <VerseRow
      item={item}
      isPlaying={playingVerse === item.verse}
      isTarget={params.verseToScroll === item.verse}
      hasNote={noteVerseSet.has(item.verse)}
      fontSize={BIBLE_FONT_SIZES[bibleFont]}
      onLongPress={() => openVerseActions(item)}
      textColor={m.text}
      textSecColor={m.textSec}
      goldColor={m.gold}
      goldBorder={m.goldBorder}
      versePlayBg={m.versePlayBg}
      verseTargetBg={m.verseTargetBg}
    />
  ), [playingVerse, params.verseToScroll, noteVerseSet, bibleFont, openVerseActions, readingMode]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: m.bg }]}>
      <StatusBar barStyle={m.statusBar} backgroundColor="transparent" translucent />

      {/* ── Main reading content ──────────────────────────────────────── */}
      {loading ? (
        <View style={[s.center, { backgroundColor: m.bg }]}>
          <ActivityIndicator color={m.gold} size="large" />
          <Text style={[s.statusLabel, { color: m.textMuted, fontFamily: SERIF }]}>
            Loading scripture…
          </Text>
        </View>
      ) : error ? (
        <View style={[s.center, { backgroundColor: m.bg }]}>
          <Ionicons name="cloud-offline-outline" size={44} color={m.textSec} />
          <Text style={[s.errorText, { color: m.textSec }]}>{error}</Text>
          <TouchableOpacity
            onPress={() => fetchChapter(bookIndex, chapter, selectedBible)}
            style={[s.retryBtn, { backgroundColor: m.goldDim, borderColor: m.goldBorder }]}
            accessibilityLabel="Try loading again"
            accessibilityRole="button"
          >
            <Text style={[s.retryBtnText, { color: m.gold }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={verses}
          keyExtractor={v => String(v.verse)}
          extraData={[playingVerse, params.verseToScroll, noteVerseSet, bibleFont, readingMode]}
          ListHeaderComponent={
            <ChapterHeader bookName={book.name} chapter={chapter} chapterCount={book.chapters} m={m} />
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

      {/* Top vignette */}
      <LinearGradient
        colors={m.gradientColors}
        style={[s.vignette, s.vignetteTop, { height: topPad + 8 }]}
        pointerEvents="none"
      />

      {/* ── Search results panel ──────────────────────────────────────── */}
      {searchMode && searchQuery.length >= 2 && (
        <Animated.View style={[s.resultsPanel, { top: safeTop + TOP_H, opacity: resultsOp }]}>
          <BlurView intensity={82} tint={m.blurTint} style={[s.resultsPanelBlur, { borderBottomColor: m.goldBorder }]}>
            {searchResults.length === 0 ? (
              <View style={s.resultsEmpty}>
                <Ionicons name="search-outline" size={22} color={m.textMuted} />
                <Text style={[s.resultsEmptyText, { color: m.textMuted }]}>
                  No results in {book.name} {chapter}
                </Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={v => String(v.verse)}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingVertical: 6 }}
                ItemSeparatorComponent={() => (
                  <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: m.divider, marginHorizontal: 16 }} />
                )}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.resultRow}
                    onPress={() => scrollToVerse(item)}
                    accessibilityLabel={`${book.name} ${chapter}:${item.verse}. ${item.text}`}
                    accessibilityRole="button"
                  >
                    <Text style={[s.resultVerseNum, { color: m.gold }]}>
                      {book.name} {chapter}:{item.verse}
                    </Text>
                    <HighlightedText
                      text={item.text}
                      query={searchQuery}
                      style={[s.resultText, { color: m.textSec }]}
                      goldColor={m.gold}
                    />
                  </TouchableOpacity>
                )}
              />
            )}
          </BlurView>
        </Animated.View>
      )}

      {/* ── Floating top bar ──────────────────────────────────────────── */}
      <Animated.View style={[s.topBar, { transform: [{ translateY: headerTranslateY }] }]}>
        <BlurView intensity={72} tint={m.blurTint} style={[s.topBarBlur, { borderBottomColor: m.goldBorder }]}>
          <View style={{ height: safeTop }} />
          <View style={s.topBarContent}>
            {/* NAV ROW */}
            <Animated.View
              pointerEvents={searchMode ? 'none' : 'auto'}
              style={[s.topBarRow, { opacity: navOp }]}
            >
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={s.topBarIconBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                <Ionicons name="chevron-back" size={22} color={m.gold} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setBookPickerVisible(true)}
                style={s.topBarCenter}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                accessibilityLabel={`Currently reading ${book.name} chapter ${chapter}. Tap to change.`}
                accessibilityRole="button"
              >
                <Text style={[s.topBarTitle, { color: m.text, fontFamily: SERIF }]} numberOfLines={1}>
                  {book.name} {chapter}
                </Text>
                <Ionicons name="chevron-down" size={12} color={m.gold} style={s.topBarChevron} />
              </TouchableOpacity>

              <View style={s.topBarRight}>
                <TouchableOpacity
                  onPress={openTranslationPicker}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  accessibilityLabel={`Translation: ${selectedBible.name}. Tap to change.`}
                  accessibilityRole="button"
                >
                  <Text style={[s.topBarBadge, { color: m.gold }]}>{selectedBible.abbreviation}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={enterSearch}
                  style={s.topBarIconBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                  accessibilityLabel="Search this chapter"
                  accessibilityRole="button"
                >
                  <Ionicons name="search-outline" size={18} color={m.textSec} />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* SEARCH ROW */}
            <Animated.View
              pointerEvents={searchMode ? 'auto' : 'none'}
              style={[s.topBarRow, { opacity: searchOp }]}
            >
              <View style={[s.searchGlassBar, { borderColor: m.goldBorder }]}>
                <View style={[s.searchGlassInner, { backgroundColor: `${m.text}08`, borderColor: m.goldBorder }]}>
                  <Ionicons name="search" size={14} color={m.textSec} />
                  <TextInput
                    ref={searchInputRef}
                    style={[s.searchGlassInput, { color: m.text }]}
                    placeholder="Search this chapter…"
                    placeholderTextColor={m.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCorrect={false}
                    returnKeyType="search"
                    accessibilityLabel="Search within chapter"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Clear search"
                    >
                      <Ionicons name="close-circle" size={15} color={m.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <Animated.View style={{ width: cancelW, overflow: 'hidden' }}>
                <TouchableOpacity
                  style={s.searchCancelBtn}
                  onPress={exitSearch}
                  accessibilityLabel="Cancel search"
                >
                  <Text style={[s.searchCancelText, { color: m.gold }]}>Cancel</Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </View>
        </BlurView>
      </Animated.View>

      {/* ── Floating control bar ──────────────────────────────────────── */}
      {verses.length > 0 && (
        <Animated.View style={[s.ctrlBar, { bottom: ctrlBottom, transform: [{ translateY: controlTranslateY }] }]}>
          <BlurView intensity={76} tint={m.blurTint} style={[s.ctrlBarInner, { borderColor: m.goldBorder }]}>

            {/* Reading mode toggle */}
            <TouchableOpacity
              onPress={cycleMode}
              style={s.ctrlModeBtn}
              accessibilityLabel={`Reading mode: ${m.modeName}. Tap to change.`}
              accessibilityRole="button"
            >
              <Ionicons name={m.modeIcon as any} size={16} color={m.gold} />
              <Text style={[s.ctrlModeText, { color: m.gold }]}>{m.modeName}</Text>
            </TouchableOpacity>

            <View style={[s.ctrlSep, { backgroundColor: m.divider }]} />

            {/* Ask AI */}
            <TouchableOpacity
              onPress={openAsk}
              style={s.ctrlAskBtn}
              accessibilityLabel="Ask AI about this chapter"
              accessibilityRole="button"
            >
              <Ionicons name="chatbubble-ellipses-outline" size={15} color={m.gold} />
              <Text style={[s.ctrlAskText, { color: m.gold }]}>Ask</Text>
            </TouchableOpacity>

            <View style={[s.ctrlSep, { backgroundColor: m.divider }]} />

            {/* Font size */}
            <TouchableOpacity
              onPress={cycleBibleFont}
              style={s.ctrlFontBtn}
              accessibilityLabel={`Text size ${bibleFont.toUpperCase()}, tap to cycle`}
              accessibilityRole="button"
            >
              <Text style={[s.ctrlFontAa, { color: m.text, fontFamily: SERIF, fontSize: FONT_AA_SIZES[bibleFont] }]}>
                Aa
              </Text>
            </TouchableOpacity>

            <View style={[s.ctrlSep, { backgroundColor: m.divider }]} />

            {/* Prev chapter */}
            <TouchableOpacity
              onPress={() => setChapter(c => Math.max(1, c - 1))}
              style={s.ctrlNavBtn}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              disabled={chapter <= 1}
              accessibilityLabel="Previous chapter"
              accessibilityRole="button"
            >
              <Ionicons name="chevron-back" size={22} color={chapter <= 1 ? m.textMuted : m.text} />
            </TouchableOpacity>

            {/* Play / Pause — KJV only */}
            {selectedBible.id === 'kjv' && (
              <TouchableOpacity
                onPress={togglePlay}
                style={s.ctrlPlayBtn}
                accessibilityLabel={isPlaying ? 'Pause audio' : 'Play chapter audio'}
                accessibilityRole="button"
              >
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color={m.text} />
              </TouchableOpacity>
            )}

            {/* Next chapter */}
            <TouchableOpacity
              onPress={() => setChapter(c => Math.min(book.chapters, c + 1))}
              style={s.ctrlNavBtn}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              disabled={chapter >= book.chapters}
              accessibilityLabel="Next chapter"
              accessibilityRole="button"
            >
              <Ionicons name="chevron-forward" size={22} color={chapter >= book.chapters ? m.textMuted : m.text} />
            </TouchableOpacity>

          </BlurView>

          {/* Reading progress bar — outside blur for crispness */}
          <View style={[s.progressTrack, { backgroundColor: `${m.gold}18` }]}>
            <View style={[s.progressFill, { backgroundColor: m.gold, width: `${scrollProgress * 100}%` as any }]} />
          </View>
        </Animated.View>
      )}

      {/* ── Verse action sheet ────────────────────────────────────────── */}
      <Modal
        visible={verseActionsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setVerseActionsVisible(false)}
      >
        <View style={[s.sheetOverlay, { backgroundColor: 'rgba(4,5,12,0.72)' }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setVerseActionsVisible(false)}
          />
        </View>
        <View style={[s.sheet, { backgroundColor: m.bgCard, borderTopColor: m.goldBorder, paddingBottom: safeBottom + 12 }]}>
          {/* Drag handle */}
          <View style={[s.sheetHandle, { backgroundColor: m.divider }]} />

          {selectedVerse && (
            <Text style={[s.sheetQuote, { color: m.textSec, fontFamily: SERIF }]} numberOfLines={3}>
              "{selectedVerse.text}"
            </Text>
          )}
          <Text style={[s.sheetRef, { color: m.gold }]}>
            {book.name} {chapter}:{selectedVerse?.verse} · {selectedBible.abbreviation}
          </Text>
          <View style={[s.sheetDivider, { backgroundColor: m.divider }]} />

          {((): Array<{ icon: string; label: string; onPress: () => void }> => {
            const verseNotes = selectedVerse ? (notesByVerse.get(selectedVerse.verse) ?? []) : [];
            const hasVerseNotes = verseNotes.length > 0;
            return [
              ...(hasVerseNotes
                ? [
                    { icon: 'document-text-outline', label: `View Note${verseNotes.length > 1 ? 's' : ''}`, onPress: handleViewNote },
                    { icon: 'add-circle-outline',    label: 'Add Another Note',                             onPress: handleAddNote },
                  ]
                : [{ icon: 'pencil-outline', label: 'Add Note', onPress: handleAddNote }]
              ),
              { icon: 'share-social-outline',        label: 'Share Verse',            onPress: handleShare },
              { icon: 'chatbubble-ellipses-outline', label: 'Ask About This Verse',   onPress: handleAskVerse },
            ];
          })().map(a => (
            <TouchableOpacity
              key={a.label}
              style={s.sheetRow}
              onPress={a.onPress}
              accessibilityLabel={a.label}
              accessibilityRole="button"
            >
              <View style={[s.sheetRowIcon, { backgroundColor: m.goldDim }]}>
                <Ionicons name={a.icon as any} size={18} color={m.gold} />
              </View>
              <Text style={[s.sheetRowLabel, { color: m.text }]}>{a.label}</Text>
              <Ionicons name="chevron-forward" size={14} color={m.textMuted} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[s.sheetCancel, { borderTopColor: m.divider }]}
            onPress={() => setVerseActionsVisible(false)}
            accessibilityLabel="Cancel"
            accessibilityRole="button"
          >
            <Text style={[s.sheetCancelText, { color: m.textSec }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Inline note sheet ────────────────────────────────────────── */}
      <Modal
        visible={noteSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNoteSheetVisible(false)}
      >
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => { Keyboard.dismiss(); setNoteSheetVisible(false); setNoteText(''); }}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={s.noteSheetKAV}
          >
            <View style={[s.noteSheet, { backgroundColor: m.bgCard, borderTopColor: m.goldBorder, paddingBottom: safeBottom + 16 }]}>
              <View style={[s.noteSheetHandle, { backgroundColor: m.divider }]} />

              {selectedVerse && (
                <Text style={[s.noteSheetRef, { color: m.gold }]}>
                  {book.name} {chapter}:{selectedVerse.verse}
                </Text>
              )}
              {selectedVerse && (
                <Text style={[s.noteSheetQuote, { color: m.textSec, fontFamily: SERIF }]} numberOfLines={4}>
                  "{selectedVerse.text}"
                </Text>
              )}

              <View style={[s.noteSheetRule, { backgroundColor: m.divider }]} />
              <Text style={[s.noteSheetLabel, { color: m.textMuted }]}>MY REFLECTION</Text>

              <TextInput
                ref={noteInputRef}
                style={[s.noteSheetInput, { color: m.text, fontFamily: SERIF }]}
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Write what God is speaking to you…"
                placeholderTextColor={m.textMuted}
                multiline
                textAlignVertical="top"
                accessibilityLabel="Note text input"
              />

              <TouchableOpacity
                style={[s.noteSheetSave, { backgroundColor: m.gold }, (!noteText.trim() || noteSaving) && { opacity: 0.45 }]}
                onPress={handleSaveNote}
                disabled={!noteText.trim() || noteSaving}
                activeOpacity={0.82}
                accessibilityLabel="Save reflection"
                accessibilityRole="button"
              >
                {noteSaving
                  ? <ActivityIndicator size="small" color="#1A1005" />
                  : <Text style={s.noteSheetSaveText}>Save Reflection</Text>
                }
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Book picker modal ─────────────────────────────────────────── */}
      <Modal
        visible={bookPickerVisible}
        animationType="slide"
        onRequestClose={closeBookPicker}
      >
        <View style={[s.modalRoot, { backgroundColor: m.bgModal, paddingTop: safeTop }]}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >

              {bookPickerStep === 'books' ? (
                <>
                  {/* Header */}
                  <View style={[s.modalHeader, { borderBottomColor: m.divider }]}>
                    <Text style={[s.modalTitle, { color: m.text }]}>Books of the Bible</Text>
                    <TouchableOpacity
                      onPress={closeBookPicker}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={[s.modalCloseBtn, { backgroundColor: m.goldDim }]}
                      accessibilityLabel="Close book picker"
                      accessibilityRole="button"
                    >
                      <Ionicons name="close" size={18} color={m.text} />
                    </TouchableOpacity>
                  </View>

                  {/* OT / NT tabs */}
                  <View style={[s.testamentTabs, { backgroundColor: m.bgCard }]}>
                    {(['all', 'ot', 'nt'] as const).map(filter => (
                      <TouchableOpacity
                        key={filter}
                        style={[
                          s.testamentTab,
                          testamentFilter === filter && { backgroundColor: m.goldDim },
                        ]}
                        onPress={() => setTestamentFilter(filter)}
                        accessibilityLabel={filter === 'all' ? 'All books' : filter === 'ot' ? 'Old Testament' : 'New Testament'}
                        accessibilityRole="button"
                      >
                        <Text style={[
                          s.testamentTabText,
                          { color: testamentFilter === filter ? m.gold : m.textMuted },
                        ]}>
                          {filter === 'all' ? 'All' : filter === 'ot' ? 'Old Testament' : 'New Testament'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <GlassSearchBar
                    value={bookSearch}
                    onChangeText={setBookSearch}
                    placeholder="Search books…"
                    dark={readingMode === 'dark'}
                    showCancel={false}
                    style={{ margin: 16 }}
                  />

                  <FlatList
                    data={filteredBooks}
                    keyExtractor={({ book }) => book.usfm}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    contentContainerStyle={{ paddingBottom: safeBottom + 8 }}
                    renderItem={({ item: { book, index: idx } }) => {
                      const isSelected = idx === bookIndex;
                      const testament  = idx < 39 ? 'OT' : 'NT';
                      return (
                        <TouchableOpacity
                          onPress={() => selectBook(idx)}
                          style={[s.pickerRow, { borderBottomColor: m.divider }, isSelected && { backgroundColor: m.pickerSelected }]}
                          accessibilityLabel={`${book.name}, ${book.chapters} chapters, ${testament}`}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isSelected }}
                        >
                          <View style={s.pickerRowLeft}>
                            <Text style={[s.pickerRowText, { color: isSelected ? m.gold : m.text }, isSelected && { fontWeight: '600' }]}>
                              {book.name}
                            </Text>
                            <Text style={[s.pickerRowTestament, { color: m.textMuted }]}>{testament}</Text>
                          </View>
                          <View style={s.pickerRowRight}>
                            <Text style={[s.pickerRowMeta, { color: isSelected ? m.gold : m.textMuted }]}>
                              {book.chapters} ch
                            </Text>
                            <Ionicons name="chevron-forward" size={14} color={m.textMuted} />
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </>
              ) : (
                <>
                  {/* Chapter grid */}
                  <View style={[s.modalHeader, { borderBottomColor: m.divider }]}>
                    <TouchableOpacity
                      onPress={() => setBookPickerStep('books')}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={[s.modalBackBtn, { backgroundColor: m.goldDim }]}
                      accessibilityLabel="Back to book list"
                      accessibilityRole="button"
                    >
                      <Ionicons name="arrow-back" size={18} color={m.text} />
                    </TouchableOpacity>
                    <Text style={[s.modalTitle, { color: m.text }]}>
                      {pendingBookIdx !== null ? BOOKS[pendingBookIdx].name : ''}
                    </Text>
                    <TouchableOpacity
                      onPress={closeBookPicker}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={[s.modalCloseBtn, { backgroundColor: m.goldDim }]}
                      accessibilityLabel="Close"
                      accessibilityRole="button"
                    >
                      <Ionicons name="close" size={18} color={m.text} />
                    </TouchableOpacity>
                  </View>

                  <FlatList
                    data={
                      pendingBookIdx !== null
                        ? Array.from({ length: BOOKS[pendingBookIdx].chapters }, (_, i) => i + 1)
                        : []
                    }
                    keyExtractor={ch => String(ch)}
                    numColumns={6}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={s.chapterGrid}
                    renderItem={({ item: ch }) => {
                      const isActive = pendingBookIdx === bookIndex && ch === chapter;
                      return (
                        <TouchableOpacity
                          onPress={() => selectChapter(ch)}
                          style={[
                            s.chapterCell,
                            { backgroundColor: isActive ? m.goldDim : `${m.text}07` },
                            isActive && { borderWidth: 1, borderColor: m.goldBorder },
                          ]}
                          accessibilityLabel={`Chapter ${ch}${isActive ? ', currently reading' : ''}`}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isActive }}
                        >
                          <Text style={[s.chapterCellText, { color: isActive ? m.gold : m.textSec, fontWeight: isActive ? '700' : '500' }]}>
                            {ch}
                          </Text>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </>
              )}
            </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Translation picker modal ──────────────────────────────────── */}
      <Modal
        visible={translationPickerVisible}
        animationType="slide"
        onRequestClose={() => setTranslationPickerVisible(false)}
      >
        <View style={[s.modalRoot, { backgroundColor: m.bgModal, paddingTop: safeTop }]}>
            <View style={[s.modalHeader, { borderBottomColor: m.divider }]}>
              <Text style={[s.modalTitle, { color: m.text }]}>Translation</Text>
              <TouchableOpacity
                onPress={() => setTranslationPickerVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Close translation picker"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={22} color={m.textSec} />
              </TouchableOpacity>
            </View>

            <Text style={[s.sectionLabel, { color: m.textMuted }]}>OFFLINE</Text>
            {OFFLINE_BIBLES.map(bible => {
              const isSel = bible.id === selectedBible.id;
              return (
                <TouchableOpacity
                  key={bible.id}
                  onPress={() => selectTranslation(bible)}
                  style={[s.pickerRow, { borderBottomColor: m.divider }, isSel && { backgroundColor: m.pickerSelected }]}
                  accessibilityLabel={`${bible.name} (${bible.abbreviation})${isSel ? ', currently selected' : ''}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSel }}
                >
                  <View>
                    <Text style={[s.pickerRowText, { color: isSel ? m.gold : m.text }, isSel && { fontWeight: '600' }]}>
                      {bible.name}
                    </Text>
                    <Text style={[s.pickerRowMeta, { color: m.textMuted }]}>{bible.language}</Text>
                  </View>
                  <Text style={[s.pickerRowMeta, { color: isSel ? m.gold : m.textMuted }]}>
                    {bible.abbreviation}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {API_BIBLE_KEY && (
              <>
                <Text style={[s.sectionLabel, { color: m.textMuted }]}>ONLINE · API.BIBLE</Text>
                {onlineBiblesLoading && (
                  <View style={[s.center, { flex: 0, paddingVertical: 28 }]}>
                    <ActivityIndicator color={m.gold} />
                  </View>
                )}
                {!onlineBiblesLoading && onlineBibles.map(item => {
                  const isSel = item.id === selectedBible.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => selectTranslation(item)}
                      style={[s.pickerRow, { borderBottomColor: m.divider }, isSel && { backgroundColor: m.pickerSelected }]}
                      accessibilityLabel={`${item.name} (${item.abbreviation})${isSel ? ', currently selected' : ''}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSel }}
                    >
                      <Text style={[s.pickerRowText, { color: isSel ? m.gold : m.text }, isSel && { fontWeight: '600' }]}>
                        {item.name}
                      </Text>
                      <Text style={[s.pickerRowMeta, { color: isSel ? m.gold : m.textMuted }]}>
                        {item.abbreviation}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  statusLabel: { fontSize: 13, fontStyle: 'italic' },
  errorText:   { fontSize: 15, textAlign: 'center', paddingHorizontal: 40, lineHeight: 24 },
  retryBtn:    { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24, borderWidth: 1 },
  retryBtnText:{ fontSize: 14, fontWeight: '600' },

  // ── FlatList ──────────────────────────────────────────────────────────────
  verseList: { paddingHorizontal: 26 },

  // ── Chapter header ────────────────────────────────────────────────────────
  chapterHeader: {
    alignItems: 'center',
    paddingTop: 40, paddingBottom: 56, gap: 0,
    position: 'relative',
  },
  chapterGlow: {
    position: 'absolute',
    width: 180, height: 180, borderRadius: 90,
    top: 32, alignSelf: 'center',
    opacity: 0.18,
  },
  chapterHeaderBook: {
    fontSize: 10, fontWeight: '700',
    letterSpacing: 4.5, marginBottom: 18, opacity: 0.6,
  },
  chapterHeaderNum: {
    fontSize: 108, fontWeight: '300',
    lineHeight: 112, letterSpacing: -6, opacity: 0.82,
  },
  chapterOrnament: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 24, marginBottom: 12, width: 120,
  },
  chapterOrnamentLine: { flex: 1, height: 1, borderRadius: 1, opacity: 0.7 },
  chapterOrnamentDot:  { fontSize: 8, opacity: 0.6 },
  chapterHeaderLabel: {
    fontSize: 12, fontStyle: 'italic', letterSpacing: 0.5, opacity: 0.75,
  },
  chapterHeaderCount: {
    fontSize: 10, marginTop: 8, letterSpacing: 0.3, opacity: 0.5,
  },

  // ── Verse blocks ──────────────────────────────────────────────────────────
  verseBlock: {
    marginBottom: 2, paddingVertical: 12,
    paddingHorizontal: 8, borderRadius: 10,
  },
  verseContent: {
    fontFamily: SERIF, letterSpacing: 0.15, fontWeight: '400',
  },
  verseNum: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.5, opacity: 0.65,
  },

  // ── Vignette ──────────────────────────────────────────────────────────────
  vignette:    { position: 'absolute', left: 0, right: 0, zIndex: 5 },
  vignetteTop: { top: 0 },

  // ── Floating top bar ──────────────────────────────────────────────────────
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topBarBlur: { borderBottomWidth: StyleSheet.hairlineWidth },
  topBarContent: { height: TOP_H },
  topBarRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
  },
  topBarIconBtn: { width: 36, alignItems: 'center', justifyContent: 'center' },
  topBarCenter: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  topBarTitle: { fontSize: 16, fontWeight: '400', fontStyle: 'italic', letterSpacing: 0.2 },
  topBarChevron: { marginLeft: 5, marginTop: 1 },
  topBarRight: {
    width: 76, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'flex-end', gap: 14,
  },
  topBarBadge: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  // ── Floating control bar ──────────────────────────────────────────────────
  ctrlBar: { position: 'absolute', left: 14, right: 14, zIndex: 10 },
  ctrlBarInner: {
    height: CTRL_H,
    flexDirection: 'row', alignItems: 'center',
    borderRadius: CTRL_H / 2,
    overflow: 'hidden',
    borderWidth: 1,
    paddingHorizontal: 4,
  },

  // Reading mode button (left pill)
  ctrlModeBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, paddingHorizontal: 12, paddingVertical: 10,
  },
  ctrlModeText: { fontSize: 12, fontWeight: '700' },

  ctrlSep: { width: 1, height: 22, marginHorizontal: 2 },

  ctrlAskBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, paddingHorizontal: 10, paddingVertical: 10,
  },
  ctrlAskText: { fontSize: 13, fontWeight: '600' },

  ctrlFontBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 11, paddingVertical: 8,
    minWidth: 40,
  },
  ctrlFontAa: { fontWeight: '600', lineHeight: 20 },

  ctrlNavBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  ctrlPlayBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 10, paddingVertical: 8,
  },

  // Reading progress bar (sits below control bar pill)
  progressTrack: {
    height: 2, borderRadius: 1, marginTop: 5,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 1 },

  // ── Verse action sheet ────────────────────────────────────────────────────
  sheetOverlay: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: 24, paddingTop: 14,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 20,
  },
  sheetQuote: {
    fontSize: 15, lineHeight: 26, fontStyle: 'italic', marginBottom: 8,
  },
  sheetRef: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  sheetDivider: { height: StyleSheet.hairlineWidth, marginVertical: 16 },
  sheetRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, gap: 14,
  },
  sheetRowIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetRowLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  sheetCancel: {
    alignItems: 'center', paddingVertical: 16,
    marginTop: 8, borderTopWidth: StyleSheet.hairlineWidth,
  },
  sheetCancelText: { fontSize: 15, fontWeight: '600' },

  // ── Modals ────────────────────────────────────────────────────────────────
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle:   { fontSize: 17, fontWeight: '700' },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.8,
    paddingHorizontal: 20, paddingTop: 22, paddingBottom: 8,
  },

  // OT/NT testament tabs
  testamentTabs: {
    flexDirection: 'row', paddingHorizontal: 16,
    paddingVertical: 12, gap: 8,
  },
  testamentTab: {
    flex: 1, borderRadius: 12,
    paddingVertical: 8, alignItems: 'center',
  },
  testamentTabText: { fontSize: 13, fontWeight: '600' },

  pickerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  pickerRowLeft:      { gap: 2 },
  pickerRowText:      { fontSize: 15 },
  pickerRowTestament: { fontSize: 11, fontWeight: '600', letterSpacing: 0.6 },
  pickerRowMeta:      { fontSize: 12 },
  pickerRowRight: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },

  modalCloseBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  modalBackBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },

  // Chapter grid — 6 columns, ≥44pt cells
  chapterGrid: { padding: 12 },
  chapterCell: {
    flex: 1, margin: 5,
    aspectRatio: 1, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    minHeight: 44,
  },
  chapterCellText: { fontSize: 15 },

  // ── Search ────────────────────────────────────────────────────────────────
  searchGlassBar:   { flex: 1, borderRadius: 12, overflow: 'hidden' },
  searchGlassInner: {
    flexDirection: 'row', alignItems: 'center',
    gap: 7, paddingHorizontal: 10, paddingVertical: 9,
    borderRadius: 12, borderWidth: StyleSheet.hairlineWidth,
  },
  searchGlassInput: {
    flex: 1, fontSize: 15, padding: 0,
    textAlignVertical: 'center', includeFontPadding: false,
  },
  searchCancelBtn: {
    paddingLeft: 10, paddingRight: 2,
    alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center',
  },
  searchCancelText: { fontSize: 15, fontWeight: '500' },

  // ── Search results panel ──────────────────────────────────────────────────
  resultsPanel: {
    position: 'absolute', left: 0, right: 0, zIndex: 9, maxHeight: 340,
  },
  resultsPanelBlur: {
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
    overflow: 'hidden', borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultsEmpty: { alignItems: 'center', gap: 10, paddingVertical: 30 },
  resultsEmptyText: { fontSize: 14 },
  resultRow: { paddingHorizontal: 16, paddingVertical: 12, minHeight: 56 },
  resultVerseNum: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  resultText: { fontSize: 14, lineHeight: 20 },

  // ── Note marker ───────────────────────────────────────────────────────────
  noteMarker: {
    position: 'absolute', left: 0, top: 8, bottom: 8,
    width: 2, borderRadius: 1,
  },

  // ── Note sheet ────────────────────────────────────────────────────────────
  noteSheetKAV: { flex: 1, justifyContent: 'flex-end' },
  noteSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: 24, paddingTop: 14,
  },
  noteSheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 20,
  },
  noteSheetRef: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2,
    textTransform: 'uppercase', marginBottom: 10,
  },
  noteSheetQuote: {
    fontSize: 15, lineHeight: 25, fontStyle: 'italic', marginBottom: 16,
  },
  noteSheetRule: { height: StyleSheet.hairlineWidth, marginBottom: 14 },
  noteSheetLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 2.5, marginBottom: 10,
  },
  noteSheetInput: {
    fontSize: 16, lineHeight: 28,
    minHeight: 72, maxHeight: 140,
    marginBottom: 18,
  },
  noteSheetSave: {
    borderRadius: 14, paddingVertical: 15,
    alignItems: 'center',
  },
  noteSheetSaveText: {
    fontSize: 15, fontWeight: '700', color: '#1A1005', letterSpacing: 0.2,
  },
});
