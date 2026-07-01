import React, { useState, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NotesStackParamList } from '../../types/navigation';
import { Note, getNotes, searchNotes, toggleFavorite } from '../../services/notesService';
import { useTheme } from '../../theme';
import PremiumSearchBar from '../../components/PremiumSearchBar';
import ProfileAvatar from '../../components/ProfileAvatar';
import { BOOKS } from '../../constants/books';

const HERO_H = 136;

function parseBibleRefForNav(ref: string): { bookIndex: number; chapter: number; verse: number } | null {
  const match = ref.match(/^(.+)\s+(\d+):(\d+)$/);
  if (!match) return null;
  const bIdx = BOOKS.findIndex(b => b.name.toLowerCase() === match[1].trim().toLowerCase());
  if (bIdx === -1) return null;
  return { bookIndex: bIdx, chapter: parseInt(match[2], 10), verse: parseInt(match[3], 10) };
}

type NavProp = NativeStackNavigationProp<NotesStackParamList>;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

const HeroSection = memo(function HeroSection({
  count, onAdd, t,
}: { count: number; onAdd: () => void; t: any }) {
  const isDark = t.statusBar === 'light-content';
  return (
    <LinearGradient
      colors={isDark
        ? ['rgba(19,22,38,1)', 'rgba(13,15,26,0.92)']
        : ['rgba(237,231,217,1)', 'rgba(237,231,217,0.82)']}
      style={hs.container}
    >
      <View style={hs.navRow}>
        <ProfileAvatar size={42} />
        <TouchableOpacity
          onPress={onAdd}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
          style={[hs.addBtn, { backgroundColor: t.chipBg, borderColor: t.chipBorder }]}
        >
          <Ionicons name="add" size={22} color={t.text} />
        </TouchableOpacity>
      </View>
      <View style={hs.identRow}>
        <Ionicons name="journal-outline" size={14} color={t.accent} />
        <Text style={[hs.identLabel, { color: t.accent }]}>YOUR NOTES</Text>
      </View>
    </LinearGradient>
  );
});

const hs = StyleSheet.create({
  container:  { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 28 },
  navRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  addBtn:     { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  identRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  identLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2 },
});

const NoteCard = memo(function NoteCard({
  note, onPress, onFavorite, onOpenBible,
  text, textSub, textMuted, gold, divider,
}: {
  note: Note; onPress: () => void; onFavorite: () => void; onOpenBible?: () => void;
  text: string; textSub: string; textMuted: string; gold: string; divider: string;
  // keep cardBg, cardBorder, goldBg, goldBorder in props signature for compatibility but unused visually
  cardBg: string; cardBorder: string; goldBg: string; goldBorder: string;
}) {
  return (
    <TouchableOpacity
      style={[nc.card, { borderBottomColor: divider }]}
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
            <Ionicons name="book-outline" size={11} color={gold} style={{ marginRight: 5 }} />
            <Text style={[nc.refText, { color: gold }]}>{note.bibleReference}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={[nc.date, { color: textMuted }]}>{formatDate(note.updatedAt)}</Text>
        )}
        <TouchableOpacity onPress={onFavorite} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={note.favorite ? 'star' : 'star-outline'}
            size={14}
            color={note.favorite ? gold : textMuted}
          />
        </TouchableOpacity>
      </View>

      <Text style={[nc.title, { color: text }]} numberOfLines={1}>{note.title}</Text>
      <Text style={[nc.preview, { color: textSub }]} numberOfLines={2}>{note.content}</Text>

      {note.bibleReference && (
        <Text style={[nc.date, { color: textMuted, marginTop: 6 }]}>{formatDate(note.updatedAt)}</Text>
      )}
    </TouchableOpacity>
  );
});

const nc = StyleSheet.create({
  card: {
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  refRow:  { flexDirection: 'row', alignItems: 'center' },
  refText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  title:   { fontSize: 17, fontWeight: '700', letterSpacing: -0.2, marginBottom: 6, lineHeight: 23 },
  preview: { fontSize: 13, lineHeight: 21, fontStyle: 'italic' },
  date:    { fontSize: 11 },
});

function EmptyState({ t, onAdd, isFiltered }: { t: any; onAdd: () => void; isFiltered: boolean }) {
  return (
    <View style={es.container}>
      <View style={[es.iconWrap, { backgroundColor: t.filterInactiveBg }]}>
        <Ionicons name="journal-outline" size={36} color={t.textMuted} />
      </View>
      <Text style={[es.title, { color: t.text }]}>
        {isFiltered ? 'No favorites yet' : 'No notes yet'}
      </Text>
      <Text style={[es.body, { color: t.textSub }]}>
        {isFiltered
          ? 'Star a note to save it here for quick access.'
          : 'Capture reflections, Scripture insights,\nand moments God speaks to you.'}
      </Text>
      {!isFiltered && (
        <TouchableOpacity
          style={[es.btn, { backgroundColor: t.gold }]}
          onPress={onAdd}
          activeOpacity={0.8}
        >
          <Text style={[es.btnText, { color: t.bg }]}>Write your first note</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const es = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 40, paddingBottom: 40, gap: 14 },
  iconWrap:  { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title:     { fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },
  body:      { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  btn:       { borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14, marginTop: 4 },
  btnText:   { fontSize: 15, fontWeight: '700' },
});

export default function NotesScreen() {
  const navigation = useNavigation<NavProp>();
  const rootNav    = useNavigation<any>();
  const t = useTheme();
  const [notes, setNotes]   = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery]   = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [error, setError]   = useState<string | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerAnim = useRef(new Animated.Value(1)).current;

  const onSearchActiveChange = useCallback((active: boolean) => {
    Animated.timing(headerAnim, {
      toValue: active ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
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
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        {/* Header — collapses when search is active */}
        <Animated.View
          style={{
            height: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, HERO_H] }),
            opacity: headerAnim,
            overflow: 'hidden',
          }}
        >
          <HeroSection
            count={notes.length}
            onAdd={() => navigation.navigate('NoteEditor', undefined)}
            t={t}
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
          {(['all', 'favorites'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[
                s.filterTab,
                { borderColor: t.chipBorder, backgroundColor: t.chipBg },
                filter === f && { borderColor: t.goldBorder, backgroundColor: t.goldBg },
              ]}
              onPress={() => setFilter(f)}
              activeOpacity={0.75}
            >
              {f === 'favorites' && (
                <Ionicons
                  name="star"
                  size={11}
                  color={filter === f ? t.gold : t.textMuted}
                  style={{ marginRight: 4 }}
                />
              )}
              <Text style={[s.filterTabText, { color: filter === f ? t.gold : t.textMuted }]}>
                {f === 'all' ? 'All Notes' : 'Favorites'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={t.gold} size="large" />
          </View>
        ) : error ? (
          <View style={s.center}>
            <View style={[s.errorIcon, { backgroundColor: t.filterInactiveBg }]}>
              <Ionicons name="cloud-offline-outline" size={28} color={t.textMuted} />
            </View>
            <Text style={[s.errorText, { color: t.textSub }]}>{error}</Text>
            <TouchableOpacity
              style={[s.retryBtn, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}
              onPress={load}
            >
              <Text style={[s.retryText, { color: t.gold }]}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : displayed.length === 0 ? (
          <EmptyState
            t={t}
            onAdd={() => navigation.navigate('NoteEditor', undefined)}
            isFiltered={filter === 'favorites'}
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
                cardBg={t.card}
                cardBorder={t.cardBorder}
                text={t.text}
                textSub={t.textSub}
                textMuted={t.textMuted}
                gold={t.gold}
                goldBg={t.goldBg}
                goldBorder={t.goldBorder}
                divider={t.divider}
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
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },

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
