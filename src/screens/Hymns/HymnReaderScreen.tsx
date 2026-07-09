import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Share, ActivityIndicator, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { useTheme } from '../../theme';
import { getHymnById } from '../../services/hymnService';
import { resolveHymnAudio, type ResolvedAudio } from '../../services/hymnAudioResolver';
import { useFavorites } from '../../hooks/useFavorites';
import { RootStackParamList } from '../../types/navigation';

type ReaderRoute = RouteProp<RootStackParamList, 'HymnReader'>;
type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'buffering' | 'error';

const THUMB_SIZE = 12;
const GOLD  = '#C9A96B';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function HymnReaderScreen() {
  const t          = useTheme();
  const navigation = useNavigation();
  const route      = useRoute<ReaderRoute>();
  const insets     = useSafeAreaInsets();
  const { hymnId } = route.params;

  const isDark     = t.statusBar === 'light-content';
  const rootBg     = isDark ? '#060810' : '#DDD5C4';
  const textColor  = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(24,18,8,0.92)';
  const subColor   = isDark ? 'rgba(255,255,255,0.62)' : 'rgba(24,18,8,0.62)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(24,18,8,0.36)';
  const divColor   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const glass      = isDark
    ? { backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }
    : { backgroundColor: 'rgba(255,255,255,0.68)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)' };

  const hymn = getHymnById(hymnId);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(hymnId);

  const [resolved,     setResolved]     = useState<ResolvedAudio | null>(null);
  const [resolving,    setResolving]    = useState(true);
  const [playerState,  setPlayerState]  = useState<PlayerState>('idle');
  const [positionMs,   setPositionMs]   = useState(0);
  const [durationMs,   setDurationMs]   = useState(0);
  const [repeat,       setRepeat]       = useState(false);
  const [trackWidth,   setTrackWidth]   = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let alive = true;
    setResolving(true);
    setResolved(null);
    setPlayerState('idle');
    setPositionMs(0);
    setDurationMs(0);
    soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;
    resolveHymnAudio(hymnId).then(r => {
      if (alive) { setResolved(r); setResolving(false); }
    });
    return () => {
      alive = false;
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    };
  }, [hymnId]);

  const onPlaybackStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if ((status as any).error) setPlayerState('error');
      return;
    }
    setPositionMs(status.positionMillis);
    setDurationMs(status.durationMillis ?? 0);
    if (status.isBuffering && !status.isPlaying) {
      setPlayerState('buffering');
    } else if (status.isPlaying) {
      setPlayerState('playing');
    }
    if (status.didJustFinish) {
      if (repeat) {
        soundRef.current?.replayAsync().catch(() => {});
      } else {
        setPlayerState('idle');
        setPositionMs(0);
        soundRef.current?.setPositionAsync(0).catch(() => {});
      }
    }
  }, [repeat]);

  useEffect(() => {
    soundRef.current?.setOnPlaybackStatusUpdate(onPlaybackStatus);
  }, [onPlaybackStatus]);

  const handlePlay = useCallback(async () => {
    if (!resolved || resolved.type === 'none') return;
    try {
      if (playerState === 'paused' && soundRef.current) {
        await soundRef.current.playAsync();
        return;
      }
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setPlayerState('loading');
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
      const { sound } = await Audio.Sound.createAsync(
        resolved.source,
        { shouldPlay: true },
        onPlaybackStatus,
      );
      soundRef.current = sound;
    } catch (err) {
      if (__DEV__) console.error('[HymnPlayer]', err);
      setPlayerState('error');
    }
  }, [resolved, playerState, onPlaybackStatus]);

  const handlePause = useCallback(async () => {
    await soundRef.current?.pauseAsync().catch(() => {});
    setPlayerState('paused');
  }, []);

  const handleStop = useCallback(async () => {
    if (!soundRef.current) return;
    await soundRef.current.stopAsync().catch(() => {});
    await soundRef.current.setPositionAsync(0).catch(() => {});
    setPlayerState('idle');
    setPositionMs(0);
  }, []);

  const handleRetry = useCallback(() => {
    setResolving(true);
    setResolved(null);
    resolveHymnAudio(hymnId).then(r => { setResolved(r); setResolving(false); });
  }, [hymnId]);

  const handleSeekTouch = useCallback((e: any) => {
    if (!durationMs || !trackWidth) return;
    const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / trackWidth));
    const ms = ratio * durationMs;
    setPositionMs(ms);
    soundRef.current?.setPositionAsync(ms).catch(() => {});
  }, [durationMs, trackWidth]);

  const handleShare = useCallback(async () => {
    if (!hymn) return;
    const lines = [
      hymn.title,
      `— ${hymn.author}, ${hymn.year}`,
      '',
      ...hymn.verses.flatMap((v, i) => [`Verse ${i + 1}`, ...v.lines, '']),
      ...(hymn.chorus ? ['Chorus', ...hymn.chorus.lines] : []),
    ].join('\n');
    Share.share({ message: lines });
  }, [hymn]);

  const progress  = durationMs > 0 ? positionMs / durationMs : 0;
  const fillWidth = trackWidth > 0 ? progress * trackWidth : 0;
  const thumbLeft = trackWidth > 0
    ? Math.max(0, Math.min(trackWidth - THUMB_SIZE, progress * trackWidth - THUMB_SIZE / 2))
    : 0;
  const hasAudio  = !resolving && resolved !== null && resolved.type !== 'none';
  const isPlaying = playerState === 'playing' || playerState === 'buffering';
  const isLoading = playerState === 'loading' || playerState === 'buffering';
  const showBar   = resolving || hasAudio ||
    (resolved?.type === 'none' && resolved.reason === 'network-error');

  if (!hymn) {
    return (
      <View style={{ flex: 1, backgroundColor: rootBg, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Text style={{ color: mutedColor, fontSize: 15 }}>Hymn not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: GOLD, marginTop: 12 }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: rootBg }}>
      <StatusBar barStyle={t.statusBar} backgroundColor="transparent" translucent />

      {/* Nav row */}
      <View style={[s.navRow, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity
          style={[s.navBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={textColor} />
        </TouchableOpacity>

        <View style={s.navRight}>
          <TouchableOpacity
            style={[s.navBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}
            onPress={() => toggleFavorite(hymnId)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={favorited ? 'heart' : 'heart-outline'}
              size={18}
              color={favorited ? '#E05C5C' : mutedColor}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.navBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}
            onPress={handleShare}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={18} color={mutedColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Player bar */}
      {showBar && (
        <View style={[s.playerBar, glass, {
          marginHorizontal: 18, marginBottom: 6,
          shadowColor: isDark ? '#000' : 'rgba(47,42,36,0.10)',
          shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.18 : 1, shadowRadius: 10, elevation: 4,
        }]}>
          {resolving && (
            <View style={s.barCenter}>
              <ActivityIndicator size="small" color={GOLD} />
              <Text style={[s.barStatusText, { color: mutedColor }]}>Loading…</Text>
            </View>
          )}
          {!resolving && !hasAudio && (
            <View style={s.barCenter}>
              <Ionicons name="musical-notes-outline" size={14} color={mutedColor} />
              <Text style={[s.barStatusText, { color: mutedColor }]}>Could not load audio.</Text>
              <TouchableOpacity onPress={handleRetry} activeOpacity={0.7}>
                <Text style={[s.barStatusText, { color: GOLD, fontWeight: '600' }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          {!resolving && hasAudio && (
            <>
              <TouchableOpacity
                onPress={() => setRepeat(r => !r)}
                style={s.barBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons name="repeat" size={17} color={repeat ? GOLD : mutedColor} />
                {repeat && <View style={[s.repeatDot, { backgroundColor: GOLD }]} />}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleStop}
                disabled={playerState === 'idle'}
                style={[s.barBtn, { opacity: playerState === 'idle' ? 0.25 : 1 }]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons name="stop" size={17} color={textColor} />
              </TouchableOpacity>
              <Text style={[s.barTime, { color: mutedColor }]}>{formatMs(positionMs)}</Text>
              <View
                style={[s.barTrack, { backgroundColor: divColor }]}
                onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
                onStartShouldSetResponder={() => durationMs > 0}
                onMoveShouldSetResponder={() => durationMs > 0}
                onResponderGrant={handleSeekTouch}
                onResponderMove={handleSeekTouch}
              >
                <View style={[s.barFill, { backgroundColor: GOLD, width: fillWidth }]} />
                {trackWidth > 0 && (
                  <View style={[s.barThumb, { backgroundColor: GOLD, left: thumbLeft }]} />
                )}
              </View>
              <Text style={[s.barTime, { color: mutedColor, textAlign: 'right' }]}>
                {durationMs > 0 ? formatMs(durationMs) : '--:--'}
              </Text>
              <TouchableOpacity
                onPress={isPlaying ? handlePause : (playerState === 'error' ? () => setPlayerState('idle') : handlePlay)}
                disabled={isLoading}
                style={s.barBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={GOLD} />
                ) : playerState === 'error' ? (
                  <Ionicons name="refresh" size={18} color="#C87B7B" />
                ) : isPlaying ? (
                  <Ionicons name="pause" size={18} color={textColor} />
                ) : (
                  <Ionicons name="play" size={18} color={textColor} />
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Lyrics */}
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: Math.max(insets.bottom, 16) + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.hymnHeader}>
          {/* Number badge */}
          <View style={[s.numberBadge, { backgroundColor: 'rgba(201,169,107,0.12)', borderColor: 'rgba(201,169,107,0.30)' }]}>
            <Text style={s.numberText}>#{hymn.number}</Text>
          </View>
          <Text style={[s.title, { color: textColor, fontFamily: SERIF }]}>{hymn.title}</Text>
          <Text style={[s.meta, { color: subColor }]}>{hymn.author} · {hymn.year}</Text>

          <View style={s.tagRow}>
            <View style={[s.catTag, { backgroundColor: 'rgba(201,169,107,0.10)', borderColor: 'rgba(201,169,107,0.28)' }]}>
              <Text style={[s.catTagText, { color: GOLD }]}>{hymn.category}</Text>
            </View>
            {hymn.tags.map(tag => (
              <View key={tag} style={[s.tag, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.09)' }]}>
                <Text style={[s.tagText, { color: mutedColor }]}>{tag}</Text>
              </View>
            ))}
          </View>

          <View style={[s.rule, { backgroundColor: divColor }]} />
        </View>

        <View style={s.lyrics}>
          {hymn.verses.map((verse, vi) => (
            <View key={vi} style={s.verseBlock}>
              <Text style={[s.verseLabel, { color: mutedColor }]}>
                {hymn.verses.length > 1 ? `Verse ${vi + 1}` : 'Verse'}
              </Text>
              {verse.lines.map((line, li) => (
                <Text key={li} style={[s.verseLine, { color: textColor, fontFamily: SERIF }]}>
                  {line}
                </Text>
              ))}
              {hymn.chorus && vi < hymn.verses.length - 1 && (
                <View style={[s.chorusBlock, { borderLeftColor: GOLD }]}>
                  <Text style={[s.chorusLabel, { color: GOLD }]}>Chorus</Text>
                  {hymn.chorus.lines.map((line, li) => (
                    <Text key={li} style={[s.chorusLine, { color: subColor, fontFamily: SERIF }]}>
                      {line}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}

          {hymn.chorus && (
            <View style={[s.chorusBlock, { borderLeftColor: GOLD }]}>
              <Text style={[s.chorusLabel, { color: GOLD }]}>Chorus</Text>
              {hymn.chorus.lines.map((line, li) => (
                <Text key={li} style={[s.chorusLine, { color: subColor, fontFamily: SERIF }]}>
                  {line}
                </Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingBottom: 10,
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  playerBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
    gap: 6,
  },
  barCenter:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  barStatusText: { fontSize: 12 },
  barBtn:        { paddingHorizontal: 8, paddingVertical: 6, alignItems: 'center', justifyContent: 'center' },
  barTime:       { fontSize: 11, fontVariant: ['tabular-nums'], minWidth: 32 },
  barTrack:      { flex: 1, height: 3, borderRadius: 2, overflow: 'visible' },
  barFill:       { height: '100%', borderRadius: 2 },
  barThumb: {
    position: 'absolute', width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: THUMB_SIZE / 2,
    top: -(THUMB_SIZE / 2 - 1.5),
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
  repeatDot: { width: 4, height: 4, borderRadius: 2, position: 'absolute', bottom: 2 },

  scroll: { paddingHorizontal: 24, paddingTop: 16 },

  hymnHeader: { marginBottom: 24 },
  numberBadge: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12,
  },
  numberText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: GOLD },
  title:      { fontSize: 28, fontWeight: '400', letterSpacing: -0.4, lineHeight: 36, marginBottom: 6 },
  meta:       { fontSize: 13, marginBottom: 14 },
  tagRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catTag:     { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  catTagText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  tag:        { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tagText:    { fontSize: 10, fontWeight: '600', letterSpacing: 0.6 },
  rule:       { height: 1 },

  lyrics:     { gap: 28 },
  verseBlock: { gap: 4 },
  verseLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 6 },
  verseLine:  { fontSize: 17, lineHeight: 30, letterSpacing: 0.1 },

  chorusBlock: { borderLeftWidth: 3, paddingLeft: 14, marginTop: 14, gap: 4 },
  chorusLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 4 },
  chorusLine:  { fontSize: 16, lineHeight: 28, fontStyle: 'italic', letterSpacing: 0.1 },
});
