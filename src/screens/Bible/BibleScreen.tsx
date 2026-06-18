import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
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
import { API_BIBLE_KEY } from '../../config/bibleConfig';
import { useTheme } from '../../theme';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type ReaderParams = { bookIndex?: number; chapter?: number; verseToScroll?: number };

export default function BibleScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute();
  const params = ((route.params ?? {}) as ReaderParams);
  const t = useTheme();

  const flatListRef = useRef<FlatList>(null);
  const [bookIndex, setBookIndex] = useState(params.bookIndex ?? 42);
  const [chapter, setChapter] = useState(params.chapter ?? 1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'online' | 'offline'>('offline');

  const [bookPickerVisible, setBookPickerVisible] = useState(false);
  const [bookSearch, setBookSearch] = useState('');
  const [translationPickerVisible, setTranslationPickerVisible] = useState(false);
  const [onlineBibles, setOnlineBibles] = useState<BibleVersion[]>([]);
  const [onlineBiblesLoading, setOnlineBiblesLoading] = useState(false);
  const [selectedBible, setSelectedBible] = useState<BibleVersion>(OFFLINE_BIBLES[0]);

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
    if (params.bookIndex !== undefined) setBookIndex(params.bookIndex);
    if (params.chapter !== undefined) setChapter(params.chapter);
  }, [route.params]);

  useEffect(() => {
    if (verses.length === 0 || !params.verseToScroll) return;
    const idx = params.verseToScroll - 1;
    if (idx < 0 || idx >= verses.length) return;
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.15 });
    }, 200);
  }, [verses, params.verseToScroll]);

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
    } catch {}
    finally { setOnlineBiblesLoading(false); }
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
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        {/* Header */}
        <View style={[s.header, { borderBottomColor: t.divider }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={[s.backIcon, { color: t.gold }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: t.textMuted }]}>BIBLE</Text>
          <TouchableOpacity onPress={openTranslationPicker} style={s.translationBtn}>
            <Text style={[s.translationBtnText, { color: t.gold }]}>{selectedBible.abbreviation}</Text>
            <Text style={[s.chevronSmall, { color: t.gold }]}>▾</Text>
          </TouchableOpacity>
        </View>

        {/* Source badge */}
        {!loading && verses.length > 0 && (
          <View style={[s.sourceBadge, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}>
            <Text style={[s.sourceBadgeText, { color: t.gold }]}>{badgeLabel}</Text>
          </View>
        )}

        {/* Book + Chapter nav */}
        <View style={[s.nav, { borderBottomColor: t.divider }]}>
          <TouchableOpacity onPress={() => setBookPickerVisible(true)} style={s.bookBtn}>
            <Text style={[s.bookBtnText, { color: t.text }]}>{book.name}</Text>
            <Text style={[s.chevron, { color: t.gold }]}>▾</Text>
          </TouchableOpacity>
          <View style={s.chapterNav}>
            <TouchableOpacity
              onPress={() => setChapter((c) => Math.max(1, c - 1))}
              disabled={chapter === 1}
              style={[s.chapterArrow, { backgroundColor: t.card, borderColor: t.cardBorder }, chapter === 1 && s.arrowDisabled]}
            >
              <Text style={[s.arrowText, { color: t.gold }]}>‹</Text>
            </TouchableOpacity>
            <Text style={[s.chapterLabel, { color: t.textSub }]}>Chapter {chapter}</Text>
            <TouchableOpacity
              onPress={() => setChapter((c) => Math.min(book.chapters, c + 1))}
              disabled={chapter === book.chapters}
              style={[s.chapterArrow, { backgroundColor: t.card, borderColor: t.cardBorder }, chapter === book.chapters && s.arrowDisabled]}
            >
              <Text style={[s.arrowText, { color: t.gold }]}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {loading && (
          <View style={s.center}>
            <ActivityIndicator color={t.gold} size="large" />
          </View>
        )}
        {!loading && error && (
          <View style={s.center}>
            <Text style={[s.errorText, { color: t.textSub }]}>{error}</Text>
            <TouchableOpacity
              onPress={() => fetchChapter(bookIndex, chapter, selectedBible)}
              style={[s.retryBtn, { backgroundColor: t.retryBg, borderColor: t.goldBorder }]}
            >
              <Text style={[s.retryBtnText, { color: t.gold }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        {!loading && !error && (
          <FlatList
            ref={flatListRef}
            data={verses}
            keyExtractor={(v) => String(v.verse)}
            contentContainerStyle={s.verseList}
            onScrollToIndexFailed={({ index }) => {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.15 });
              }, 300);
            }}
            renderItem={({ item }) => (
              <View style={[s.verseRow, params.verseToScroll === item.verse && { backgroundColor: t.goldBg, borderRadius: 6, paddingHorizontal: 6 }]}>
                <Text style={[s.verseNum, { color: t.gold }]}>{item.verse}</Text>
                <Text style={[s.verseText, { color: t.text }]}>{item.text}</Text>
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
          <SafeAreaView style={[s.modalSafe, { backgroundColor: t.bg }]} edges={['top']}>
            <View style={[s.modalHeader, { borderBottomColor: t.divider }]}>
              <Text style={[s.modalTitle, { color: t.text }]}>Select Book</Text>
              <TouchableOpacity onPress={() => { setBookPickerVisible(false); setBookSearch(''); }}>
                <Text style={[s.modalClose, { color: t.textSub }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[s.searchInput, { backgroundColor: t.card, borderColor: t.cardBorder, color: t.text }]}
              placeholder="Search books..."
              placeholderTextColor={t.textMuted}
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
                    style={[s.pickerRow, { borderBottomColor: t.divider }, isSelected && { backgroundColor: t.goldBg }]}
                  >
                    <Text style={[s.pickerRowText, { color: t.text }, isSelected && { color: t.gold, fontWeight: '600' }]}>
                      {item.name}
                    </Text>
                    <Text style={[s.pickerRowMeta, { color: t.textMuted }]}>{item.chapters} ch</Text>
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
          <SafeAreaView style={[s.modalSafe, { backgroundColor: t.bg }]} edges={['top']}>
            <View style={[s.modalHeader, { borderBottomColor: t.divider }]}>
              <Text style={[s.modalTitle, { color: t.text }]}>Select Translation</Text>
              <TouchableOpacity onPress={() => setTranslationPickerVisible(false)}>
                <Text style={[s.modalClose, { color: t.textSub }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[s.sectionHeading, { color: t.textMuted }]}>BUNDLED · OFFLINE</Text>
            {OFFLINE_BIBLES.map((bible) => {
              const isSelected = bible.id === selectedBible.id;
              return (
                <TouchableOpacity
                  key={bible.id}
                  onPress={() => selectTranslation(bible)}
                  style={[s.pickerRow, { borderBottomColor: t.divider }, isSelected && { backgroundColor: t.goldBg }]}
                >
                  <View>
                    <Text style={[s.pickerRowText, { color: t.text }, isSelected && { color: t.gold, fontWeight: '600' }]}>
                      {bible.name}
                    </Text>
                    <Text style={[s.pickerRowMeta, { color: t.textMuted }]}>{bible.language}</Text>
                  </View>
                  <Text style={[s.pickerRowMeta, { color: t.textMuted }, isSelected && { color: t.gold }]}>
                    {bible.abbreviation}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {API_BIBLE_KEY && (
              <>
                <Text style={[s.sectionHeading, { color: t.textMuted }]}>ONLINE · API.BIBLE</Text>
                {onlineBiblesLoading && (
                  <View style={[s.center, { flex: 0, paddingVertical: 24 }]}>
                    <ActivityIndicator color={t.gold} />
                  </View>
                )}
                {!onlineBiblesLoading && onlineBibles.length > 0 && (
                  <FlatList
                    data={onlineBibles}
                    keyExtractor={(tv) => tv.id}
                    renderItem={({ item }) => {
                      const isSelected = item.id === selectedBible.id;
                      return (
                        <TouchableOpacity
                          onPress={() => selectTranslation(item)}
                          style={[s.pickerRow, { borderBottomColor: t.divider }, isSelected && { backgroundColor: t.goldBg }]}
                        >
                          <Text style={[s.pickerRowText, { color: t.text }, isSelected && { color: t.gold, fontWeight: '600' }]}>
                            {item.name}
                          </Text>
                          <Text style={[s.pickerRowMeta, { color: t.textMuted }, isSelected && { color: t.gold }]}>
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
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 44, alignItems: 'flex-start' },
  backIcon: { fontSize: 30, lineHeight: 34 },
  headerTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  translationBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  translationBtnText: { fontSize: 13, fontWeight: '700' },
  chevronSmall: { fontSize: 11 },

  sourceBadge: {
    alignSelf: 'flex-end', marginRight: 16, marginTop: 8,
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1,
  },
  sourceBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  nav: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bookBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bookBtnText: { fontSize: 18, fontWeight: '700' },
  chevron: { fontSize: 14, marginTop: 2 },

  chapterNav: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chapterArrow: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  arrowDisabled: { opacity: 0.3 },
  arrowText: { fontSize: 18, lineHeight: 22 },
  chapterLabel: { fontSize: 14, minWidth: 80, textAlign: 'center' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: {
    paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1,
  },
  retryBtnText: { fontWeight: '600' },

  verseList: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  verseRow: { flexDirection: 'row', marginBottom: 18, alignItems: 'flex-start' },
  verseNum: { fontSize: 11, fontWeight: '700', width: 28, marginTop: 4 },
  verseText: { flex: 1, fontSize: 16, lineHeight: 28 },

  modalSafe: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  modalClose: { fontSize: 18 },

  sectionHeading: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.2,
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8,
  },
  searchInput: {
    margin: 16, padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 15,
  },

  pickerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerRowText: { fontSize: 15 },
  pickerRowMeta: { fontSize: 12 },
});
