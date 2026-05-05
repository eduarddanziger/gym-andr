import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Session } from '@domain/session/Session';
import { AppTheme } from '@presentation/theme';
import { SessionListItem } from './SessionListItem';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SessionListAreaProps {
  isLoading: boolean;
  activeSession: Session | null;
  finishedSessions: Session[];
  onSessionTap: (session: Session) => void;
  theme: AppTheme;
  containerStyle?: StyleProp<ViewStyle>; // New prop for external styling of the root View
}

// ── Component ─────────────────────────────────────────────────────────────────

export const SessionListArea: React.FC<SessionListAreaProps> = ({
  isLoading,
  activeSession,
  finishedSessions,
  onSessionTap,
  theme,
  containerStyle,
}) => {
  const s = styles(theme);

  // Derived list: Active session always on top, finished sessions below
  const listItems: Session[] = [...(activeSession ? [activeSession] : []), ...finishedSessions];

  return (
    <View style={[s.listArea, containerStyle]}>
      <Text style={s.areaLabel}>Sessions</Text>
      {isLoading ? (
        <ActivityIndicator color={theme.accent} style={s.spinner} />
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
      flex: 1,
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
      // Removed maxHeight: 180 to allow flex to control height
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
