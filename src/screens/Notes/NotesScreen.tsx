import React, { useState, useCallback, useRef, memo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Animated, Platform, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NotesStackParamList } from '../../types/navigation';
import { Note, getNotes, searchNotes, toggleFavorite } from '../../services/notesService';
import { useTheme } from '../../theme';
import PremiumSearchBar from '../../components/PremiumSearchBar';
import ProfileAvatar from '../../components/ProfileAvatar';
import { BOOKS } from '../../constants/books';

type NavProp = NativeStackNavigationProp<NotesStackParamList>;

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = Math.round(SCREEN_W * 0.60);
const GOLD   = '#C9A96B';
const SERIF  = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function parseBibleRefForNav(ref: string): { bookIndex: number; chapter: number; verse: number } | null {
  const match = ref.match(/^(.+)\s+(\d+):(\d+)$/);
  if (!match) return null;
  const bIdx = BOOKS.findIndex(b => b.name.toLowerCase() === match[1].trim().toLowerCase());
  if (bIdx === -1) return null;
  return { bookIndex: bIdx, chapter: parseInt(match[2], 10), verse: parseInt(match[3], 10) };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

const HeroSection = memo(function HeroSection({
  count, onAdd, insets,
}: {
  count: number;
  onAdd: () => void;
  insets: ReturnType<typeof useSafeAreaInsets>;
}) {
  return (
    <View style={{ height: HERO_H, overflow: 'hidden' }}>
      <ExpoImage
        source={require('../../assets/open-bible-in-the-morning.jpg')}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        cachePolicy="memory-disk"
      />

      {/* Top scrim */}
      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)']}
        locations={[0, 0.3]}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Bottom scrim */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.14)', 'rgba(0,0,0,0.78)']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Nav row */}
      <View style={[hs.navRow, { paddingTop: insets.top + 6 }]}>
        <ProfileAvatar size={42} />
        <TouchableOpacity
          onPress={onAdd}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
          style={hs.addBtn}
        >
          <Ionicons name="add" size={22} color="rgba(255,255,255,0.90)" />
        </TouchableOpacity>
      </View>

      {/* Hero content */}
      <View style={hs.bottomContent}>
        <View style={hs.eyebrowRow}>
          <Ionicons name="journal-outline" size={11} color={GOLD} />
          <Text style={hs.eyebrow}>YOUR NOTES</Text>
        </View>
        <Text style={hs.title}>Reflections &{'\n'}Scripture Insights</Text>
        {count > 0 && (
          <Text style={hs.countText}>{count} note{count !== 1 ? 's' : ''} saved</Text>
        )}
      </View>
    </View>
  );
});

const hs = StyleSheet.create({
  navRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 22, paddingBottom: 8,
  },
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.32)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center', justifyContent: 'center',
  },
  bottomContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 22, paddingBottom: 22,
  },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: GOLD },
  title: {
    fontFamily: SERIF,
    fontSize: 26, fontWeight: '400', lineHeight: 34, letterSpacing: -0.3,
    color: 'rgba(255,255,255,0.96)', marginBottom: 8,
  },
  countText: { fontSize: 12, color: 'rgba(255,255,255,0.42)', letterSpacing: 0.4 },
});

// ─── Note Card ────────────────────────────────────────────────────────────────

const NoteCard = memo(function NoteCard({
  note, onPress, onFavorite, onOpenBible, isDark,
}: {
  note: Note;
  onPress: () => void;
  onFavorite: () => void;
  onOpenBible?: () => void;
  isDark: boolean;
}) {
  const textColor  = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const subColor   = isDark ? 'rgba(255,255,255,0.58)' : 'rgba(24,18,8,0.58)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.32)' : 'rgba(24,18,8,0.32)';
  const divColor   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  return (
    <TouchableOpacity
      style={[nc.card, { borderBottomColor: divColor }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={nc.topRow}>
        {note.bibleReference ? (
          <TouchableOpacity
            onPress={onOpenBible}
            hitSlop={{ top: 6, bottom: 6, left: 0, right: 10 }}
            activeOpacity={0.7}
            style={nc.refRow}
          >
            <Ionicons name="book-outline" size={11} color={GOLD} style={{ marginRight: 5 }} />
            <Text style={nc.refText}>{note.bibleReference}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={[nc.date, { color: mutedColor }]}>{formatDate(note.updatedAt)}</Text>
        )}
        <TouchableOpacity onPress={onFavorite} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={note.favorite ? 'star' : 'star-outline'}
            size={14}
            color={note.favorite ? GOLD : mutedColor}
          />
        </TouchableOpacity>
      </View>

      <Text style={[nc.title, { color: textColor }]} numberOfLines={1}>{note.title}</Text>
      <Text style={[nc.preview, { color: subColor, fontFamily: SERIF }]} numberOfLines={2}>
        {note.content}
      </Text>

      {note.bibleReference && (
        <Text style={[nc.date, { color: mutedColor, marginTop: 6 }]}>{formatDate(note.updatedAt)}</Text>
      )}
    </TouchableOpacity>
  );
});

const nc = StyleSheet.create({
  card: { paddingVertical: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  topRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  refRow:  { flexDirection: 'row', alignItems: 'center' },
  refText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: GOLD, textTransform: 'uppercase' },
  title:   { fontSize: 17, fontWeight: '700', letterSpacing: -0.2, marginBottom: 6, lineHeight: 23 },
  preview: { fontSize: 13, lineHeight: 21, fontStyle: 'italic' },
  date:    { fontSize: 11 },
});

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd, isFiltered, isDark }: { onAdd: () => void; isFiltered: boolean; isDark: boolean }) {
  const textColor  = isDark ? 'rgba(255,255,255,0.90)' : 'rgba(24,18,8,0.90)';
  const subColor   = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(24,18,8,0.55)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';

  return (
    <View style={es.container}>
      <View style={[es.iconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
        <Ionicons name="journal-outline" size={36} color={mutedColor} />
      </View>
      <Text style={[es.title, { color: textColor, fontFamily: SERIF }]}>
        {isFiltered ? 'No favorites yet' : 'No notes yet'}
      </Text>
      <Text style={[es.body, { color: subColor }]}>
        {isFiltered
          ? 'Star a note to save it here for quick access.'
          : 'Capture reflections, Scripture insights,\nand moments God speaks to you.'}
      </Text>
      {!isFiltered && (
        <TouchableOpacity style={es.btn} onPress={onAdd} activeOpacity={0.85}>
          <LinearGradient
            colors={[GOLD, '#B8904A']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={es.btnGradient}
          >
            <Text style={es.btnText}>Write your first note</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const es = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 40, paddingBottom: 40, gap: 14 },
  iconWrap:  { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title:     { fontSize: 20, fontWeight: '400', letterSpacing: -0.2, textAlign: 'center' },
  body:      { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  btn:       { borderRadius: 30, overflow: 'hidden', marginTop: 4 },
  btnGradient: { paddingHorizontal: 28, paddingVertical: 14 },
  btnText:   { fontSize: 15, fontWeight: '700', color: '#08071A' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NotesScreen() {
  const navigation = useNavigation<NavProp>();
  const rootNav    = useNavigation<any>();
  const t          = useTheme();
  const insets     = useSafeAreaInsets();

  const isDark     = t.statusBar === 'light-content';
  const rootBg     = isDark ? '#060810' : '#DDD5C4';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';

  const [notes,   setNotes]   = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState('');
  const [filter,  setFilter]  = useState<'all' | 'favorites'>('all');
  const [error,   setError]   = useState<string | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerAnim     = useRef(new Animated.Value(1)).current;

  const onSearchActiveChange = useCallback((active: boolean) => {
    Animated.timing(headerAnim, { toValue: active ? 0 : 1, duration: 250, useNativeDriver: false }).start();
  }, [headerAnim]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNotes();
      setNotes(data);
    } catch {
      setError('Could not load notes. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!text.trim()) { load(); return; }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchNotes(text);
        setNotes(results);
      } catch { /* keep current */ }
    }, 300);
  }, [load]);

  const handleFavorite = useCallback(async (note: Note) => {
    await toggleFavorite(note);
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, favorite: !n.favorite } : n));
  }, []);

  const displayed = filter === 'favorites' ? notes.filter(n => n.favorite) : notes;

  return (
    <View style={{ flex: 1, backgroundColor: rootBg }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Hero — collapses when search is active */}
      <Animated.View
        style={{
          height: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [insets.top, HERO_H] }),
          opacity: headerAnim,
          overflow: 'hidden',
        }}
      >
        <HeroSection
          count={notes.length}
          onAdd={() => navigation.navigate('NoteEditor', undefined)}
          insets={insets}
        />
      </Animated.View>

      {/* Search bar */}
      <PremiumSearchBar
        value={query}
        onChangeText={handleSearch}
        placeholder="Search notes, verses, keywords…"
        onActiveChange={onSearchActiveChange}
        style={{ marginBottom: 4 }}
      />

      {/* Filter tabs */}
      <View style={s.filterRow}>
        {(['all', 'favorites'] as const).map(f => {
          const active = filter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[
                s.filterTab,
                active
                  ? { backgroundColor: 'rgba(201,169,107,0.14)', borderColor: 'rgba(201,169,107,0.38)' }
                  : { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                      borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.09)' },
              ]}
              onPress={() => setFilter(f)}
              activeOpacity={0.75}
            >
              {f === 'favorites' && (
                <Ionicons
                  name="star"
                  size={11}
                  color={active ? GOLD : mutedColor}
                  style={{ marginRight: 4 }}
                />
              )}
              <Text style={[s.filterTabText, { color: active ? GOLD : mutedColor }]}>
                {f === 'all' ? 'All Notes' : 'Favorites'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={GOLD} size="large" />
        </View>
      ) : error ? (
        <View style={s.center}>
          <View style={[s.errorIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
            <Ionicons name="cloud-offline-outline" size={28} color={mutedColor} />
          </View>
          <Text style={[s.errorText, { color: mutedColor }]}>{error}</Text>
          <TouchableOpacity
            style={[s.retryBtn, { backgroundColor: 'rgba(201,169,107,0.10)', borderColor: 'rgba(201,169,107,0.30)' }]}
            onPress={load}
          >
            <Text style={[s.retryText, { color: GOLD }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : displayed.length === 0 ? (
        <EmptyState
          onAdd={() => navigation.navigate('NoteEditor', undefined)}
          isFiltered={filter === 'favorites'}
          isDark={isDark}
        />
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={n => n.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          windowSize={11}
          maxToRenderPerBatch={10}
          removeClippedSubviews
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              isDark={isDark}
              onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })}
              onFavorite={() => handleFavorite(item)}
              onOpenBible={item.bibleReference ? () => {
                const parsed = parseBibleRefForNav(item.bibleReference!);
                if (!parsed) return;
                rootNav.navigate('MainTabs', {
                  screen: 'BibleTab',
                  params: {
                    screen: 'Bible',
                    params: { bookIndex: parsed.bookIndex, chapter: parsed.chapter, verseToScroll: parsed.verse },
                  },
                });
              } : undefined}
            />
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  filterRow: { flexDirection: 'row', paddingHorizontal: 18, gap: 8, marginBottom: 14 },
  filterTab: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  filterTabText: { fontSize: 13, fontWeight: '600' },

  list:   { paddingHorizontal: 20, paddingBottom: 120 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 80 },

  errorIcon:  { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  errorText:  { fontSize: 14, textAlign: 'center' },
  retryBtn:   { marginTop: 4, paddingHorizontal: 24, paddingVertical: 11, borderRadius: 12, borderWidth: 1 },
  retryText:  { fontWeight: '600', fontSize: 14 },
});
