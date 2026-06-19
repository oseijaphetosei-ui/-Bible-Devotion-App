import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { ChatStackParamList } from '../../types/navigation';
import type { ChatUser } from '../../types/chat';
import { AVATAR_COLORS } from '../../types/chat';
import { searchUsers, getOrCreateDM, createGroup } from '../../services/chatService';

type Nav = NativeStackNavigationProp<ChatStackParamList>;

function Avatar({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  return (
    <View style={[av.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '33', borderColor: color + '66' }]}>
      <Text style={[av.text, { color, fontSize: size * 0.36 }]}>{initials || '?'}</Text>
    </View>
  );
}

export default function NewChatScreen() {
  const navigation = useNavigation<Nav>();
  const t = useTheme();

  const [mode, setMode] = useState<'dm' | 'group'>('dm');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ChatUser[]>([]);
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const found = await searchUsers(q);
      setResults(found);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleSelect = (user: ChatUser) => {
    setSelected(prev =>
      prev.find(u => u.id === user.id)
        ? prev.filter(u => u.id !== user.id)
        : [...prev, user]
    );
  };

  const openDM = async (user: ChatUser) => {
    try {
      const chatId = await getOrCreateDM(user.id);
      navigation.replace('DirectMessage', { chatId, otherUserId: user.id, otherName: user.displayName });
    } catch {
      Alert.alert('Error', 'Could not open conversation.');
    }
  };

  const createGroupChat = async () => {
    if (!groupName.trim() || selected.length === 0 || creating) return;
    setCreating(true);
    try {
      const chatId = await createGroup(groupName.trim(), selected.map(u => u.id));
      navigation.replace('GroupChat', { chatId, groupName: groupName.trim() });
    } catch {
      Alert.alert('Error', 'Could not create group.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        {/* Header */}
        <View style={[s.header, { borderBottomColor: t.divider }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={24} color={t.gold} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: t.text }]}>New {mode === 'dm' ? 'Message' : 'Group'}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Mode tabs */}
        <View style={[s.tabs, { borderBottomColor: t.divider }]}>
          {(['dm', 'group'] as const).map(m => (
            <TouchableOpacity
              key={m}
              style={[s.tab, mode === m && { borderBottomColor: t.gold, borderBottomWidth: 2 }]}
              onPress={() => { setMode(m); setSelected([]); setQuery(''); setResults([]); }}
              activeOpacity={0.75}
            >
              <Text style={[s.tabText, { color: mode === m ? t.gold : t.textMuted }]}>
                {m === 'dm' ? 'Direct Message' : 'Group Chat'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Group name field */}
        {mode === 'group' && (
          <TextInput
            style={[s.groupNameInput, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.text }]}
            placeholder="Group name…"
            placeholderTextColor={t.textMuted}
            value={groupName}
            onChangeText={setGroupName}
          />
        )}

        {/* Selected chips */}
        {mode === 'group' && selected.length > 0 && (
          <View style={s.chips}>
            {selected.map(u => (
              <TouchableOpacity
                key={u.id}
                style={[s.chip, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}
                onPress={() => toggleSelect(u)}
                activeOpacity={0.75}
              >
                <Text style={[s.chipText, { color: t.gold }]}>{u.displayName}</Text>
                <Ionicons name="close" size={12} color={t.gold} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Search */}
        <View style={[s.searchWrap, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
          <Ionicons name="search-outline" size={16} color={t.textMuted} />
          <TextInput
            style={[s.searchInput, { color: t.text }]}
            placeholder="Search people by name…"
            placeholderTextColor={t.textMuted}
            value={query}
            onChangeText={runSearch}
            autoFocus
          />
          {loading && <ActivityIndicator size="small" color={t.gold} />}
        </View>

        {/* Results */}
        {results.length === 0 && query.length > 0 && !loading ? (
          <View style={s.empty}>
            <Text style={[s.emptyText, { color: t.textSub }]}>No users found for "{query}"</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={u => u.id}
            contentContainerStyle={{ paddingBottom: 120 }}
            renderItem={({ item }) => {
              const isSelected = !!selected.find(u => u.id === item.id);
              return (
                <TouchableOpacity
                  style={[s.userRow, { borderBottomColor: t.divider }, isSelected && { backgroundColor: t.goldBg }]}
                  onPress={() => mode === 'dm' ? openDM(item) : toggleSelect(item)}
                  activeOpacity={0.75}
                >
                  <Avatar name={item.displayName} color={item.avatarColor} />
                  <View style={s.userInfo}>
                    <Text style={[s.userName, { color: t.text }]}>{item.displayName}</Text>
                  </View>
                  {mode === 'group' && (
                    <View style={[s.checkbox, { borderColor: isSelected ? t.gold : t.chipBorder, backgroundColor: isSelected ? t.gold : 'transparent' }]}>
                      {isSelected && <Ionicons name="checkmark" size={12} color="#08071A" />}
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              query.length === 0 ? (
                <View style={s.hint}>
                  <Text style={[s.hintText, { color: t.textMuted }]}>Start typing to find people</Text>
                </View>
              ) : null
            }
          />
        )}

        {/* Create group button */}
        {mode === 'group' && selected.length > 0 && groupName.trim().length > 0 && (
          <View style={s.createWrap}>
            <TouchableOpacity
              style={[s.createBtn, { backgroundColor: t.gold }]}
              onPress={createGroupChat}
              disabled={creating}
              activeOpacity={0.85}
            >
              <Ionicons name="people" size={18} color="#08071A" />
              <Text style={s.createBtnText}>
                {creating ? 'Creating…' : `Create Group · ${selected.length + 1} members`}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },

  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },

  groupNameInput: {
    marginHorizontal: 16, marginTop: 12, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 15,
  },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginVertical: 10,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },

  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600' },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },

  empty: { paddingTop: 32, alignItems: 'center' },
  emptyText: { fontSize: 14 },
  hint: { paddingTop: 40, alignItems: 'center' },
  hintText: { fontSize: 14 },

  createWrap: { position: 'absolute', bottom: 32, left: 20, right: 20 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14,
  },
  createBtnText: { fontSize: 15, fontWeight: '700', color: '#08071A' },
});

const av = StyleSheet.create({
  wrap: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '700' },
});
