import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
  ScrollView, ActivityIndicator, Share, Animated, Platform, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { getTodayVerseEntry, fetchTodayVerse, type ResolvedVerse } from '../../services/verseService';
import { OFFLINE_BIBLES } from '../../services/bibleService';
import { useTheme } from '../../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = Math.round(SCREEN_W * 0.68);
const GOLD   = '#C9A96B';
const SERIF  = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function VerseScreen() {
  const t          = useTheme();
  const isDark     = t.statusBar === 'light-content';
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const entry      = getTodayVerseEntry();

  const rootBg     = isDark ? '#060810' : '#DDD5C4';
  const textColor  = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const subColor   = isDark ? 'rgba(255,255,255,0.62)' : 'rgba(24,18,8,0.62)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';
  const glass      = isDark
    ? { backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }
    : { backgroundColor: 'rgba(255,255,255,0.68)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)' };

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
    <View style={{ flex: 1, backgroundColor: rootBg }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 56 }}
      >
        {/* Cinematic Hero */}
        <View style={{ height: HERO_H, overflow: 'hidden' }}>
          <ExpoImage
            source={require('../../assets/today-verse.jpg')}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)']}
            locations={[0, 0.28]}
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.84)']}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Nav row */}
          <View style={[s.navRow, { top: insets.top + 10 }]}>
            <TouchableOpacity
              style={s.navBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.90)" />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.navBtn}
              onPress={handleShare}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={18} color="rgba(255,255,255,0.90)" />
            </TouchableOpacity>
          </View>

          {/* Hero content */}
          <View style={s.heroContent}>
            <View style={s.eyebrowRow}>
              <Ionicons name="sunny-outline" size={11} color={GOLD} />
              <Text style={s.eyebrow}>TODAY'S VERSE</Text>
            </View>

            <Text style={[s.heroRef, { fontFamily: SERIF }]}>{entry.label}</Text>

            <View style={s.tagRow}>
              {entry.tags.map((tag) => (
                <View key={tag} style={s.tag}>
                  <Text style={s.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <View style={s.centered}>
            <ActivityIndicator color={GOLD} size="large" />
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* Verse text */}
            <Text style={[s.verseText, { color: textColor, fontFamily: SERIF }]}>
              {verse!.text}
            </Text>

            {/* Reflection card */}
            <Text style={[s.sectionLabel, { color: mutedColor }]}>REFLECTION</Text>
            <View style={[s.card, glass, {
              shadowColor: isDark ? '#000' : 'rgba(47,42,36,0.10)',
              shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.20 : 1, shadowRadius: 14, elevation: 4,
            }]}>
              <View style={s.reflectionInner}>
                <View style={s.reflectionIcon}>
                  <Ionicons name="heart-outline" size={14} color={GOLD} />
                </View>
                <Text style={[s.reflectionText, { color: subColor }]}>
                  Take a moment to sit with this verse. What is God saying to you through it today?
                </Text>
              </View>
            </View>

            {/* CTA */}
            <View style={s.actions}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Bible', {
                  bookIndex: verse!.bookIndex,
                  chapter:   verse!.chapter,
                })}
              >
                <LinearGradient
                  colors={[GOLD, '#B8904A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.primaryBtn}
                >
                  <Ionicons name="book-outline" size={17} color="#08071A" />
                  <Text style={s.primaryBtnText}>Read Chapter</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  navRow: {
    position: 'absolute', left: 18, right: 18,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.30)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 22, paddingBottom: 22,
  },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  eyebrow:    { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: GOLD },
  heroRef: {
    fontSize: 28, fontWeight: '400', lineHeight: 36, letterSpacing: -0.3,
    color: 'rgba(255,255,255,0.95)', marginBottom: 14,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: 'rgba(201,169,107,0.22)', borderWidth: 1, borderColor: 'rgba(201,169,107,0.42)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
  },
  tagText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: GOLD },

  centered:   { paddingVertical: 60, alignItems: 'center' },

  verseText: {
    fontSize: Platform.OS === 'ios' ? 20 : 19, lineHeight: 34,
    fontStyle: 'italic', paddingHorizontal: 24, paddingTop: 24,
    paddingBottom: 4, letterSpacing: 0.1,
  },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.8,
    marginTop: 24, marginBottom: 10, paddingHorizontal: 20,
  },
  card: { marginHorizontal: 16, borderRadius: 18 },
  reflectionInner: {
    flexDirection: 'row', gap: 12, padding: 18, alignItems: 'flex-start',
  },
  reflectionIcon: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: 'rgba(201,169,107,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  reflectionText: { flex: 1, fontSize: 14, lineHeight: 22 },

  actions: { marginHorizontal: 16, marginTop: 28 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, paddingVertical: 15,
  },
  primaryBtnText: { fontWeight: '700', fontSize: 15, color: '#08071A' },
});
