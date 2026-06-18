import { useState } from 'react';
import * as Speech from 'expo-speech';
import { Share } from 'react-native';
import { FontSize, FONT_SIZE_MAP, Devotion } from '../types/devotion';

export function useDevotionReader(devotion: Devotion | null) {
  const [fontSz, setFontSz] = useState<FontSize>('md');
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  function cycleFontSize() {
    const order: FontSize[] = ['sm', 'md', 'lg', 'xl'];
    setFontSz(prev => order[(order.indexOf(prev) + 1) % order.length]);
  }

  function toggleTTS() {
    if (!devotion) return;
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    const text = [
      `${devotion.scriptureReference}. ${devotion.scriptureText}`,
      ...devotion.devotionalBody,
      `Life application. ${devotion.lifeApplication}`,
    ].join(' ');
    setSpeaking(true);
    Speech.speak(text, {
      language: 'en',
      pitch: 1.0,
      rate: 0.88,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }

  function stopTTS() {
    Speech.stop();
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
