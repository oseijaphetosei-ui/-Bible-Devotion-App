import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { useAppearance, type ThemePref } from '../../context/AppearanceContext';

type Option = { value: ThemePref; label: string; icon: string; description: string };

const OPTIONS: Option[] = [
  { value: 'system', label: 'System Default', icon: '⚙️', description: 'Follows your device setting' },
  { value: 'light',  label: 'Light Mode',    icon: '☀️', description: 'Warm parchment and gold' },
  { value: 'dark',   label: 'Dark Mode',     icon: '🌙', description: 'Deep charcoal and gold' },
];

export default function AppearanceScreen() {
  const t   = useTheme();
  const nav = useNavigation();
  const { pref, setPref } = useAppearance();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        {/* Header */}
        <View style={[s.header, { borderBottomColor: t.divider }]}>
          <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={t.text} />
          </TouchableOpacity>
          <Text style={[s.title, { color: t.text }]}>Appearance</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={s.content}>
          <Text style={[s.hint, { color: t.textMuted }]}>
            Changes apply instantly throughout the app
          </Text>

          <View style={s.options}>
            {OPTIONS.map(opt => {
              const active = pref === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    s.option,
                    { backgroundColor: t.card, borderColor: active ? t.gold : t.cardBorder },
                    active && { borderWidth: 1.5 },
                  ]}
                  onPress={() => setPref(opt.value)}
                  activeOpacity={0.8}
                >
                  <Text style={s.optionIcon}>{opt.icon}</Text>
                  <View style={s.optionText}>
                    <Text style={[s.optionLabel, { color: t.text }]}>{opt.label}</Text>
                    <Text style={[s.optionDesc,  { color: t.textMuted }]}>{opt.description}</Text>
                  </View>
                  <View style={[
                    s.radio,
                    { borderColor: active ? t.gold : t.cardBorder },
                    active && { backgroundColor: t.gold },
                  ]}>
                    {active && <View style={s.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Preview strip */}
          <View style={[s.preview, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            <Text style={[s.previewLabel, { color: t.textMuted }]}>PREVIEW</Text>
            <View style={s.previewRow}>
              <View style={[s.previewSwatch, { backgroundColor: t.bg, borderColor: t.cardBorder }]} />
              <View style={[s.previewSwatch, { backgroundColor: t.card, borderColor: t.cardBorder }]} />
              <View style={[s.previewSwatch, { backgroundColor: t.gold, borderColor: t.goldBorder }]} />
            </View>
            <Text style={[s.previewText, { color: t.text }]}>Sample heading</Text>
            <Text style={[s.previewSub,  { color: t.textSub }]}>Sample body text looks like this</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  title:   { flex: 1, fontSize: 18, fontWeight: '700', textAlign: 'center' },

  content: { padding: 20 },
  hint:    { fontSize: 13, marginBottom: 20, textAlign: 'center' },

  options: { gap: 10, marginBottom: 28 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderRadius: 16,
    padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  optionIcon:  { fontSize: 24, width: 32, textAlign: 'center' },
  optionText:  { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: '700' },
  optionDesc:  { fontSize: 12, marginTop: 2 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },

  preview: {
    borderWidth: 1, borderRadius: 16, padding: 16,
  },
  previewLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 12 },
  previewRow:   { flexDirection: 'row', gap: 8, marginBottom: 14 },
  previewSwatch: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1,
  },
  previewText: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  previewSub:  { fontSize: 13 },
});
