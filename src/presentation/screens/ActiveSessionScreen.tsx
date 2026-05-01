// TODO Phase 5 — ActiveSessionScreen
// Shows running exercise + timer, exercise list, Add Exercise FAB, Finish Session
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const ActiveSessionScreen: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.label}>ActiveSessionScreen — Phase 5</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18, color: '#888' },
});
