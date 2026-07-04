import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  StatusBar, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { createPost } from '../../services/communityService';
import { POST_TYPE_META } from '../../types/community';
import type { PostType } from '../../types/community';
import { CommunityStackParamList } from '../../types/navigation';

type RoutePropType = RouteProp<CommunityStackParamList, 'CreatePost'>;

const POST_TYPES: PostType[] = ['post', 'testimony', 'prayer', 'question', 'scripture'];

export default function CreatePostScreen() {
  const t = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RoutePropType>();

  const [type, setType]         = useState<PostType>(route.params?.type ?? 'post');
  const [content, setContent]   = useState('');
  const [scripture, setScripture] = useState('');
  const [posting, setPosting]   = useState(false);
  const contentRef = useRef<TextInput>(null);

  const canPost = content.trim().length >= 10;

  const handlePost = async () => {
    if (!canPost || posting) return;
    setPosting(true);
    try {
      await createPost({
        type,
        content: content.trim(),
        scriptureRef: type === 'scripture' ? scripture.trim() : undefined,
      });
      navigation.goBack();
    } catch (err: any) {
      setPosting(false);
      const msg = err?.code === 'permission-denied'
        ? 'Sign-in is still loading. Wait a moment and try again.'
        : 'Could not post. Please check your connection and try again.';
      Alert.alert('Post failed', msg);
    }
  };

  const meta = POST_TYPE_META[type];

  const PLACEHOLDERS: Record<PostType, string> = {
    post:       'Share what\'s on your heart today…',
    testimony:  'Share how God has moved in your life…',
    prayer:     'Describe your prayer request so others can stand with you…',
    question:   'What question about faith or scripture is on your mind?',
    scripture:  'Share your thoughts on this scripture passage…',
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        {/* Nav header */}
        <View style={[s.navHeader, { borderBottomColor: t.divider }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color={t.text} />
          </TouchableOpacity>
          <Text style={[s.navTitle, { color: t.text }]}>New Post</Text>
          <TouchableOpacity
            style={[s.postBtn, { backgroundColor: canPost ? t.gold : t.filterInactiveBg }]}
            onPress={handlePost}
            activeOpacity={0.8}
            disabled={!canPost || posting}
          >
            {posting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={[s.postBtnText, { color: canPost ? '#fff' : t.textMuted }]}>Post</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {/* Type selector */}
          <Text style={[s.label, { color: t.textMuted }]}>POST TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.typeRow} contentContainerStyle={{ gap: 8 }}>
            {POST_TYPES.map(pt => {
              const m = POST_TYPE_META[pt];
              const active = type === pt;
              return (
                <TouchableOpacity
                  key={pt}
                  style={[
                    s.typeChip,
                    { backgroundColor: t.filterInactiveBg, borderColor: t.filterInactiveBorder },
                    active && { backgroundColor: (m.color || t.gold) + '22', borderColor: (m.color || t.gold) + '88' },
                  ]}
                  onPress={() => setType(pt)}
                  activeOpacity={0.75}
                >
                  {m.icon ? <Text style={{ fontSize: 14 }}>{m.icon}</Text> : null}
                  <Text style={[
                    s.typeChipText,
                    { color: t.textMuted },
                    active && { color: m.color || t.gold },
                  ]}>
                    {m.label || 'General'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Scripture reference (shown for scripture type) */}
          {type === 'scripture' && (
            <>
              <Text style={[s.label, { color: t.textMuted }]}>SCRIPTURE REFERENCE</Text>
              <TextInput
                style={[s.scriptureInput, { backgroundColor: t.card, borderColor: t.cardBorder, color: t.text }]}
                placeholder="e.g. John 3:16 or Romans 8:28"
                placeholderTextColor={t.textMuted}
                value={scripture}
                onChangeText={setScripture}
                returnKeyType="next"
                onSubmitEditing={() => contentRef.current?.focus()}
              />
            </>
          )}

          {/* Content */}
          <Text style={[s.label, { color: t.textMuted }]}>
            {type === 'prayer' ? 'PRAYER REQUEST' : type === 'testimony' ? 'YOUR TESTIMONY' : 'MESSAGE'}
          </Text>
          <TextInput
            ref={contentRef}
            style={[s.contentInput, { backgroundColor: t.card, borderColor: t.cardBorder, color: t.text }]}
            placeholder={PLACEHOLDERS[type]}
            placeholderTextColor={t.textMuted}
            value={content}
            onChangeText={setContent}
            multiline
            autoFocus={type !== 'scripture'}
            textAlignVertical="top"
          />

          {/* Character count */}
          <Text style={[s.charCount, { color: content.length > 500 ? '#C87B7B' : t.textMuted }]}>
            {content.length} / 600
          </Text>

          {/* Tips */}
          {type === 'prayer' && (
            <View style={[s.tip, { backgroundColor: '#7BA8C822', borderColor: '#7BA8C844' }]}>
              <Text style={{ fontSize: 13, color: '#7BA8C8', lineHeight: 20 }}>
                🙏 Be as specific as you're comfortable sharing. The community will pray with you.
              </Text>
            </View>
          )}
          {type === 'testimony' && (
            <View style={[s.tip, { backgroundColor: '#C9A96B22', borderColor: '#C9A96B44' }]}>
              <Text style={{ fontSize: 13, color: '#C9A96B', lineHeight: 20 }}>
                ✨ Testimonies encourage others. Share how God moved and give Him the glory!
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  navHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn:  { padding: 4 },
  navTitle: { flex: 1, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  postBtn:  {
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 18, minWidth: 60, alignItems: 'center',
  },
  postBtnText: { fontSize: 14, fontWeight: '700' },

  scroll: { padding: 20, paddingBottom: 80 },

  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 10 },

  typeRow: { marginBottom: 24 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  typeChipText: { fontSize: 13, fontWeight: '600' },

  scriptureInput: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, marginBottom: 24,
  },

  contentInput: {
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, lineHeight: 24,
    minHeight: 180, marginBottom: 8,
  },

  charCount: { fontSize: 11, textAlign: 'right', marginBottom: 20 },

  tip: {
    borderWidth: 1, borderRadius: 12,
    padding: 14,
  },
});
