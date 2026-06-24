import { useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { Share } from 'react-native';
import { FontSize, FONT_SIZE_MAP, Devotion } from '../types/devotion';
import { speakText } from '../services/ttsService';

export function useDevotionReader(devotion: Devotion | null) {
  const [fontSz, setFontSz] = useState<FontSize>('md');
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    };
  }, []);

  function cycleFontSize() {
    const order: FontSize[] = ['sm', 'md', 'lg', 'xl'];
    setFontSz(prev => order[(order.indexOf(prev) + 1) % order.length]);
  }

  async function toggleTTS() {
    if (!devotion) return;
    if (speaking) {
      await soundRef.current?.stopAsync().catch(() => {});
      await soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
      setSpeaking(false);
      return;
    }
    const text = [
      `${devotion.scriptureReference}. ${devotion.scriptureText}`,
      ...devotion.devotionalBody,
      `Life application. ${devotion.lifeApplication}`,
    ].join(' ');
    setSpeaking(true);
    try {
      const sound = await speakText(text, `devotion-${devotion.scriptureReference}`);
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          setSpeaking(false);
          soundRef.current?.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      });
    } catch {
      setSpeaking(false);
    }
  }

  async function stopTTS() {
    await soundRef.current?.stopAsync().catch(() => {});
    await soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;
    setSpeaking(false);
  }

  async function shareScripture() {
    if (!devotion) return;
    try {
      await Share.share({
        message: `${devotion.scriptureReference}\n\n"${devotion.scriptureText}"\n\n${devotion.shareableQuote}`,
        title: devotion.title,
      });
    } catch {}
  }

  async function copyScripture() {
    if (!devotion) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
    try {
      await Share.share({
        message: `${devotion.scriptureReference} — "${devotion.scriptureText}"`,
      });
    } catch {}
  }

  return {
    fontSz,
    fontSize: FONT_SIZE_MAP[fontSz],
    cycleFontSize,
    speaking,
    toggleTTS,
    stopTTS,
    shareScripture,
    copyScripture,
    copied,
  };
}
