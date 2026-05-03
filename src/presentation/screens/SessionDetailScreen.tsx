// TODO Phase 5 — SessionDetailScreen
// Read-only view of a finished session.
// Shows: label, date, duration, exercises with their durations.
// Actions: Rename session, Delete session.
// Reachable from SessionHubScreen list by tapping a finished session item.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SessionDetailScreenProps } from '@presentation/navigation/types';

export const SessionDetailScreen: React.FC<SessionDetailScreenProps> = ({ route }) => (
  <View style={styles.container}>
    <Text style={styles.label}>SessionDetailScreen — {route.params.sessionId}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 24 },
});
