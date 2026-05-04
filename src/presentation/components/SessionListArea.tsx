import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Session } from '@domain/session/Session';
import { AppTheme } from '@presentation/theme';
import { SessionListItem } from './SessionListItem'; // Assuming it's in the same directory

// ── Types ─────────────────────────────────────────────────────────────────────

interface SessionListAreaProps {
  isLoading: boolean;
  error: string | null;
  activeSession: Session | null;
  finishedSessions: Session[]; // New prop
  onSessionTap: (session: Session) => void;
  theme: AppTheme; // Keep theme prop as it's used for styling within this component
}

// ── Component ─────────────────────────────────────────────────────────────────

export const SessionListArea: React.FC<SessionListAreaProps> = ({
  isLoading,
  error,
  activeSession,
  finishedSessions, // Destructure new prop
  onSessionTap,
  theme,
}) => {
  const s = styles(theme); // Use internal styles

  // Derived list: Active session always on top, finished sessions below
  const listItems: Session[] = [...(activeSession ? [activeSession] : []), ...finishedSessions];

  return (
    <View style={s.listArea}>
      <Text style={s.areaLabel}>Sessions</Text>
      {isLoading ? (
        <ActivityIndicator color={theme.accent} style={s.spinner} />
      ) : error ? (
        <Text style={s.errorText}>{error}</Text>
      ) : listItems.length === 0 ? (
        <View style={s.emptyCard}>
          <Text style={s.emptyTitle}>No sessions yet.</Text>
          <Text style={s.emptyHint}>Start your first workout below!</Text>
        </View>
      ) : (
        <ScrollView style={s.list} showsVerticalScrollIndicator={false} nestedScrollEnabled>
          {listItems.map((session, index) => (
            <SessionListItem
              key={session.id}
              session={session}
              isLatestFinished={!activeSession && index === 0}
              onPress={() => onSessionTap(session)}
              theme={theme}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = (theme: AppTheme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    listArea: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.border,
    },
    areaLabel: {
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: theme.textMuted,
      marginBottom: 10,
    },
    list: {
      maxHeight: 180,
    },
    spinner: {
      marginVertical: 24,
    },
    errorText: {
      fontSize: 13,
      color: theme.danger,
      paddingVertical: 12,
    },
    emptyCard: {
      paddingVertical: 20,
      alignItems: 'center',
      gap: 4,
    },
    emptyTitle: {
      fontSize: 14,
      color: theme.textMuted,
    },
    emptyHint: {
      fontSize: 12,
      color: theme.textMuted,
      opacity: 0.7,
    },
  });
