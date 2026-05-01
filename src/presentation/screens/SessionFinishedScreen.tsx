// TODO Phase 5 — SessionFinishedScreen
// Shows: total duration, exercise count, each exercise duration
// CTA: Back to Hub → resets session state and navigates to SessionHub
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const SessionFinishedScreen: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.label}>SessionFinishedScreen — Phase 5</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18, color: '#888' },
});
