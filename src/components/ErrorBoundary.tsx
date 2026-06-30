import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = { children: React.ReactNode; label?: string };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary]', this.props.label ?? 'unknown', error, info.componentStack);
    }
  }

  retry = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={s.wrap}>
        <Text style={s.title}>Something went wrong</Text>
        <Text style={s.msg} numberOfLines={4}>{error.message}</Text>
        <TouchableOpacity style={s.btn} onPress={this.retry} activeOpacity={0.8}>
          <Text style={s.btnLabel}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const s = StyleSheet.create({
  wrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#080A12' },
  title:   { fontSize: 18, fontWeight: '700', color: '#E8E2D8', marginBottom: 12, textAlign: 'center' },
  msg:     { fontSize: 13, color: 'rgba(232,226,216,0.55)', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  btn:     { backgroundColor: 'rgba(201,169,107,0.18)', borderWidth: 1, borderColor: 'rgba(201,169,107,0.40)', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  btnLabel:{ fontSize: 14, fontWeight: '600', color: '#C9A96B' },
});
