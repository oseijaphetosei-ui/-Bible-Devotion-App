import React, { useState, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NotesStackParamList } from '../../types/navigation';
import { Note, getNotes, searchNotes, toggleFavorite } from '../../services/notesService';
import { useTheme } from '../../theme';
import GlassSearchBar from '../../components/GlassSearchBar';

type NavProp = NativeStackNavigationProp<NotesStackParamList>;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

const NoteCard = memo(function NoteCard({
  note, onPress, onFavorite,
  cardBg, cardBorder, text, textSub, textMuted, gold, goldBg, goldBorder,
}: {
  note: Note; onPress: () => void; onFavorite: () => void;
  cardBg: string; cardBorder: string; text: string; textSub: string;
  textMuted: string; gold: string; goldBg: string; goldBorder: string;
}) {
  return (
    <TouchableOpacity
      style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {note.bibleReference ? (
        <View style={s.refRow}>
          <Text style={s.refIcon}>📖</Text>
          <Text style={[s.refText, { color: gold }]}>{note.bibleReference}</Text>
          <View style={[s.verseTag, { backgroundColor: goldBg, borderColor: goldBorder }]}>
            <Text style={[s.verseTagText, { color: gold }]}>VERSE</Text>
          </View>
        </View>
      ) : null}

      <Text style={[s.cardTitle, { color: text }]} numberOfLines={1}>{note.title}</Text>
      <Text style={[s.cardPreview, { color: textSub }]} numberOfLines={2}>{note.content}</Text>

      <View style={s.cardFooter}>
        <Text style={[s.cardDate, { color: textMuted }]}>{formatDate(note.updatedAt)}</Text>
        <TouchableOpacity onPress={onFavorite} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={note.favorite ? 'star' : 'star-outline'}
            size={16}
            color={note.favorite ? gold : textMuted}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

export default function NotesScreen() {
  const navigation = useNavigation<NavProp>();
  const t = useTheme();
  const [notes, setNotes]   = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery]   = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [error, setError]   = useState<string | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

        {/* Header */}
        <View style={s.header}>
          <Text style={[s.headerTitle, { color: t.textMuted }]}>MY NOTES</Text>
          <TouchableOpacity
            style={[s.addBtn, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}
            onPress={() => navigation.navigate('NoteEditor', undefined)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={22} color={t.gold} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <GlassSearchBar
          value={query}
          onChangeText={handleSearch}
          placeholder="Search notes, verses, keywords…"
          onCancelled={load}
          style={{ marginHorizontal: 18, marginBottom: 12 }}
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
                onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })}
                onFavorite={() => handleFavorite(item)}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1.6 },
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

  list: { paddingHorizontal: 18, paddingBottom: 120 },

  card: {
    borderRadius: 14, borderWidth: 1,
    padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  refIcon: { fontSize: 13 },
  refText: { fontSize: 13, fontWeight: '700', flex: 1 },
  verseTag: {
    borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  verseTagText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },

  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  cardPreview: { fontSize: 13, lineHeight: 19, marginBottom: 12, fontStyle: 'italic' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
