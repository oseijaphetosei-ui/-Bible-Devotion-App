import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NotesStackParamList } from '../../types/navigation';
import { Note, getNotes, searchNotes, toggleFavorite } from '../../services/notesService';

type NavProp = NativeStackNavigationProp<NotesStackParamList>;

const C = {
  gold: '#D4AF37',
  text: '#F0EFE9',
  textSub: '#8B8FA8',
  textMuted: '#555870',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function NoteCard({
  note,
  onPress,
  onFavorite,
}: {
  note: Note;
  onPress: () => void;
  onFavorite: () => void;
}) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.82}>
      {/* top highlight */}
      <View style={s.cardHighlight} pointerEvents="none" />

      {note.bibleReference ? (
        <View style={s.refRow}>
          <Text style={s.refIcon}>📖</Text>
          <Text style={s.refText}>{note.bibleReference}</Text>
          <View style={s.verseTag}>
            <Text style={s.verseTagText}>VERSE</Text>
          </View>
        </View>
      ) : null}

      <Text style={s.cardTitle} numberOfLines={1}>{note.title}</Text>
      <Text style={s.cardPreview} numberOfLines={2}>{note.content}</Text>

      <View style={s.cardFooter}>
        <Text style={s.cardDate}>{formatDate(note.updatedAt)}</Text>
        <TouchableOpacity onPress={onFavorite} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={note.favorite ? 'star' : 'star-outline'}
            size={16}
            color={note.favorite ? C.gold : C.textMuted}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function NotesScreen() {
  const navigation = useNavigation<NavProp>();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNotes();
      setNotes(data);
    } catch (e: any) {
      setError('Could not load notes. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (!text.trim()) { load(); return; }
    try {
      const results = await searchNotes(text);
      setNotes(results);
    } catch { /* keep current list */ }
  }, [load]);

  const handleFavorite = useCallback(async (note: Note) => {
    await toggleFavorite(note);
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, favorite: !n.favorite } : n));
  }, []);

  const displayed = filter === 'favorites' ? notes.filter(n => n.favorite) : notes;

  return (
    <LinearGradient colors={['#5C3A10', '#080604']} style={{ flex: 1 }}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>MY NOTES</Text>
          <TouchableOpacity
            style={s.addBtn}
            onPress={() => navigation.navigate('NoteEditor', undefined)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={22} color={C.gold} />
          </TouchableOpacity>
        </View>

        {/* Search bar — glass */}
        <BlurView intensity={50} tint="dark" style={s.searchWrap}>
          <View style={s.searchTint} pointerEvents="none" />
          <Ionicons name="search-outline" size={16} color={C.textMuted} style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            placeholder="Search notes, verses, keywords…"
            placeholderTextColor={C.textMuted}
            value={query}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={16} color={C.textMuted} />
            </TouchableOpacity>
          )}
        </BlurView>

        {/* Filter tabs */}
        <View style={s.filterRow}>
          {(['all', 'favorites'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[s.filterTab, filter === f && s.filterTabActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.75}
            >
              <Text style={[s.filterTabText, filter === f && s.filterTabTextActive]}>
                {f === 'all' ? 'All Notes' : '★ Favorites'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={C.gold} size="large" />
          </View>
        ) : error ? (
          <View style={s.center}>
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={load}>
              <Text style={s.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : displayed.length === 0 ? (
          <View style={s.center}>
            <Text style={s.emptyIcon}>📝</Text>
            <Text style={s.emptyTitle}>
              {filter === 'favorites' ? 'No favourites yet' : 'No notes yet'}
            </Text>
            <Text style={s.emptySub}>
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
            renderItem={({ item }) => (
              <NoteCard
                note={item}
                onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })}
                onFavorite={() => handleFavorite(item)}
              />
            )}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
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
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1.6,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Glass search bar
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(72,38,8,0.25)',
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.text,
  },

  // Filter tabs
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  filterTabActive: {
    borderColor: 'rgba(212,175,55,0.5)',
    backgroundColor: 'rgba(212,175,55,0.1)',
  },
  filterTabText: { fontSize: 12, fontWeight: '600', color: C.textMuted },
  filterTabTextActive: { color: C.gold },

  list: { paddingHorizontal: 18, paddingBottom: 120 },

  // Note card — glass
  card: {
    backgroundColor: 'rgba(16,14,28,0.82)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHighlight: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 1,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  refIcon: { fontSize: 13 },
  refText: { fontSize: 13, fontWeight: '700', color: C.gold, flex: 1 },
  verseTag: {
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  verseTagText: { fontSize: 8, fontWeight: '800', color: C.gold, letterSpacing: 0.8 },

  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    marginBottom: 6,
  },
  cardPreview: {
    fontSize: 13,
    color: C.textSub,
    lineHeight: 19,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: { fontSize: 11, color: C.textMuted },

  // States
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 80 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  emptySub: { fontSize: 13, color: C.textSub, textAlign: 'center', paddingHorizontal: 40 },
  errorText: { fontSize: 14, color: C.textSub, textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  retryText: { color: C.gold, fontWeight: '600' },
});
