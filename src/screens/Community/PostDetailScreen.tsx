import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { subscribeToComments, addComment, reactToPost, prayForPost, markAnswered } from '../../services/communityService';
import { SAMPLE_POSTS } from '../../types/community';
import { REACTIONS, REACTION_META, POST_TYPE_META } from '../../types/community';
import type { Post, Comment, ReactionType } from '../../types/community';
import { CommunityStackParamList } from '../../types/navigation';

type RoutePropType = RouteProp<CommunityStackParamList, 'PostDetail'>;

function relativeTime(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function PostDetailScreen() {
  const t = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RoutePropType>();
  const { postId } = route.params;

  const [post,      setPost]      = useState<Post | null>(null);
  const [comments,  setComments]  = useState<Comment[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [reply,     setReply]     = useState('');
  const [sending,   setSending]   = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Load post from sample data (would be Firestore in production)
    const found = SAMPLE_POSTS.find(p => p.id === postId);
    if (found) setPost(found);

    unsubRef.current = subscribeToComments(postId, (data) => {
      setComments(data);
      setLoading(false);
    });
    return () => { unsubRef.current?.(); };
  }, [postId]);

  const handleReact = useCallback(async (reaction: ReactionType) => {
    if (!post) return;
    await reactToPost(postId, reaction);
    setPost(prev => {
      if (!prev) return prev;
      const prev2 = prev.userReaction;
      const newReactions = { ...prev.reactions };
      if (prev2 === reaction) {
        newReactions[prev2] = Math.max(0, newReactions[prev2] - 1);
        return { ...prev, reactions: newReactions, userReaction: undefined };
      }
      if (prev2) newReactions[prev2] = Math.max(0, newReactions[prev2] - 1);
      newReactions[reaction] = (newReactions[reaction] ?? 0) + 1;
      return { ...prev, reactions: newReactions, userReaction: reaction };
    });
    setShowReactions(false);
  }, [post, postId]);

  const handlePray = useCallback(async () => {
    if (!post) return;
    const wasNew = await prayForPost(postId);
    if (wasNew) setPost(prev => prev ? { ...prev, prayerCount: prev.prayerCount + 1, userPraying: true } : prev);
  }, [post, postId]);

  const handleSend = useCallback(async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    const text = reply.trim();
    setReply('');
    inputRef.current?.blur();
    try {
      await addComment(postId, text);
      setPost(prev => prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev);
    } catch {
      setReply(text);
    } finally {
      setSending(false);
    }
  }, [reply, sending, postId]);

  const totalReactions = post ? Object.values(post.reactions).reduce((a, b) => a + b, 0) : 0;

  const renderComment = useCallback(({ item }: { item: Comment }) => (
    <View style={[cm.bubble, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
      <View style={cm.row}>
        <View style={[cm.avatar, { backgroundColor: item.authorColor + '33', borderColor: item.authorColor + '66' }]}>
          <Text style={[cm.avatarLetter, { color: item.authorColor }]}>{item.authorName.charAt(0)}</Text>
        </View>
        <View style={cm.info}>
          <Text style={[cm.name, { color: t.text }]}>{item.authorName}</Text>
          <Text style={[cm.time, { color: t.textMuted }]}>{relativeTime(item.createdAt)}</Text>
        </View>
      </View>
      <Text style={[cm.content, { color: t.textSub }]}>{item.content}</Text>
    </View>
  ), [t]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

        {/* Nav header */}
        <View style={[s.navHeader, { borderBottomColor: t.divider }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={t.text} />
          </TouchableOpacity>
          <Text style={[s.navTitle, { color: t.text }]}>Post</Text>
          <View style={{ width: 32 }} />
        </View>

        <FlatList
          data={comments}
          keyExtractor={c => c.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={post ? (
            <View>
              {/* Post body */}
              <View style={[s.postCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
                {/* Author */}
                <View style={s.authorRow}>
                  <View style={[s.avatar, { backgroundColor: post.authorColor + '33', borderColor: post.authorColor + '66' }]}>
                    <Text style={[s.avatarLetter, { color: post.authorColor }]}>{post.authorName.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.authorName, { color: t.text }]}>{post.authorName}</Text>
                    <Text style={[s.timeText, { color: t.textMuted }]}>{relativeTime(post.createdAt)}</Text>
                  </View>
                  {POST_TYPE_META[post.type].label ? (
                    <View style={[s.typeBadge, {
                      backgroundColor: POST_TYPE_META[post.type].color + '22',
                      borderColor: POST_TYPE_META[post.type].color + '55',
                    }]}>
                      <Text style={{ fontSize: 11 }}>{POST_TYPE_META[post.type].icon}</Text>
                      <Text style={[s.typeBadgeText, { color: POST_TYPE_META[post.type].color }]}>
                        {POST_TYPE_META[post.type].label}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Scripture ref */}
                {post.scriptureRef ? (
                  <View style={[s.scriptureRef, { backgroundColor: t.goldBg, borderColor: t.goldBorder }]}>
                    <Text>📖</Text>
                    <Text style={[s.scriptureText, { color: t.gold }]}>{post.scriptureRef}</Text>
                  </View>
                ) : null}

                {/* Content */}
                <Text style={[s.content, { color: t.textSub }]}>{post.content}</Text>

                {/* Answered */}
                {post.answered && (
                  <View style={[s.answeredBadge, { backgroundColor: '#7BA87B22', borderColor: '#7BA87B55' }]}>
                    <Text style={{ color: '#7BA87B', fontWeight: '700' }}>✓ Prayer Answered!</Text>
                  </View>
                )}

                {/* Reaction summary */}
                {totalReactions > 0 && (
                  <View style={[s.reactionSummary, { borderTopColor: t.divider }]}>
                    {Object.entries(post.reactions)
                      .filter(([, v]) => v > 0)
                      .map(([k, v]) => (
                        <View key={k} style={s.reactionCount}>
                          <Text style={{ fontSize: 14 }}>{REACTION_META[k as ReactionType].emoji}</Text>
                          <Text style={[s.reactionCountText, { color: t.textMuted }]}>{v}</Text>
                        </View>
                      ))}
                  </View>
                )}

                {/* Action row */}
                <View style={[s.actionRow, { borderTopColor: t.divider }]}>
                  <TouchableOpacity
                    style={[s.actionBtn, post.userReaction && { backgroundColor: t.goldBg }]}
                    onPress={() => setShowReactions(v => !v)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 16 }}>
                      {post.userReaction ? REACTION_META[post.userReaction].emoji : '❤️'}
                    </Text>
                    <Text style={[s.actionLabel, { color: post.userReaction ? t.gold : t.textMuted }]}>
                      {post.userReaction ? 'Liked' : 'React'}
                    </Text>
                  </TouchableOpacity>

                  {post.type === 'prayer' && (
                    <TouchableOpacity
                      style={[s.actionBtn, post.userPraying && { backgroundColor: '#7BA8C822' }]}
                      onPress={handlePray}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 16 }}>🙏</Text>
                      <Text style={[s.actionLabel, { color: post.userPraying ? '#7BA8C8' : t.textMuted }]}>
                        {post.userPraying ? 'Praying' : `Pray (${post.prayerCount})`}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={s.actionBtn}
                    onPress={() => inputRef.current?.focus()}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chatbubble-outline" size={17} color={t.textMuted} />
                    <Text style={[s.actionLabel, { color: t.textMuted }]}>
                      {post.commentCount} Comments
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Reaction picker */}
                {showReactions && (
                  <View style={[s.reactionPicker, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
                    {REACTIONS.map(([key, r]) => (
                      <TouchableOpacity
                        key={key}
                        style={[s.reactionPickerBtn, post.userReaction === key && { backgroundColor: t.goldBg }]}
                        onPress={() => handleReact(key)}
                      >
                        <Text style={{ fontSize: 22 }}>{r.emoji}</Text>
                        <Text style={[s.reactionPickerLabel, { color: t.textMuted }]}>{r.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Comments header */}
              <Text style={[s.commentsHeader, { color: t.textMuted }]}>
                {loading ? 'Loading comments…' : `${comments.length} Comment${comments.length !== 1 ? 's' : ''}`}
              </Text>
              {loading && <ActivityIndicator color={t.gold} style={{ marginBottom: 16 }} />}
            </View>
          ) : undefined}
          ListEmptyComponent={!loading ? (
            <View style={s.emptyComments}>
              <Text style={[s.emptyText, { color: t.textMuted }]}>
                Be the first to comment 💬
              </Text>
            </View>
          ) : null}
          renderItem={renderComment}
        />

        {/* Reply input */}
        <View style={[s.replyBar, { backgroundColor: t.bg, borderTopColor: t.divider }]}>
          <TextInput
            ref={inputRef}
            style={[s.replyInput, { backgroundColor: t.card, borderColor: t.cardBorder, color: t.text }]}
            placeholder="Add a comment…"
            placeholderTextColor={t.textMuted}
            value={reply}
            onChangeText={setReply}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[s.sendBtn, { backgroundColor: reply.trim() ? t.gold : t.filterInactiveBg }]}
            onPress={handleSend}
            disabled={!reply.trim() || sending}
            activeOpacity={0.8}
          >
            {sending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="send" size={18} color={reply.trim() ? '#fff' : t.textMuted} />
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const cm = StyleSheet.create({
  bubble: {
    borderRadius: 14, borderWidth: 1,
    padding: 14, marginBottom: 10,
  },
  row:          { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar:       { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 13, fontWeight: '700' },
  info:         { flex: 1 },
  name:         { fontSize: 13, fontWeight: '700' },
  time:         { fontSize: 11 },
  content:      { fontSize: 14, lineHeight: 21 },
});

const s = StyleSheet.create({
  navHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn:  { padding: 4 },
  navTitle: { flex: 1, fontSize: 18, fontWeight: '700', textAlign: 'center' },

  list: { paddingHorizontal: 18, paddingBottom: 20 },

  postCard: {
    borderRadius: 16, borderWidth: 1,
    padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 18, fontWeight: '700' },
  authorName:   { fontSize: 15, fontWeight: '700' },
  timeText:     { fontSize: 12, marginTop: 2 },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  scriptureRef: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
    marginBottom: 12,
  },
  scriptureText:  { fontSize: 13, fontWeight: '700' },
  content:        { fontSize: 15, lineHeight: 24 },
  answeredBadge:  {
    marginTop: 10, borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start',
  },
  reactionSummary: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    borderTopWidth: 1, paddingTop: 12, marginTop: 12,
  },
  reactionCount:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reactionCountText:  { fontSize: 13 },
  actionRow:  {
    flexDirection: 'row', gap: 4,
    borderTopWidth: 1, paddingTop: 12, marginTop: 12,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, borderRadius: 10,
  },
  actionLabel: { fontSize: 12, fontWeight: '600' },
  reactionPicker: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    borderWidth: 1, borderRadius: 16,
    padding: 8, marginTop: 8,
  },
  reactionPickerBtn: { alignItems: 'center', padding: 8, borderRadius: 12, gap: 2 },
  reactionPickerLabel: { fontSize: 10 },

  commentsHeader: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 12 },
  emptyComments:  { paddingVertical: 32, alignItems: 'center' },
  emptyText:      { fontSize: 14 },

  replyBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1,
  },
  replyInput: {
    flex: 1, borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
});
