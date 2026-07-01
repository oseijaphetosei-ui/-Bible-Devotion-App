import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Animated, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { type LegalSection, LAST_UPDATED } from '../../constants/legal';

type Props = {
  title: string;
  identLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  sections: LegalSection[];
  publicUrl?: string;
};

export default function LegalDocScreen({ title, identLabel, icon, sections, publicUrl }: Props) {
  const t   = useTheme();
  const nav = useNavigation();
  const isDark    = t.statusBar === 'light-content';
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        {/* ── Hero ── */}
        <LinearGradient
          colors={isDark
            ? ['rgba(19,22,38,1)', 'rgba(13,15,26,0.92)']
            : ['rgba(237,231,217,1)', 'rgba(237,231,217,0.82)']}
          style={hs.container}
        >
          <View style={hs.navRow}>
            <TouchableOpacity
              onPress={() => nav.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={26} color={t.text} />
            </TouchableOpacity>
          </View>
          <View style={hs.identRow}>
            <Ionicons name={icon} size={12} color={t.accent} />
            <Text style={[hs.identLabel, { color: t.accent }]}>{identLabel}</Text>
          </View>
          <Text style={[hs.title, { color: t.text }]}>{title}</Text>
          <Text style={[hs.meta, { color: t.textMuted }]}>Effective {LAST_UPDATED}</Text>
        </LinearGradient>

        {/* ── Content ── */}
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <ScrollView
            contentContainerStyle={[cs.scroll, { paddingBottom: 60 }]}
            showsVerticalScrollIndicator={false}
          >
            {sections.map((section, idx) => (
              <View key={idx} style={cs.section}>
                {/* Section heading with gold left bar */}
                <View style={cs.headingRow}>
                  <View style={[cs.headingBar, { backgroundColor: t.gold }]} />
                  <Text style={[cs.heading, { color: t.text }]}>{section.heading}</Text>
                </View>

                {/* Section body paragraphs */}
                {section.body.map((para, pIdx) => (
                  <Text key={pIdx} style={[cs.body, { color: t.textSub }]}>
                    {para}
                  </Text>
                ))}
              </View>
            ))}

            {/* ── View online ── */}
            {publicUrl ? (
              <TouchableOpacity
                style={[cs.webRow, { borderColor: t.divider, backgroundColor: t.card }]}
                onPress={() => Linking.openURL(publicUrl)}
                activeOpacity={0.78}
              >
                <Ionicons name="globe-outline" size={16} color={t.gold} />
                <Text style={[cs.webLabel, { color: t.text }]}>View online version</Text>
                <Ionicons name="open-outline" size={14} color={t.textMuted} />
              </TouchableOpacity>
            ) : null}

            {/* ── Footer ── */}
            <Text style={[cs.footer, { color: t.textMuted }]}>
              Daily Devotion · Last updated {LAST_UPDATED}
            </Text>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const hs = StyleSheet.create({
  container:  { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24 },
  navRow:     { marginBottom: 22 },
  identRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  identLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  title:      { fontSize: 26, fontWeight: '700', letterSpacing: -0.4, lineHeight: 32, marginBottom: 6 },
  meta:       { fontSize: 12, letterSpacing: 0.2 },
});

const cs = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 20 },

  section: { marginBottom: 32 },

  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  headingBar: { width: 3, borderRadius: 2, marginTop: 3, alignSelf: 'stretch', minHeight: 16 },
  heading:    { flex: 1, fontSize: 16, fontWeight: '700', letterSpacing: -0.1, lineHeight: 22 },

  body: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
    paddingLeft: 13,
  },

  webRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  webLabel: { flex: 1, fontSize: 14, fontWeight: '500' },

  footer: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.2,
  },
});
