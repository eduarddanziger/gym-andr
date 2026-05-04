import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Session } from '@domain/session/Session';
import { AppTheme, useTheme } from '@presentation/theme'; // Import useTheme

// ── Types ─────────────────────────────────────────────────────────────────────

interface SessionActionAreaProps {
  isActing: boolean;
  activeSession: Session | null;
  finishedSessionsCount: number;
  onContinue: () => void;
  onFinishAndContinue: () => Promise<void>;
  onCreateCopy: () => Promise<void>;
  onCreateNew: () => Promise<void>;
  // Removed theme prop, as it will be accessed via useTheme hook
  // Removed all style props
}

// ── Component ─────────────────────────────────────────────────────────────────

export const SessionActionArea: React.FC<SessionActionAreaProps> = ({
  isActing,
  activeSession,
  finishedSessionsCount,
  onContinue,
  onFinishAndContinue,
  onCreateCopy,
  onCreateNew,
  // Removed theme and style props from destructuring
}) => {
  const theme = useTheme(); // Use the theme hook
  const s = styles(theme); // Create styles using the theme

  return (
    <View style={s.actionArea}>
      <Text style={s.areaLabel}>Actions</Text>
      {isActing ? (
        <ActivityIndicator color={theme.accent} />
      ) : activeSession ? (
        // State 1 — active session exists
        <>
          <Pressable
            style={({ pressed }) => [s.btnPrimary, pressed && s.pressed]}
            onPress={onContinue}
          >
            <Text style={s.btnPrimaryIcon}>▶</Text>
            <Text style={s.btnPrimaryLabel}>Continue session</Text>
            <Text style={s.btnPrimaryHint}>Pick up where you left off</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.btnWarning, pressed && s.pressed]}
            onPress={onFinishAndContinue}
          >
            <Text style={s.btnWarningLabel}>⏹ Finish & Continue</Text>
            <Text style={s.btnWarningHint}>Ends active session, returns here</Text>
          </Pressable>
        </>
      ) : finishedSessionsCount > 0 ? (
        // State 2 — no active, has history
        <>
          <Pressable
            style={({ pressed }) => [s.btnPrimary, pressed && s.pressed]}
            onPress={onCreateCopy}
          >
            <Text style={s.btnPrimaryIcon}>↺</Text>
            <Text style={s.btnPrimaryLabel}>Create Copy</Text>
            <Text style={s.btnPrimaryHint}>{"Inherit latest session's exercises"}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.btnSecondary, pressed && s.pressed]}
            onPress={onCreateNew}
          >
            <Text style={s.btnSecondaryLabel}>+ Create New</Text>
            <Text style={s.btnSecondaryHint}>Fresh blank session</Text>
          </Pressable>
        </>
      ) : (
        // State 3 — first-time user
        <Pressable
          style={({ pressed }) => [s.btnPrimary, pressed && s.pressed]}
          onPress={onCreateNew}
        >
          <Text style={s.btnPrimaryIcon}>+</Text>
          <Text style={s.btnPrimaryLabel}>Create New</Text>
          <Text style={s.btnPrimaryHint}>Start your first session</Text>
        </Pressable>
      )}
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = (theme: AppTheme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    actionArea: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 32,
      gap: 10,
    },
    areaLabel: {
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: theme.textMuted,
      marginBottom: 10,
    },
    btnPrimary: {
      backgroundColor: theme.accent,
      borderRadius: 14,
      padding: 18,
      gap: 2,
    },
    btnPrimaryIcon: {
      fontSize: 20,
      marginBottom: 2,
      color: '#0E0E0F',
    },
    btnPrimaryLabel: {
      fontSize: 18,
      fontWeight: '800',
      color: '#0E0E0F',
      letterSpacing: 0.2,
    },
    btnPrimaryHint: {
      fontSize: 12,
      color: '#4B5E0F',
      marginTop: 2,
    },
    btnSecondary: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      padding: 16,
      gap: 2,
    },
    btnSecondaryLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    btnSecondaryHint: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    btnWarning: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: '#BA7517',
      borderRadius: 14,
      padding: 16,
      gap: 2,
    },
    btnWarningLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FAC775',
    },
    btnWarningHint: {
      fontSize: 11,
      color: '#BA7517',
      marginTop: 2,
    },
    pressed: {
      opacity: 0.82,
      transform: [{ scale: 0.98 }],
    },
  });
