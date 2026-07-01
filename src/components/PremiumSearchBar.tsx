import React, { useRef, useState, useCallback } from 'react';
import {
  View, TextInput, TouchableOpacity, Animated, Keyboard,
  StyleSheet, type TextInputProps, type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

export const SEARCH_BAR_H      = 44;
export const SEARCH_ROW_VPAD   = 8;
export const SEARCH_ROW_TOTAL  = SEARCH_BAR_H + SEARCH_ROW_VPAD * 2; // 60

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Called when search mode activates or exits — use to collapse/expand parent header */
  onActiveChange?: (active: boolean) => void;
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  style?: ViewStyle;
};

export default function PremiumSearchBar({
  value,
  onChangeText,
  placeholder = 'Search…',
  onActiveChange,
  returnKeyType = 'search',
  onSubmitEditing,
  autoCapitalize = 'none',
  style,
}: Props) {
  const t = useTheme();
  const [active, setActive] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Single animated value drives: back-arrow width, back-arrow opacity, back-arrow slide
  // useNativeDriver: false because width is not supported by native driver
  const anim = useRef(new Animated.Value(0)).current;

  const run = (toValue: number) =>
    Animated.timing(anim, { toValue, duration: 250, useNativeDriver: false }).start();

  const activate = useCallback(() => {
    if (active) return;
    setActive(true);
    onActiveChange?.(true);
    run(1);
    // Small delay lets the animation start before the keyboard appears
    setTimeout(() => inputRef.current?.focus(), 40);
  }, [active, onActiveChange]);

  const deactivate = useCallback(() => {
    onChangeText('');
    Keyboard.dismiss();
    setActive(false);
    onActiveChange?.(false);
    run(0);
  }, [onChangeText, onActiveChange]);

  // Back-arrow animates from hidden (width: 0) to visible (width: 40)
  const arrowWidth = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });
  // Opacity lags slightly so the width opens first, then icon fades in
  const arrowOp    = anim.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, 0, 1] });
  const arrowSlide = anim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] });

  return (
    <View style={[s.row, style]}>
      {/* ── Back arrow ─────────────────────────────────────────────────────── */}
      <Animated.View
        style={{
          width: arrowWidth,
          opacity: arrowOp,
          transform: [{ translateX: arrowSlide }],
          overflow: 'hidden',
        }}
      >
        <TouchableOpacity
          onPress={deactivate}
          style={s.back}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 4 }}
        >
          <Ionicons name="chevron-back" size={22} color={t.gold} />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Glass pill ─────────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[
          s.pill,
          {
            backgroundColor: t.filterInactiveBg,
            borderColor: active ? t.gold + '66' : t.filterInactiveBorder,
          },
        ]}
        onPress={!active ? activate : undefined}
        activeOpacity={active ? 1 : 0.78}
      >
        <Ionicons
          name="search-outline"
          size={15}
          color={active ? t.textSub : t.textMuted}
        />

        <TextInput
          ref={inputRef}
          style={[s.input, { color: t.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t.textMuted}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => { if (!active) activate(); }}
          autoCorrect={false}
          autoCapitalize={autoCapitalize}
        />

        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => onChangeText('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={15} color={t.textMuted} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: SEARCH_ROW_VPAD,
  },
  back: {
    width: 32,
    height: SEARCH_BAR_H,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    height: SEARCH_BAR_H,
    borderRadius: SEARCH_BAR_H / 2,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
});
