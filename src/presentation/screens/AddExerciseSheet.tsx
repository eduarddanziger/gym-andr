// TODO Phase 5 — AddExerciseSheet (bottom sheet)
// Fields: autoLabel (required), photoUrl, maxEndAt, properties (key-value list)
// Calls useSession().addExercise(input)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const AddExerciseSheet: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.label}>AddExerciseSheet — Phase 5</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18, color: '#888' },
});
