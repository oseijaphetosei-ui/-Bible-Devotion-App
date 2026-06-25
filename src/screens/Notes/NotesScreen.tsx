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

const HEADER_H = 72;
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NotesStackParamList } from '../../types/navigation';
import { Note, getNotes, searchNotes, toggleFavorite } from '../../services/notesService';
import { useTheme } from '../../theme';
import PremiumSearchBar from '../../components/PremiumSearchBar';
import ProfileAvatar from '../../components/ProfileAvatar';
import { BOOKS } from '../../constants/books';

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

const NoteCard = memo(function NoteCard({
  note, onPress, onFavorite, onOpenBible,
  cardBg, cardBorder, text, textSub, textMuted, gold, goldBg, goldBorder, divider,
}: {
  note: Note; onPress: () => void; onFavorite: () => void; onOpenBible?: () => void;
  cardBg: string; cardBorder: string; text: string; textSub: string;
  textMuted: string; gold: string; goldBg: string; goldBorder: string; divider: string;
}) {
  return (
    <TouchableOpacity
      style={[s.card, { borderBottomColor: divider }]}
      onPress={onPress}
      activeOpacity={0.78}
    >
      <View style={s.cardTop}>
        {note.bibleReference ? (
          <TouchableOpacity
            style={s.refRow}
            onPress={onOpenBible}
            hitSlop={{ top: 6, bottom: 6, left: 0, right: 10 }}
            activeOpacity={0.7}
          >
            <Text style={[s.refText, { color: gold }]}>{note.bibleReference}</Text>
            <Ionicons name="book-outline" size={11} color={gold} style={{ marginLeft: 5, opacity: 0.7 }} />
          </TouchableOpacity>
        ) : (
          <Text style={[s.cardDate, { color: textMuted }]}>{formatDate(note.updatedAt)}</Text>
        )}
        <TouchableOpacity onPress={onFavorite} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={note.favorite ? 'star' : 'star-outline'}
            size={14}
            color={note.favorite ? gold : textMuted}
          />
        </TouchableOpacity>
      </View>

      <Text style={[s.cardTitle, { color: text }]} numberOfLines={1}>{note.title}</Text>
      <Text style={[s.cardPreview, { color: textSub }]} numberOfLines={2}>{note.content}</Text>

      {note.bibleReference && (
        <Text style={[s.cardDate, { color: textMuted, marginTop: 8 }]}>{formatDate(note.updatedAt)}</Text>
      )}
    </TouchableOpacity>
  );
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
            height: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, HEADER_H] }),
            opacity: headerAnim,
            overflow: 'hidden',
          }}
        >
          <View style={s.header}>
            <ProfileAvatar />
            <Text style={[s.headerTitle, { color: t.text }]}>MY NOTES</Text>
            <TouchableOpacity
              style={[s.addBtn, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}
              onPress={() => navigation.navigate('NoteEditor', undefined)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={22} color={t.gold} />
            </TouchableOpacity>
          </View>
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
              <Text style={[s.filterTabText, { color: t.textMuted }, filter === f && { color: t.gold }]}>
                {f === 'all' ? 'All Notes' : '★ Favorites'}
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
            <Text style={[s.errorText, { color: t.textSub }]}>{error}</Text>
            <TouchableOpacity
              style={[s.retryBtn, { backgroundColor: t.retryBg, borderColor: t.goldBorder }]}
              onPress={load}
            >
              <Text style={[s.retryText, { color: t.gold }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : displayed.length === 0 ? (
          <View style={s.center}>
            <Text style={s.emptyIcon}>📝</Text>
            <Text style={[s.emptyTitle, { color: t.text }]}>
              {filter === 'favorites' ? 'No favourites yet' : 'No notes yet'}
            </Text>
            <Text style={[s.emptySub, { color: t.textSub }]}>
              {filter === 'favorites'
                ? 'Star a note to save it here'
                : 'Tap + to write your first reflection'}
            </Text>
          </View>
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3, flex: 1 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },

  filterRow: { flexDirection: 'row', paddingHorizontal: 18, gap: 8, marginBottom: 16 },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  filterTabText: { fontSize: 12, fontWeight: '600' },

  list: { paddingHorizontal: 20, paddingBottom: 120 },

  card: {
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  refRow: { flexDirection: 'row', alignItems: 'center' },
  refText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },

  cardTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2, marginBottom: 5, lineHeight: 22 },
  cardPreview: { fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  cardDate: { fontSize: 11 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 80 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
  errorText: { fontSize: 14, textAlign: 'center' },
  retryBtn: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1,
  },
  retryText: { fontWeight: '600' },
});
