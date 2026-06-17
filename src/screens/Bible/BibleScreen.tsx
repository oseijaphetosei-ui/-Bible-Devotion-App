import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { API_BIBLE_KEY } from '../../config/bibleConfig'; // used to show online section when key is present
import { LinearGradient } from 'expo-linear-gradient';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const C = {
  bg: '#0D0F1A',
  card: '#151828',
  cardBorder: '#1F2240',
  gold: '#D4AF37',
  goldDim: '#3A2E10',
  text: '#F0EFE9',
  textSub: '#8B8FA8',
  textMuted: '#555870',
  progressBg: '#1F2240',
  offline: '#2A1A3E',
  offlineBadge: '#7B5EA7',
};

export default function BibleScreen() {
  const navigation = useNavigation<NavProp>();

  const [bookIndex, setBookIndex] = useState(42); // default: John
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'online' | 'offline'>('offline');

  const [bookPickerVisible, setBookPickerVisible] = useState(false);
  const [bookSearch, setBookSearch] = useState('');

  const [translationPickerVisible, setTranslationPickerVisible] = useState(false);
  const [onlineBibles, setOnlineBibles] = useState<BibleVersion[]>([]);
  const [onlineBiblesLoading, setOnlineBiblesLoading] = useState(false);
  const [selectedBible, setSelectedBible] = useState<BibleVersion>(OFFLINE_BIBLES[0]); // KJV

  const book = BOOKS[bookIndex];

  const fetchChapter = useCallback(async (bIdx: number, ch: number, bible: BibleVersion) => {
    setLoading(true);
    setError(null);
    setVerses([]);
    try {
      const result: ChapterResult = await loadChapter(bIdx, BOOKS[bIdx].usfm, ch, bible);
      setVerses(result.verses);
      setSource(result.source);
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChapter(bookIndex, chapter, selectedBible);
  }, [bookIndex, chapter, selectedBible]);

  const openTranslationPicker = async () => {
    setTranslationPickerVisible(true);
    if (onlineBibles.length > 0 || !API_BIBLE_KEY) return;
    const online = await checkOnline();
    if (!online) return;
    setOnlineBiblesLoading(true);
    try {
      const list = await loadOnlineBibles();
      setOnlineBibles(list);
    } catch {
      // silent — bundled translations still available
    } finally {
      setOnlineBiblesLoading(false);
    }
  };

  const selectBook = (idx: number) => {
    setBookIndex(idx);
    setChapter(1);
    setBookPickerVisible(false);
    setBookSearch('');
  };

  const selectTranslation = (bible: BibleVersion) => {
    setSelectedBible(bible);
    setTranslationPickerVisible(false);
  };

  const filteredBooks = bookSearch
    ? BOOKS.filter((b) => b.name.toLowerCase().includes(bookSearch.toLowerCase()))
    : BOOKS;

  const badgeLabel =
    source === 'online'
      ? `Online · ${selectedBible.abbreviation}`
      : `${selectedBible.abbreviation} · Offline`;

  return (
    <LinearGradient colors={['#5C3A10', '#080604']} style={{ flex: 1 }}>
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>BIBLE</Text>
        <TouchableOpacity onPress={openTranslationPicker} style={s.translationBtn}>
          <Text style={s.translationBtnText}>{selectedBible.abbreviation}</Text>
          <Text style={s.chevronSmall}>▾</Text>
        </TouchableOpacity>
      </View>

      {/* Source badge */}
      {!loading && verses.length > 0 && (
        <View style={[s.sourceBadge, source === 'offline' && s.sourceBadgeOffline]}>
          <Text style={[s.sourceBadgeText, source === 'offline' && s.sourceBadgeTextOffline]}>
            {badgeLabel}
          </Text>
        </View>
      )}

      {/* Book + Chapter nav */}
      <View style={s.nav}>
        <TouchableOpacity onPress={() => setBookPickerVisible(true)} style={s.bookBtn}>
          <Text style={s.bookBtnText}>{book.name}</Text>
          <Text style={s.chevron}>▾</Text>
        </TouchableOpacity>
        <View style={s.chapterNav}>
          <TouchableOpacity
            onPress={() => setChapter((c) => Math.max(1, c - 1))}
            disabled={chapter === 1}
            style={[s.chapterArrow, chapter === 1 && s.arrowDisabled]}
          >
            <Text style={s.arrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={s.chapterLabel}>Chapter {chapter}</Text>
          <TouchableOpacity
            onPress={() => setChapter((c) => Math.min(book.chapters, c + 1))}
            disabled={chapter === book.chapters}
            style={[s.chapterArrow, chapter === book.chapters && s.arrowDisabled]}
          >
            <Text style={s.arrowText}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content states */}
      {loading && (
        <View style={s.center}>
          <ActivityIndicator color={C.gold} size="large" />
        </View>
      )}
      {!loading && error && (
        <View style={s.center}>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => fetchChapter(bookIndex, chapter, selectedBible)}
            style={s.retryBtn}
          >
            <Text style={s.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      {!loading && !error && (
        <FlatList
          data={verses}
          keyExtractor={(v) => String(v.verse)}
          contentContainerStyle={s.verseList}
          renderItem={({ item }) => (
            <View style={s.verseRow}>
              <Text style={s.verseNum}>{item.verse}</Text>
              <Text style={s.verseText}>{item.text}</Text>
            </View>
          )}
        />
      )}

      {/* Book picker modal */}
      <Modal
        visible={bookPickerVisible}
        animationType="slide"
        onRequestClose={() => { setBookPickerVisible(false); setBookSearch(''); }}
      >
        <SafeAreaView style={s.modalSafe} edges={['top']}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Select Book</Text>
            <TouchableOpacity onPress={() => { setBookPickerVisible(false); setBookSearch(''); }}>
              <Text style={s.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={s.searchInput}
            placeholder="Search books..."
            placeholderTextColor={C.textMuted}
            value={bookSearch}
            onChangeText={setBookSearch}
            autoCorrect={false}
          />
          <FlatList
            data={filteredBooks}
            keyExtractor={(b) => b.usfm}
            renderItem={({ item }) => {
              const idx = BOOKS.indexOf(item);
              const isSelected = idx === bookIndex;
              return (
                <TouchableOpacity
                  onPress={() => selectBook(idx)}
                  style={[s.pickerRow, isSelected && s.pickerRowSelected]}
                >
                  <Text style={[s.pickerRowText, isSelected && s.pickerRowTextSelected]}>
                    {item.name}
                  </Text>
                  <Text style={s.pickerRowMeta}>{item.chapters} ch</Text>
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>

      {/* Translation picker modal */}
      <Modal
        visible={translationPickerVisible}
        animationType="slide"
        onRequestClose={() => setTranslationPickerVisible(false)}
      >
        <SafeAreaView style={s.modalSafe} edges={['top']}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Select Translation</Text>
            <TouchableOpacity onPress={() => setTranslationPickerVisible(false)}>
              <Text style={s.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Bundled translations — always available */}
          <Text style={s.sectionHeading}>BUNDLED · OFFLINE</Text>
          {OFFLINE_BIBLES.map((bible) => {
            const isSelected = bible.id === selectedBible.id;
            return (
              <TouchableOpacity
                key={bible.id}
                onPress={() => selectTranslation(bible)}
                style={[s.pickerRow, isSelected && s.pickerRowSelected]}
              >
                <View>
                  <Text style={[s.pickerRowText, isSelected && s.pickerRowTextSelected]}>
                    {bible.name}
                  </Text>
                  <Text style={s.pickerRowMeta}>{bible.language}</Text>
                </View>
                <Text style={[s.pickerRowMeta, isSelected && { color: C.gold }]}>
                  {bible.abbreviation}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Online translations via API.Bible */}
          {API_BIBLE_KEY && (
            <>
              <Text style={s.sectionHeading}>ONLINE · API.BIBLE</Text>
              {onlineBiblesLoading && (
                <View style={[s.center, { flex: 0, paddingVertical: 24 }]}>
                  <ActivityIndicator color={C.gold} />
                </View>
              )}
              {!onlineBiblesLoading && onlineBibles.length > 0 && (
                <FlatList
                  data={onlineBibles}
                  keyExtractor={(t) => t.id}
                  renderItem={({ item }) => {
                    const isSelected = item.id === selectedBible.id;
                    return (
                      <TouchableOpacity
                        onPress={() => selectTranslation(item)}
                        style={[s.pickerRow, isSelected && s.pickerRowSelected]}
                      >
                        <Text style={[s.pickerRowText, isSelected && s.pickerRowTextSelected]}>
                          {item.name}
                        </Text>
                        <Text style={[s.pickerRowMeta, isSelected && { color: C.gold }]}>
                          {item.abbreviation}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </>
          )}
        </SafeAreaView>
      </Modal>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  backBtn: { width: 44, alignItems: 'flex-start' },
  backIcon: { fontSize: 30, color: C.gold, lineHeight: 34 },
  headerTitle: { fontSize: 12, fontWeight: '700', color: C.textMuted, letterSpacing: 1.5 },
  translationBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  translationBtnText: { fontSize: 13, fontWeight: '700', color: C.gold },
  chevronSmall: { fontSize: 11, color: C.gold },

  sourceBadge: {
    alignSelf: 'flex-end',
    marginRight: 16,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: C.goldDim,
  },
  sourceBadgeOffline: { backgroundColor: C.offline },
  sourceBadgeText: { fontSize: 10, fontWeight: '700', color: C.gold, letterSpacing: 0.8 },
  sourceBadgeTextOffline: { color: C.offlineBadge },

  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  bookBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bookBtnText: { fontSize: 18, fontWeight: '700', color: C.text },
  chevron: { fontSize: 14, color: C.gold, marginTop: 2 },

  chapterNav: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chapterArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: { opacity: 0.3 },
  arrowText: { fontSize: 18, color: C.gold, lineHeight: 22 },
  chapterLabel: { fontSize: 14, color: C.textSub, minWidth: 80, textAlign: 'center' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { color: C.textSub, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.goldDim,
  },
  retryBtnText: { color: C.gold, fontWeight: '600' },

  verseList: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 },
  verseRow: { flexDirection: 'row', marginBottom: 18, alignItems: 'flex-start' },
  verseNum: { fontSize: 11, fontWeight: '700', color: C.gold, width: 28, marginTop: 4 },
  verseText: { flex: 1, fontSize: 16, color: C.text, lineHeight: 26 },

  modalSafe: { flex: 1, backgroundColor: C.bg },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  modalClose: { fontSize: 18, color: C.textSub },

  sectionHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },

  searchInput: {
    margin: 16,
    padding: 12,
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
    color: C.text,
    fontSize: 15,
  },

  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  pickerRowSelected: { backgroundColor: C.goldDim },
  pickerRowText: { fontSize: 15, color: C.text },
  pickerRowTextSelected: { color: C.gold, fontWeight: '600' },
  pickerRowMeta: { fontSize: 12, color: C.textMuted },
});
