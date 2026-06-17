import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatScreen() {
  return (
    <LinearGradient colors={['#5C3A10', '#080604']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.icon}>💬</Text>
          <Text style={styles.title}>Chat</Text>
          <Text style={styles.sub}>Coming soon</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  icon: { fontSize: 48 },
  title: { fontSize: 22, fontWeight: '700', color: '#F0EFE9' },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
});
