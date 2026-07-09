import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Animated,
  Easing,
  Keyboard,
  StyleSheet,
  useColorScheme,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Override auto dark-mode detection */
  dark?: boolean;
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
  autoCorrect?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  /** Outer row style — use for margins */
  style?: ViewStyle;
  showCancel?: boolean;
  onCancelled?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

export default function GlassSearchBar({
  value,
  onChangeText,
  placeholder = 'Search…',
  dark,
  returnKeyType = 'search',
  onSubmitEditing,
  autoCorrect = false,
  autoCapitalize = 'none',
  style,
  showCancel = true,
  onCancelled,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
}: Props) {
  const scheme = useColorScheme();
  const isDark = dark !== undefined ? dark : scheme === 'dark';

  const [focused, setFocused] = useState(false);
  const cancelW = useRef(new Animated.Value(0)).current;
  const cancellingRef = useRef(false);

  // ── Visual tokens ────────────────────────────────────────────────────────
  const pillBg         = isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.07)';
  const border         = isDark ? 'rgba(255,210,120,0.30)' : 'rgba(180,140,60,0.25)';
  const borderFocused  = isDark ? 'rgba(255,210,120,0.60)' : 'rgba(180,140,60,0.55)';
  const iconColor      = isDark ? 'rgba(255,255,255,0.50)' : 'rgba(0,0,0,0.38)';
  const textColor      = isDark ? '#FFFFFF'                : '#1C1C1E';
  const phColor        = isDark ? 'rgba(255,255,255,0.36)' : 'rgba(0,0,0,0.28)';
  const cancelColor    = isDark ? '#FFFFFF'                : '#1C1C1E';

  const slide = (toValue: number, duration = 220) =>
    Animated.timing(cancelW, {
      toValue,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleFocus = () => {
    setFocused(true);
    onFocusProp?.();
    if (showCancel) slide(72).start();
  };

  const handleBlur = () => {
    if (cancellingRef.current) return;
    // Always clear the focused border — the TextInput has lost focus.
    // Only collapse the cancel button when the field is empty; if the user
    // still has search text, leave cancel visible so they can return to type.
    setFocused(false);
    onBlurProp?.();
    if (!value && showCancel) slide(0).start();
  };

  const handleCancel = () => {
    cancellingRef.current = true;
    setFocused(false);
    onBlurProp?.();
    onChangeText('');
    Keyboard.dismiss();
    onCancelled?.();
    if (showCancel) {
      slide(0).start(() => { cancellingRef.current = false; });
    } else {
      cancellingRef.current = false;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={[s.row, style]}>
      {/* Glass pill */}
      <View style={[
        s.pill,
        {
          backgroundColor: pillBg,
          borderColor: focused ? borderFocused : 'transparent',
        },
      ]}>
        <Ionicons name="search" size={16} color={iconColor} style={s.icon} />
        <TextInput
          style={[s.input, { color: textColor }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={phColor}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoCorrect={autoCorrect}
          autoCapitalize={autoCapitalize}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => onChangeText('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={16} color={iconColor} />
          </TouchableOpacity>
        )}
      </View>

      {/* Cancel button — springs in/out */}
      {showCancel && (
        <Animated.View style={{ width: cancelW, overflow: 'hidden' }}>
          <TouchableOpacity style={s.cancelBtn} onPress={handleCancel}>
            <Text style={[s.cancelText, { color: cancelColor }]}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  cancelBtn: {
    paddingLeft: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '400',
  },
});
