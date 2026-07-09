import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, StatusBar, Platform } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BibleStackParamList } from '../../types/navigation';
import { useTheme } from '../../theme';

type NavProp = NativeStackNavigationProp<BibleStackParamList, 'BibleSplash'>;

const GOLD  = '#C9A96B';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function BibleSplashScreen() {
  const navigation = useNavigation<NavProp>();
  const t          = useTheme();

  const isDark = t.statusBar === 'light-content';

  const fadeAll   = useRef(new Animated.Value(0)).current;
  const scale     = useRef(new Animated.Value(0.86)).current;
  const metaFade  = useRef(new Animated.Value(0)).current;
  const lineScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Image fades in first
      Animated.timing(fadeAll, { toValue: 1, duration: 600, useNativeDriver: true }),
      // Icon + title spring in
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, tension: 60, friction: 9, useNativeDriver: true }),
        Animated.timing(lineScale, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      // Meta fades in
      Animated.timing(metaFade, { toValue: 1, duration: 380, delay: 60, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => navigation.replace('BibleLibrary'), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background image */}
      <ExpoImage
        source={require('../../assets/open-bible-in-the-morning.jpg')}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        cachePolicy="memory-disk"
      />

      {/* Gradient scrim — stronger for light mode so text stays legible */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(6,8,16,0.72)', 'rgba(6,8,16,0.55)', 'rgba(6,8,16,0.82)']
            : ['rgba(6,8,16,0.55)', 'rgba(6,8,16,0.40)', 'rgba(6,8,16,0.68)']
        }
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Content */}
      <Animated.View style={[s.container, { opacity: fadeAll }]}>
        {/* Icon badge */}
        <Animated.View style={[s.iconWrap, { transform: [{ scale }] }]}>
          <View style={s.iconInner}>
            <Ionicons name="book" size={44} color={GOLD} />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.Text style={[s.title, { transform: [{ scale }] }]}>
          The Holy Bible
        </Animated.Text>

        {/* Ornamental line */}
        <Animated.View style={[s.ornamentRow, { transform: [{ scaleX: lineScale }] }]}>
          <View style={s.ornamentLine} />
          <Text style={s.ornamentDot}>✦</Text>
          <View style={s.ornamentLine} />
        </Animated.View>

        {/* Meta */}
        <Animated.View style={[s.meta, { opacity: metaFade }]}>
          <Text style={s.bookCount}>66 Books · Offline Access</Text>
          <Text style={s.translations}>
            King James · Asante Twi · Akuapem Twi
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 0, paddingHorizontal: 40,
  },
  iconWrap: {
    width: 100, height: 100, borderRadius: 30,
    backgroundColor: 'rgba(201,169,107,0.10)',
    borderWidth: 1.5, borderColor: 'rgba(201,169,107,0.35)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 22,
    shadowColor: '#000',
    shadowOpacity: 0.30,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  iconInner: { alignItems: 'center', justifyContent: 'center' },
  title: {
    fontFamily: SERIF,
    fontSize: 32, fontWeight: '400', letterSpacing: 0.2, textAlign: 'center',
    color: 'rgba(255,255,255,0.96)',
    marginBottom: 20,
  },
  ornamentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20,
  },
  ornamentLine: { flex: 1, height: 1, backgroundColor: 'rgba(201,169,107,0.40)' },
  ornamentDot:  { color: GOLD, fontSize: 14 },
  meta: { alignItems: 'center', gap: 8 },
  bookCount: {
    fontSize: 13, color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.5, textAlign: 'center',
  },
  translations: {
    fontSize: 11, color: 'rgba(255,255,255,0.32)',
    letterSpacing: 0.6, textAlign: 'center',
  },
});
