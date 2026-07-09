import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  StatusBar, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { createPost } from '../../services/communityService';
import { POST_TYPE_META } from '../../types/community';
import type { PostType } from '../../types/community';
import { CommunityStackParamList } from '../../types/navigation';

type RoutePropType = RouteProp<CommunityStackParamList, 'CreatePost'>;

const GOLD  = '#C9A96B';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const POST_TYPES: PostType[] = ['post', 'testimony', 'prayer', 'question', 'scripture'];

const TYPE_COLORS: Record<PostType, string> = {
  post:      '#7B9BC8',
  testimony: GOLD,
  prayer:    '#C47B8A',
  question:  '#7BA8C8',
  scripture: '#7BA87B',
};

export default function CreatePostScreen() {
  const t          = useTheme();
  const navigation = useNavigation();
  const route      = useRoute<RoutePropType>();
  const insets     = useSafeAreaInsets();

  const isDark    = t.statusBar === 'light-content';
  const rootBg    = isDark ? '#060810' : '#DDD5C4';
  const textColor = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const subColor  = isDark ? 'rgba(255,255,255,0.60)' : 'rgba(24,18,8,0.60)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(24,18,8,0.07)';

  const glassInput = {
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.85)',
  };

  const [type,       setType]      = useState<PostType>(route.params?.type ?? 'post');
  const [content,    setContent]   = useState('');
  const [scripture,  setScripture] = useState('');
  const [posting,    setPosting]   = useState(false);
  const contentRef = useRef<TextInput>(null);

  const canPost  = content.trim().length >= 10;
  const typeMeta = POST_TYPE_META[type];
  const typeColor = TYPE_COLORS[type];

  const PLACEHOLDERS: Record<PostType, string> = {
    post:      "Share what's on your heart today…",
    testimony: 'Share how God has moved in your life…',
    prayer:    'Describe your prayer request so others can stand with you…',
    question:  'What question about faith or scripture is on your mind?',
    scripture: 'Share your thoughts on this scripture passage…',
  };

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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: rootBg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

      {/* Nav header */}
      <View style={[s.navHeader, { paddingTop: insets.top + 6, borderBottomColor: dividerColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.closeBtn} activeOpacity={0.7}>
          <View style={[s.closeCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <Ionicons name="close" size={20} color={isDark ? 'rgba(255,255,255,0.85)' : 'rgba(24,18,8,0.85)'} />
          </View>
        </TouchableOpacity>

        <Text style={[s.navTitle, { color: textColor, fontFamily: SERIF }]}>New Post</Text>

        <TouchableOpacity
          style={[
            s.postBtn,
            { backgroundColor: canPost ? typeColor : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' },
          ]}
          onPress={handlePost}
          activeOpacity={0.8}
          disabled={!canPost || posting}
        >
          {posting
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={[s.postBtnText, { color: canPost ? '#08071A' : mutedColor }]}>Share</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Type selector */}
        <Text style={[s.label, { color: mutedColor }]}>POST TYPE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.typeRow} contentContainerStyle={{ gap: 8 }}>
          {POST_TYPES.map(pt => {
            const m      = POST_TYPE_META[pt];
            const color  = TYPE_COLORS[pt];
            const active = type === pt;
            return (
              <TouchableOpacity
                key={pt}
                style={[
                  s.typeChip,
                  { backgroundColor: active ? color + '1E' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    borderColor: active ? color + '88' : isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)' },
                ]}
                onPress={() => setType(pt)}
                activeOpacity={0.75}
              >
                {m.icon ? <Text style={{ fontSize: 14 }}>{m.icon}</Text> : null}
                <Text style={[s.typeChipText, { color: active ? color : subColor }]}>
                  {m.label || 'General'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Scripture reference */}
        {type === 'scripture' && (
          <>
            <Text style={[s.label, { color: mutedColor }]}>SCRIPTURE REFERENCE</Text>
            <TextInput
              style={[s.scriptureInput, glassInput, { color: textColor }]}
              placeholder="e.g. John 3:16 or Romans 8:28"
              placeholderTextColor={mutedColor}
              value={scripture}
              onChangeText={setScripture}
              returnKeyType="next"
              onSubmitEditing={() => contentRef.current?.focus()}
            />
          </>
        )}

        {/* Content */}
        <Text style={[s.label, { color: mutedColor }]}>
          {type === 'prayer' ? 'PRAYER REQUEST' : type === 'testimony' ? 'YOUR TESTIMONY' : 'MESSAGE'}
        </Text>
        <TextInput
          ref={contentRef}
          style={[
            s.contentInput,
            glassInput,
            {
              color: textColor,
              fontFamily: type === 'scripture' ? SERIF : undefined,
              fontSize: type === 'scripture' ? 16 : 15,
              lineHeight: type === 'scripture' ? 28 : 24,
            },
          ]}
          placeholder={PLACEHOLDERS[type]}
          placeholderTextColor={mutedColor}
          value={content}
          onChangeText={setContent}
          multiline
          autoFocus={type !== 'scripture'}
          textAlignVertical="top"
        />

        {/* Character count */}
        <Text style={[s.charCount, { color: content.length > 500 ? '#C87B7B' : mutedColor }]}>
          {content.length} / 600
        </Text>

        {/* Tips */}
        {type === 'prayer' && (
          <View style={[s.tip, { backgroundColor: '#7BA8C818', borderColor: '#7BA8C840' }]}>
            <Text style={{ fontSize: 13, color: '#7BA8C8', lineHeight: 20 }}>
              🙏 Be as specific as you're comfortable sharing. The community will pray with you.
            </Text>
          </View>
        )}
        {type === 'testimony' && (
          <View style={[s.tip, { backgroundColor: GOLD + '18', borderColor: GOLD + '40' }]}>
            <Text style={{ fontSize: 13, color: GOLD, lineHeight: 20 }}>
              ✨ Testimonies encourage others. Share how God moved and give Him the glory!
            </Text>
          </View>
        )}
        {type === 'scripture' && (
          <View style={[s.tip, { backgroundColor: '#7BA87B18', borderColor: '#7BA87B40' }]}>
            <Text style={{ fontSize: 13, color: '#7BA87B', lineHeight: 20 }}>
              📖 Share a passage that's speaking to you, and invite others into the conversation.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  navHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn:    { padding: 0 },
  closeCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  navTitle:    { flex: 1, fontSize: 20, fontWeight: '400', textAlign: 'center' },
  postBtn: {
    paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 20, minWidth: 66, alignItems: 'center',
  },
  postBtnText: { fontSize: 14, fontWeight: '700' },

  scroll: { padding: 20, paddingBottom: 80 },

  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 10 },

  typeRow: { marginBottom: 24 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 22, borderWidth: 1,
  },
  typeChipText: { fontSize: 13, fontWeight: '600' },

  scriptureInput: {
    borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, marginBottom: 24,
  },

  contentInput: {
    borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14,
    minHeight: 180, marginBottom: 8,
  },

  charCount: { fontSize: 11, textAlign: 'right', marginBottom: 20 },

  tip: { borderWidth: 1, borderRadius: 14, padding: 14 },
});
