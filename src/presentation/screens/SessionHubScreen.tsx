// TODO Phase 5 — SessionHubScreen
// CTAs: Start new session / Repeat last session
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const SessionHubScreen: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.label}>SessionHubScreen — Phase 5</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18, color: '#888' },
});
