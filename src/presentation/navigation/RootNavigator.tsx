// TODO Phase 5 — RootNavigator
// Stack: Login → SessionHub → ActiveSession → SessionFinished
// Auth guard: redirect to Login if useAuth().user === null
// Install first: npx expo install @react-navigation/native @react-navigation/native-stack
//               npx expo install react-native-screens react-native-safe-area-context
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const RootNavigator: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.label}>RootNavigator — Phase 5</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18, color: '#888' },
});
