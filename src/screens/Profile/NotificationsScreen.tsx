import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Switch, StyleSheet, StatusBar, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import {
  getNotificationSettings, setNotificationSettings,
} from '../../services/profileService';
import type { NotificationSettings } from '../../types/profile';

type Row = { key: keyof NotificationSettings; label: string; description: string; icon: string };

const ROWS: Row[] = [
  { key: 'dailyDevotions',    label: 'Daily Devotions',     description: 'Morning reading reminder',         icon: '📖' },
  { key: 'communityActivity', label: 'Community Activity',  description: 'Likes, comments on your posts',   icon: '🤝' },
  { key: 'newMessages',       label: 'New Messages',        description: 'Direct messages from others',     icon: '💬' },
  { key: 'prayerUpdates',     label: 'Prayer Updates',      description: 'Answers to prayer requests',      icon: '🙏' },
  { key: 'groupActivity',     label: 'Group Activity',      description: 'Updates from joined groups',      icon: '👥' },
];

export default function NotificationsScreen() {
  const t   = useTheme();
  const nav = useNavigation();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);

  useEffect(() => {
    getNotificationSettings().then(setSettings);
  }, []);

  const toggle = useCallback(async (key: keyof NotificationSettings) => {
    if (!settings) return;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    await setNotificationSettings(next);
  }, [settings]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        <View style={[s.header, { borderBottomColor: t.divider }]}>
          <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={t.text} />
          </TouchableOpacity>
          <Text style={[s.title, { color: t.text }]}>Notifications</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={[s.hint, { color: t.textMuted }]}>
            Choose what you'd like to be notified about
          </Text>

          <View style={[s.card, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            {settings && ROWS.map((row, i) => (
              <View key={row.key}>
                <View style={s.row}>
                  <Text style={s.rowIcon}>{row.icon}</Text>
                  <View style={s.rowText}>
                    <Text style={[s.rowLabel, { color: t.text }]}>{row.label}</Text>
                    <Text style={[s.rowDesc,  { color: t.textMuted }]}>{row.description}</Text>
                  </View>
                  <Switch
                    value={settings[row.key]}
                    onValueChange={() => toggle(row.key)}
                    trackColor={{ false: t.filterInactiveBg, true: t.gold }}
                    thumbColor="#fff"
                  />
                </View>
                {i < ROWS.length - 1 && <View style={[s.divider, { backgroundColor: t.divider }]} />}
              </View>
            ))}
            {!settings && <View style={s.loading} />}
          </View>
        </ScrollView>
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

  scroll: { padding: 20, paddingBottom: 80 },
  hint:   { fontSize: 13, marginBottom: 20, textAlign: 'center' },

  card: {
    borderWidth: 1, borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  rowIcon:  { fontSize: 20, width: 28, textAlign: 'center' },
  rowText:  { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowDesc:  { fontSize: 12, marginTop: 2 },
  divider:  { height: 1, marginHorizontal: 16 },
  loading:  { height: 60 },
});
