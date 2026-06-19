import React, { useRef, useState, useEffect, useCallback } from 'react';
import { TouchableOpacity, Text, Animated, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme';

// Same key used by chatService — single source of truth for display name
const DISPLAY_NAME_KEY = '@chat_display_name';

type Props = {
  size?: number;
  onPress?: () => void;
};

export default function ProfileAvatar({ size = 40, onPress }: Props) {
  const t = useTheme();
  const [initial, setInitial] = useState('J');
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem(DISPLAY_NAME_KEY).then(name => {
      if (name?.trim()) setInitial(name.trim()[0].toUpperCase());
    });
  }, []);

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
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={[
          s.circle,
          {
            width: size,
            height: size,
            borderRadius: r,
            backgroundColor: t.filterInactiveBg,
            borderColor: t.filterInactiveBorder,
          },
        ]}
      >
        <Text style={[s.letter, { color: t.gold, fontSize }]}>{initial}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  circle: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
