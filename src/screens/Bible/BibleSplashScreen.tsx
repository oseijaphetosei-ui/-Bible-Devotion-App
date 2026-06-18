import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BibleStackParamList } from '../../types/navigation';
import { useTheme } from '../../theme';

type NavProp = NativeStackNavigationProp<BibleStackParamList, 'BibleSplash'>;

export default function BibleSplashScreen() {
  const navigation = useNavigation<NavProp>();
  const t = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 55, friction: 9, useNativeDriver: true }),
      ]),
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => navigation.replace('BibleLibrary'), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        {/* Icon badge */}
        <View style={[styles.iconWrap, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}>
          <Ionicons name="book" size={48} color={t.gold} />
        </View>

        <Text style={[styles.title, { color: t.text }]}>The Holy Bible</Text>

        <Animated.View style={[styles.meta, { opacity: subtitleOpacity }]}>
          <View style={[styles.divider, { backgroundColor: t.goldBorder }]} />
          <Text style={[styles.bookCount, { color: t.textSub }]}>66 Books · Offline Access</Text>
          <Text style={[styles.translations, { color: t.textMuted }]}>
            King James · Asante Twi · Akuapem Twi
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center', gap: 16, paddingHorizontal: 40 },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  meta: { alignItems: 'center', gap: 10, marginTop: 4 },
  divider: { width: 36, height: 1.5, borderRadius: 1 },
  bookCount: { fontSize: 14, letterSpacing: 0.5, textAlign: 'center' },
  translations: { fontSize: 12, letterSpacing: 0.6, textAlign: 'center' },
});
