import React, { useState, useMemo, useCallback, memo, useRef } from 'react';
import {
  View,
  Text,
  SectionList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BibleStackParamList } from '../../types/navigation';
import { BOOKS } from '../../constants/books';
import { useTheme } from '../../theme';
import type { AppTheme } from '../../theme';
import PremiumSearchBar from '../../components/PremiumSearchBar';
import ProfileAvatar from '../../components/ProfileAvatar';

const HEADER_H = 72;

type NavProp = NativeStackNavigationProp<BibleStackParamList, 'BibleLibrary'>;

// ─── Abbreviations ───────────────────────────────────────────────────────────

const ABBREV: Record<string, string> = {
  GEN:'Gen', EXO:'Exod', LEV:'Lev', NUM:'Num', DEU:'Deut',
  JOS:'Josh', JDG:'Judg', RUT:'Ruth', '1SA':'1Sam', '2SA':'2Sam',
  '1KI':'1Kgs', '2KI':'2Kgs', '1CH':'1Chr', '2CH':'2Chr',
  EZR:'Ezra', NEH:'Neh', EST:'Esth', JOB:'Job', PSA:'Pss',
  PRO:'Prov', ECC:'Eccl', SNG:'Song', ISA:'Isa', JER:'Jer',
  LAM:'Lam', EZK:'Ezek', DAN:'Dan', HOS:'Hos', JOL:'Joel',
  AMO:'Amos', OBA:'Obad', JON:'Jonah', MIC:'Mic', NAM:'Nah',
  HAB:'Hab', ZEP:'Zeph', HAG:'Hag', ZEC:'Zech', MAL:'Mal',
  MAT:'Matt', MRK:'Mark', LUK:'Luke', JHN:'John', ACT:'Acts',
  ROM:'Rom', '1CO':'1Cor', '2CO':'2Cor', GAL:'Gal', EPH:'Eph',
  PHP:'Phil', COL:'Col', '1TH':'1Thess', '2TH':'2Thess',
  '1TI':'1Tim', '2TI':'2Tim', TIT:'Titus', PHM:'Phlm',
  HEB:'Heb', JAS:'Jas', '1PE':'1Pet', '2PE':'2Pet',
  '1JN':'1Jn', '2JN':'2Jn', '3JN':'3Jn', JUD:'Jude', REV:'Rev',
};

// ─── Search aliases (lowercase → book index) ─────────────────────────────────

const ALIASES: Record<string, number> = {
  genesis:0, gen:0,
  exodus:1, exo:1, ex:1, exod:1,
  leviticus:2, lev:2,
  numbers:3, num:3,
  deuteronomy:4, deut:4, deu:4,
  joshua:5, josh:5, jos:5,
  judges:6, judg:6, jdg:6,
  ruth:7,
  '1 samuel':8, '1samuel':8, '1sam':8, '1 sam':8,
  '2 samuel':9, '2samuel':9, '2sam':9, '2 sam':9,
  '1 kings':10, '1kings':10, '1kgs':10, '1 kgs':10,
  '2 kings':11, '2kings':11, '2kgs':11, '2 kgs':11,
  '1 chronicles':12, '1chronicles':12, '1chr':12, '1 chr':12,
  '2 chronicles':13, '2chronicles':13, '2chr':13, '2 chr':13,
  ezra:14, ezr:14,
  nehemiah:15, neh:15,
  esther:16, esth:16, est:16,
  job:17,
  psalms:18, psalm:18, ps:18, psa:18, pss:18,
  proverbs:19, prov:19, pro:19,
  ecclesiastes:20, eccl:20, ecc:20,
  'song of solomon':21, 'song of songs':21, song:21, sos:21, sng:21, cant:21,
  isaiah:22, isa:22,
  jeremiah:23, jer:23,
  lamentations:24, lam:24,
  ezekiel:25, ezek:25, ezk:25,
  daniel:26, dan:26,
  hosea:27, hos:27,
  joel:28,
  amos:29,
  obadiah:30, obad:30, ob:30,
  jonah:31, jon:31,
  micah:32, mic:32,
  nahum:33, nah:33,
  habakkuk:34, hab:34,
  zephaniah:35, zeph:35, zep:35,
  haggai:36, hag:36,
  zechariah:37, zech:37, zec:37,
  malachi:38, mal:38,
  matthew:39, matt:39, mat:39, mt:39,
  mark:40, mrk:40, mk:40,
  luke:41, luk:41, lk:41,
  john:42, jhn:42, jn:42,
  acts:43, act:43,
  romans:44, rom:44,
  '1 corinthians':45, '1corinthians':45, '1cor':45, '1co':45, '1 cor':45,
  '2 corinthians':46, '2corinthians':46, '2cor':46, '2co':46, '2 cor':46,
  galatians:47, gal:47,
  ephesians:48, eph:48,
  philippians:49, phil:49, php:49,
  colossians:50, col:50,
  '1 thessalonians':51, '1thessalonians':51, '1thess':51, '1th':51, '1 thess':51,
  '2 thessalonians':52, '2thessalonians':52, '2thess':52, '2th':52, '2 thess':52,
  '1 timothy':53, '1timothy':53, '1tim':53, '1ti':53, '1 tim':53,
  '2 timothy':54, '2timothy':54, '2tim':54, '2ti':54, '2 tim':54,
  titus:55, tit:55,
  philemon:56, phlm:56, phm:56,
  hebrews:57, heb:57,
  james:58, jas:58,
  '1 peter':59, '1peter':59, '1pet':59, '1pe':59, '1 pet':59,
  '2 peter':60, '2peter':60, '2pet':60, '2pe':60, '2 pet':60,
  '1 john':61, '1john':61, '1jn':61, '1jo':61, '1 jn':61,
  '2 john':62, '2john':62, '2jn':62, '2jo':62, '2 jn':62,
  '3 john':63, '3john':63, '3jn':63, '3jo':63, '3 jn':63,
  jude:64, jud:64,
  revelation:65, rev:65, apoc:65,
};

// ─── Section list data ────────────────────────────────────────────────────────

type BookItem = (typeof BOOKS)[number] & { index: number };

const SECTIONS: { title: string; subtitle: string; data: BookItem[] }[] = [
  {
    title: 'Old Testament',
    subtitle: '39 Books',
    data: BOOKS.slice(0, 39).map((b, i) => ({ ...b, index: i })),
  },
  {
    title: 'New Testament',
    subtitle: '27 Books',
    data: BOOKS.slice(39).map((b, i) => ({ ...b, index: 39 + i })),
  },
];

// ─── Search parsing ───────────────────────────────────────────────────────────

type SearchResult = {
  bookIndex: number;
  bookName: string;
  chapter?: number;
  verse?: number;
};

function matchBooks(q: string): Array<{ index: number; name: string }> {
  const norm = q.toLowerCase().trim().replace(/\s+/g, ' ');
  if (!norm) return [];

  const exact = ALIASES[norm];
  if (exact !== undefined) return [{ index: exact, name: BOOKS[exact].name }];

  const results: Array<{ index: number; name: string; score: number }> = [];
  BOOKS.forEach((book, index) => {
    const nameLow = book.name.toLowerCase();
    const abbr = (ABBREV[book.usfm] ?? '').toLowerCase();
    let score = 0;
    if (nameLow.startsWith(norm)) score = 80;
    else if (abbr.startsWith(norm)) score = 70;
    else if (nameLow.includes(norm)) score = 50;
    if (score) results.push({ index, name: book.name, score });
  });

  // Also check aliases by prefix
  Object.entries(ALIASES).forEach(([alias, idx]) => {
    if (alias.startsWith(norm) && !results.find((r) => r.index === idx)) {
      results.push({ index: idx, name: BOOKS[idx].name, score: 65 });
    }
  });

  return results
    .sort((a, b) => b.score - a.score)
    .map(({ index, name }) => ({ index, name }));
}

function parseSearch(raw: string): SearchResult[] {
  const q = raw.trim().replace(/\s+/g, ' ');
  if (!q) return [];

  // Book + chapter + verse: "John 3:16", "John3:16", "1 John 3:16"
  const verseM = q.match(/^(.*?)\s*(\d+)\s*[:.]\s*(\d+)\s*$/);
  if (verseM) {
    const bookStr = verseM[1].trim();
    const ch = parseInt(verseM[2], 10);
    const v = parseInt(verseM[3], 10);
    const books = matchBooks(bookStr);
    if (books.length) {
      return [
        { bookIndex: books[0].index, bookName: books[0].name, chapter: ch, verse: v },
        ...books.slice(1, 3).map((b) => ({ bookIndex: b.index, bookName: b.name })),
      ];
    }
  }

  // Book + chapter: "Gen 1", "Genesis 1"
  const chapterM = q.match(/^(.*?)\s+(\d+)\s*$/);
  if (chapterM) {
    const bookStr = chapterM[1].trim();
    const ch = parseInt(chapterM[2], 10);
    const books = matchBooks(bookStr);
    if (books.length) {
      return [
        { bookIndex: books[0].index, bookName: books[0].name, chapter: ch },
        ...books.slice(1, 3).map((b) => ({ bookIndex: b.index, bookName: b.name })),
      ];
    }
  }

  // Book only
  return matchBooks(q)
    .slice(0, 6)
    .map((b) => ({ bookIndex: b.index, bookName: b.name }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const TestamentHeader = memo(function TestamentHeader({ title, subtitle, t }: { title: string; subtitle: string; t: AppTheme }) {
  return (
    <View style={[sh.sectionHeader, { backgroundColor: t.bg }]}>
      <View style={[sh.sectionBar, { backgroundColor: t.gold }]} />
      <View style={sh.sectionTitles}>
        <Text style={[sh.sectionTitle, { color: t.text }]}>{title.toUpperCase()}</Text>
        <Text style={[sh.sectionSub, { color: t.textMuted }]}>{subtitle}</Text>
      </View>
    </View>
  );
});

const BookRow = memo(function BookRow({
  book,
  onPress,
  t,
}: {
  book: BookItem;
  onPress: () => void;
  t: AppTheme;
}) {
  const isNT = book.index >= 39;
  const abbrev = ABBREV[book.usfm] ?? book.usfm;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.65}
      style={[sh.bookRow, { borderBottomColor: t.divider }]}
    >
      <View style={[sh.indexBadge, { backgroundColor: isNT ? t.goldBg : t.bgAlt, borderColor: isNT ? t.goldBorder : t.cardBorder }]}>
        <Text style={[sh.indexNum, { color: isNT ? t.gold : t.textMuted }]}>
          {book.index + 1}
        </Text>
      </View>

      <View style={sh.bookInfo}>
        <Text style={[sh.bookName, { color: t.text }]}>{book.name}</Text>
        <Text style={[sh.bookMeta, { color: t.textMuted }]}>
          {abbrev} · {book.chapters} ch
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color={t.textMuted} />
    </TouchableOpacity>
  );
});

const ResultRow = memo(function ResultRow({
  result,
  query,
  onPress,
  t,
}: {
  result: SearchResult;
  query: string;
  onPress: () => void;
  t: AppTheme;
}) {
  const icon = result.verse ? 'bookmark-outline' : result.chapter ? 'list-outline' : 'book-outline';
  const label = result.verse
    ? `${result.bookName} ${result.chapter}:${result.verse}`
    : result.chapter
    ? `${result.bookName} Chapter ${result.chapter}`
    : result.bookName;
  const sub = result.verse
    ? 'Go to verse'
    : result.chapter
    ? 'Open chapter'
    : `${BOOKS[result.bookIndex].chapters} chapters`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.65}
      style={[sh.resultRow, { borderBottomColor: t.divider }]}
    >
      <View style={[sh.resultIcon, { backgroundColor: t.goldBg }]}>
        <Ionicons name={icon as any} size={16} color={t.gold} />
      </View>
      <View style={sh.resultInfo}>
        <Text style={[sh.resultLabel, { color: t.text }]}>{label}</Text>
        <Text style={[sh.resultSub, { color: t.textMuted }]}>{sub}</Text>
      </View>
      <Ionicons name="arrow-forward" size={14} color={t.gold} />
    </TouchableOpacity>
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function BibleLibraryScreen() {
  const navigation = useNavigation<NavProp>();
  const t = useTheme();
  const [query, setQuery] = useState('');
  const results = useMemo(() => query.trim() ? parseSearch(query) : [], [query]);

  const headerAnim = useRef(new Animated.Value(1)).current;
  const onSearchActiveChange = useCallback((active: boolean) => {
    Animated.timing(headerAnim, {
      toValue: active ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [headerAnim]);

  const handleResultPress = useCallback(
    (result: SearchResult) => {
      setQuery('');
      navigation.navigate('Bible', {
        bookIndex: result.bookIndex,
        chapter: result.chapter ?? 1,
        ...(result.verse ? { verseToScroll: result.verse } : {}),
      });
    },
    [navigation],
  );

  const handleBookPress = useCallback(
    (bookIndex: number) => {
      navigation.navigate('Bible', { bookIndex, chapter: 1 });
    },
    [navigation],
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />
      <SafeAreaView style={s.safe} edges={['top']}>

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
            <Text style={[s.headerTitle, { color: t.text }]}>Bible</Text>
          </View>
        </Animated.View>

        {/* Search bar */}
        <PremiumSearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search the Bible…"
          onActiveChange={onSearchActiveChange}
          autoCapitalize="none"
          style={{ marginBottom: 8 }}
        />

        {/* Search results */}
        {query.trim() ? (
          <ScrollView
            style={s.resultsScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {results.length === 0 ? (
              <View style={s.emptyWrap}>
                <Ionicons name="search-outline" size={32} color={t.textMuted} />
                <Text style={[s.emptyTitle, { color: t.textSub }]}>No results</Text>
                <Text style={[s.emptySub, { color: t.textMuted }]}>
                  Try a book name, abbreviation,{'\n'}or reference like "John 3:16"
                </Text>
              </View>
            ) : (
              results.map((r, i) => (
                <ResultRow
                  key={i}
                  result={r}
                  query={query}
                  onPress={() => handleResultPress(r)}
                  t={t}
                />
              ))
            )}
          </ScrollView>
        ) : (
          /* Book list */
          <SectionList
            sections={SECTIONS}
            keyExtractor={(item) => String(item.index)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.listContent}
            stickySectionHeadersEnabled={false}
            windowSize={11}
            maxToRenderPerBatch={10}
            renderSectionHeader={({ section }) => (
              <TestamentHeader title={section.title} subtitle={section.subtitle} t={t} />
            )}
            renderItem={({ item }) => (
              <BookRow book={item} onPress={() => handleBookPress(item.index)} t={t} />
            )}
            ItemSeparatorComponent={() => null}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 14,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },

  resultsScroll: { flex: 1, paddingTop: 4 },

  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  listContent: { paddingBottom: 120 },
});

const sh = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 10,
    gap: 12,
  },
  sectionBar: { width: 4, height: 22, borderRadius: 2 },
  sectionTitles: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1.2 },
  sectionSub: { fontSize: 11, letterSpacing: 0.4 },

  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  indexBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexNum: { fontSize: 11, fontWeight: '700' },
  bookInfo: { flex: 1 },
  bookName: { fontSize: 15, fontWeight: '600' },
  bookMeta: { fontSize: 11, marginTop: 2, letterSpacing: 0.2 },

  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: { flex: 1 },
  resultLabel: { fontSize: 15, fontWeight: '600' },
  resultSub: { fontSize: 12, marginTop: 1 },
});
