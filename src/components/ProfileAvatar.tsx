import React, { useRef, useState, useEffect, useCallback } from 'react';
import { TouchableOpacity, Text, Image, Animated, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import { useProfilePicture } from '../context/ProfileContext';

const DISPLAY_NAME_KEY = '@chat_display_name';

type Props = {
  size?: number;
  onPress?: () => void;
};

export default function ProfileAvatar({ size = 40, onPress }: Props) {
  const t       = useTheme();
  const nav     = useNavigation<any>();
  const { picture } = useProfilePicture();

  const [initial, setInitial] = useState('J');
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem(DISPLAY_NAME_KEY).then(name => {
      if (name?.trim()) setInitial(name.trim()[0].toUpperCase());
    });
  }, []);

  const handlePress = useCallback(() => {
    if (onPress) { onPress(); return; }
    nav.navigate('ProfileModal');
  }, [onPress, nav]);

  const onPressIn = useCallback(() => {
    Animated.timing(scale, { toValue: 0.88, duration: 80, useNativeDriver: true }).start();
  }, [scale]);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, tension: 260, friction: 12, useNativeDriver: true }).start();
  }, [scale]);

  const r = size / 2;
  const fontSize = Math.round(size * 0.38);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={[
          s.circle,
          {
            width: size, height: size, borderRadius: r,
            backgroundColor:
              picture?.type === 'avatar'
                ? picture.avatar.bg
                : t.filterInactiveBg,
            borderColor:
              picture?.type === 'photo'
                ? 'rgba(201,169,107,0.5)'
                : picture?.type === 'avatar'
                ? 'rgba(255,255,255,0.18)'
                : t.filterInactiveBorder,
          },
        ]}
      >
        {picture?.type === 'photo' ? (
          <Image
            source={{ uri: picture.uri }}
            style={{ width: size, height: size, borderRadius: r }}
          />
        ) : picture?.type === 'avatar' ? (
          <Text style={{ fontSize: Math.round(size * 0.46) }}>{picture.avatar.emoji}</Text>
        ) : (
          <Text style={[s.letter, { color: t.gold, fontSize }]}>{initial}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  circle: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  letter: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
