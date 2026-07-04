import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Share,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { getTodayVerseEntry, fetchTodayVerse, type ResolvedVerse } from '../../services/verseService';
import { OFFLINE_BIBLES } from '../../services/bibleService';
import { useTheme } from '../../theme';

export default function VerseScreen() {
  const t          = useTheme();
  const isDark     = t.statusBar === 'light-content';
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const entry      = getTodayVerseEntry();

  const [verse,   setVerse]   = useState<ResolvedVerse | null>(null);
  const [loading, setLoading] = useState(true);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    fetchTodayVerse(OFFLINE_BIBLES[0])
      .then((v) => {
        setVerse(v);
        Animated.parallel([
          Animated.timing(fadeAnim,  { toValue: 1, duration: 340, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 340, useNativeDriver: true }),
        ]).start();
      })
      .finally(() => setLoading(false));
  }, []);

  const handleShare = async () => {
    if (!verse) return;
    await Share.share({ message: `${verse.text}\n— ${verse.label}` });
  };

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 56 }}
        >
          {/* ── Hero ── */}
          <LinearGradient
            colors={isDark
              ? ['rgba(19,22,38,1)', 'rgba(13,15,26,0.92)']
              : ['rgba(237,231,217,1)', 'rgba(237,231,217,0.82)']}
            style={hs.container}
          >
            <View style={hs.navRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={26} color={t.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShare}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <Ionicons name="share-outline" size={22} color={t.text} />
              </TouchableOpacity>
            </View>

            <View style={hs.topRow}>
              <Ionicons name="sunny-outline" size={11} color={t.accent} />
              <Text style={[hs.label, { color: t.accent }]}>TODAY'S VERSE</Text>
            </View>

            <Text style={[hs.heading, { color: t.text }]}>{entry.label}</Text>

            {/* Tags row */}
            <View style={hs.tagRow}>
              {entry.tags.map((tag) => (
                <View key={tag} style={[hs.tag, { backgroundColor: t.accentBg, borderColor: t.accentBorder }]}>
                  <Text style={[hs.tagText, { color: t.accent }]}>{tag}</Text>
                </View>
              ))}
            </View>

            {/* Bottom rule — mirrors Prayer Journal statsRow top border */}
            <View style={[hs.rule, { borderTopColor: t.divider }]} />
          </LinearGradient>

          {/* ── Content ── */}
          {loading ? (
            <View style={s.centered}>
              <ActivityIndicator color={t.accent} size="large" />
            </View>
          ) : (
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

              {/* Verse text */}
              <Text style={[s.verseText, { color: t.text, fontFamily: t.fontSerif }]}>
                {verse!.text}
              </Text>

              {/* Reflection */}
              <Text style={[s.sectionLabel, { color: t.textMuted }]}>REFLECTION</Text>
              <View style={[s.card, { borderColor: t.divider }]}>
                <View style={s.reflectionInner}>
                  <Ionicons name="heart-outline" size={15} color={t.accent} style={{ marginTop: 1 }} />
                  <Text style={[s.reflectionText, { color: t.textSub }]}>
                    Take a moment to sit with this verse. What is God saying to you through it today?
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={s.actions}>
                <TouchableOpacity
                  style={[s.primaryBtn, { backgroundColor: t.accentBg, borderWidth: 1, borderColor: t.accentBorder }]}
                  activeOpacity={0.82}
                  onPress={() => navigation.navigate('Bible', {
                    bookIndex: verse!.bookIndex,
                    chapter:   verse!.chapter,
                  })}
                >
                  <Ionicons name="book-outline" size={17} color={t.accent} />
                  <Text style={[s.primaryBtnText, { color: t.accent }]}>Read Chapter</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Hero styles (matching Prayer Journal exactly) ──────────────────────────────

const hs = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 0,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 36,
    marginBottom: 14,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tagText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  rule: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 18,
    paddingBottom: 20,
  },
});

// ── Content styles ─────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:    { flex: 1 },
  centered:{ paddingVertical: 60, alignItems: 'center' },

  // Grouped card — mirrors sc.list in PrayerJournalScreen
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  verseText: {
    fontSize: Platform.OS === 'ios' ? 20 : 19,
    lineHeight: 34,
    fontStyle: 'italic',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 4,
    letterSpacing: 0.1,
  },

  // Reflection
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginTop: 24,
    marginBottom: 0,
    paddingHorizontal: 20,
  },
  reflectionInner: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    alignItems: 'flex-start',
  },
  reflectionText: { flex: 1, fontSize: 14, lineHeight: 22 },

  // Actions
  actions: { marginHorizontal: 16, marginTop: 28 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
  },
  primaryBtnText: { fontWeight: '700', fontSize: 15 },
});
