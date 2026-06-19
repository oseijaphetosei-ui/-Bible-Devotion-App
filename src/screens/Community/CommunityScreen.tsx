import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import ProfileAvatar from '../../components/ProfileAvatar';

export default function CommunityScreen() {
  const t = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        {/* Standard header */}
        <View style={s.header}>
          <ProfileAvatar />
          <Text style={[s.headerTitle, { color: t.text }]}>COMMUNITY</Text>
        </View>

        {/* Coming soon */}
        <View style={s.center}>
          <Text style={s.icon}>🤝</Text>
          <Text style={[s.title, { color: t.text }]}>Coming Soon</Text>
          <Text style={[s.sub, { color: t.textSub }]}>
            Connect with believers{'\n'}around the world
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
    flex: 1,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 80,
  },
  icon:  { fontSize: 52 },
  title: { fontSize: 20, fontWeight: '700' },
  sub:   { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
