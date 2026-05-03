// TODO Phase 5 — AddExerciseSheet
// Modal screen presented over ActiveSessionScreen.
// Fields: autoLabel (required), photoUrl (optional), maxEndAt (optional), properties (key-value).
// On save: calls useSession().addExercise(input) then navigation.goBack().
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AddExerciseScreenProps } from '@presentation/navigation/types';
import { useTheme } from '@presentation/theme';

export const AddExerciseSheet: React.FC<AddExerciseScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        AddExerciseSheet — coming next
      </Text>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={{ color: theme.accent, marginTop: 16, fontSize: 14 }}>Close</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14 },
});
