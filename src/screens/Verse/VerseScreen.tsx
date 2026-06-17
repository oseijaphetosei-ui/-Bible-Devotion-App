import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Share,
} from 'react-native';
import { ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { fetchTodayVerse, type ResolvedVerse } from '../../services/verseService';
import { OFFLINE_BIBLES } from '../../services/bibleService';

const C = {
  gold: '#D4AF37',
  goldDim: '#3A2E10',
  text: '#F0EFE9',
  textSub: '#8B8FA8',
  textMuted: '#555870',
  cardBorder: '#1F2240',
};

export default function VerseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [verse, setVerse] = useState<ResolvedVerse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayVerse(OFFLINE_BIBLES[0])
      .then(setVerse)
      .finally(() => setLoading(false));
  }, []);

  const handleShare = async () => {
    if (!verse) return;
    await Share.share({ message: `${verse.text}\n— ${verse.label}` });
  };

  return (
    <LinearGradient colors={['#5C3A10', '#080604']} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {loading || !verse ? (
        <SafeAreaView style={s.centered} edges={['top']}>
          <ActivityIndicator color={C.gold} size="large" />
        </SafeAreaView>
      ) : (
        <ImageBackground source={verse.image} style={s.hero}>
          <LinearGradient
            colors={['rgba(8,6,4,0.25)', 'rgba(8,6,4,0.72)', 'rgba(5,3,2,0.97)']}
            style={s.overlay}
          >
            <SafeAreaView style={s.safe} edges={['top']}>
              {/* Back button */}
              <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                <Text style={s.backIcon}>‹</Text>
              </TouchableOpacity>

              <ScrollView
                style={s.scroll}
                contentContainerStyle={s.content}
                showsVerticalScrollIndicator={false}
              >
                <View style={s.topSpacer} />

                {/* Label */}
                <Text style={s.dayLabel}>TODAY'S VERSE</Text>

                {/* Reference */}
                <Text style={s.reference}>{verse.label}</Text>

                {/* Verse text */}
                <Text style={s.verseText}>{verse.text}</Text>

                {/* Tags */}
                <View style={s.tagRow}>
                  {verse.tags.map((tag) => (
                    <View key={tag} style={s.tag}>
                      <Text style={s.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>

                {/* Reflection prompt */}
                <View style={s.reflectionCard}>
                  <Text style={s.reflectionLabel}>REFLECTION</Text>
                  <Text style={s.reflectionText}>
                    Take a moment to sit with this verse. What is God saying to you through it today?
                  </Text>
                </View>

                {/* Actions */}
                <View style={s.actions}>
                  <TouchableOpacity
                    style={s.primaryBtn}
                    onPress={() => navigation.navigate('Bible', { bookIndex: verse.bookIndex, chapter: verse.chapter })}
                  >
                    <Text style={s.primaryBtnText}>📖  Read Chapter</Text>
                  </TouchableOpacity>
                  <View style={s.secondaryRow}>
                    <TouchableOpacity style={s.secondaryBtn} onPress={handleShare}>
                      <Text style={s.secondaryBtnText}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.secondaryBtn}>
                      <Text style={s.secondaryBtnText}>🔖  Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </SafeAreaView>
          </LinearGradient>
        </ImageBackground>
      )}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { flex: 1 },
  overlay: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 48 },
  topSpacer: { height: 80 },

  backBtn: {
    position: 'absolute',
    top: 12,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 32, color: C.text, lineHeight: 38 },

  dayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.gold,
    letterSpacing: 2,
    marginBottom: 10,
  },
  reference: {
    fontSize: 28,
    fontWeight: '800',
    color: C.text,
    marginBottom: 18,
    lineHeight: 34,
  },
  verseText: {
    fontSize: 18,
    color: C.text,
    fontStyle: 'italic',
    lineHeight: 30,
    marginBottom: 22,
  },

  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 28,
  },
  tag: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  tagText: { color: C.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1 },

  reflectionCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 18,
    marginBottom: 28,
  },
  reflectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.gold,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  reflectionText: {
    fontSize: 14,
    color: C.textSub,
    lineHeight: 22,
  },

  actions: { gap: 12 },
  primaryBtn: {
    backgroundColor: C.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#0D0F1A', fontWeight: '700', fontSize: 15 },
  secondaryRow: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { color: C.gold, fontWeight: '600', fontSize: 14 },
});
