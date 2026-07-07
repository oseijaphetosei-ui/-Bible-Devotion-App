import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ContactProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const otherName: string   = route.params?.otherName   ?? 'Contact';
  const chatId: string      = route.params?.chatId      ?? '';
  const otherUserId: string = route.params?.otherUserId ?? '';
  const initials = getInitials(otherName);

  const [muted, setMuted] = useState(false);

  const handleSearch = () => {
    navigation.navigate('DirectMessage', {
      chatId,
      otherUserId,
      otherName,
      openSearch: true,
    });
  };

  const goToMessage = () => {
    navigation.navigate('DirectMessage', {
      chatId,
      otherUserId,
      otherName,
    });
  };

  const handleCall = () => {
    Alert.alert('Audio Call', 'Audio calls are not available yet.');
  };

  const handleVideo = () => {
    Alert.alert('Video Call', 'Video calls are not available yet.');
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    Alert.alert(
      next ? 'Notifications Muted' : 'Notifications Unmuted',
      next
        ? `You will no longer receive notifications from ${otherName}.`
        : `You will now receive notifications from ${otherName}.`,
      [{ text: 'OK' }],
    );
  };

  const handleBlock = () => {
    Alert.alert(
      `Block ${otherName}?`,
      'They will no longer be able to send you messages.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            // TODO: wire up block service call
            navigation.navigate('ChatTab');
          },
        },
      ],
    );
  };

  const ACTIONS = [
    { icon: 'search-outline'   as const, label: 'Search', onPress: handleSearch },
    { icon: 'call-outline'     as const, label: 'Audio',  onPress: handleCall   },
    { icon: 'videocam-outline' as const, label: 'Video',  onPress: handleVideo  },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: t.bg }}>
        <View style={[s.header, { borderBottomColor: t.divider }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={s.backBtn}
          >
            <Ionicons name="chevron-back" size={26} color={t.text} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: t.text }]}>Contact Info</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile section */}
        <View style={s.profileSection}>
          <View style={[s.bigAvatar, { backgroundColor: t.filterInactiveBg, borderColor: t.filterInactiveBorder }]}>
            <Text style={[s.bigAvatarText, { color: t.text }]}>{initials}</Text>
          </View>
          <Text style={[s.name, { color: t.text }]}>{otherName}</Text>
          <TouchableOpacity onPress={goToMessage} activeOpacity={0.7}>
            <Text style={[s.subtext, { color: t.textMuted }]}>Tap to message</Text>
          </TouchableOpacity>
        </View>

        {/* Action buttons */}
        <View style={[s.actionsRow, { borderTopColor: t.divider, borderBottomColor: t.divider }]}>
          {ACTIONS.map(item => (
            <TouchableOpacity
              key={item.label}
              style={s.actionItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[s.actionIcon, { backgroundColor: t.card }]}>
                <Ionicons name={item.icon} size={29} color={t.textSub} />
              </View>
              <Text style={[s.actionLabel, { color: t.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Shared media */}
        <View style={[s.sectionHeader, { borderBottomColor: t.divider }]}>
          <Text style={[s.sectionTitle, { color: t.textMuted }]}>SHARED MEDIA</Text>
        </View>
        <View style={[s.emptyRow, { borderBottomColor: t.divider }]}>
          <Ionicons name="images-outline" size={20} color={t.textMuted} />
          <Text style={[s.emptyRowText, { color: t.textMuted }]}>No shared media yet</Text>
        </View>

        {/* Shared links */}
        <View style={[s.sectionHeader, { borderBottomColor: t.divider }]}>
          <Text style={[s.sectionTitle, { color: t.textMuted }]}>SHARED LINKS</Text>
        </View>
        <View style={[s.emptyRow, { borderBottomColor: t.divider }]}>
          <Ionicons name="link-outline" size={20} color={t.textMuted} />
          <Text style={[s.emptyRowText, { color: t.textMuted }]}>No links shared yet</Text>
        </View>

        {/* Settings rows */}
        <View style={[s.sectionHeader, { borderBottomColor: t.divider }]} />
        <TouchableOpacity
          style={[s.flatRow, { borderBottomColor: t.divider }]}
          onPress={toggleMute}
          activeOpacity={0.75}
        >
          <Ionicons
            name={muted ? 'notifications-outline' : 'notifications-off-outline'}
            size={20}
            color={t.textSub}
          />
          <Text style={[s.flatRowText, { color: t.textSub }]}>
            {muted ? 'Unmute notifications' : 'Mute notifications'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={t.textMuted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.flatRow, { borderBottomColor: t.divider }]}
          onPress={handleBlock}
          activeOpacity={0.75}
        >
          <Ionicons name="ban-outline" size={20} color="#E07070" />
          <Text style={[s.flatRowText, { color: '#E07070' }]}>Block {otherName}</Text>
          <Ionicons name="chevron-forward" size={16} color={t.textMuted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  backBtn: { padding: 6, width: 40 },

  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 6,
  },
  bigAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bigAvatarText: { fontSize: 32, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700' },
  subtext: { fontSize: 13 },

  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
  },
  actionItem: { flex: 1, alignItems: 'center', gap: 8 },
  actionIcon: {
    alignSelf: 'stretch',
    height: 82,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 13, fontWeight: '500' },

  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },

  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  emptyRowText: { fontSize: 14 },

  flatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  flatRowText: { fontSize: 15 },
});
