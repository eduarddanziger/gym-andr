// TODO Phase 5 — LoginScreen
// Calls useAuth().login(email)
// On success → navigate to SessionHub
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const LoginScreen: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.label}>LoginScreen — Phase 5</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18, color: '#888' },
});
