import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Session, isActive } from '@domain/session/Session';
import { AppTheme, useTheme } from '@presentation/theme';

// ── Props ─────────────────────────────────────────────────────────────────────

interface HubActionAreaProps {
  selectedSession: Session | null;
  hasAnySessions: boolean;
  isActing: boolean;
  onContinue: () => void;
  onInheritSelected: () => void;
  onCreateNew: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const HubActionArea: React.FC<HubActionAreaProps> = ({
  selectedSession,
  hasAnySessions,
  isActing,
  onContinue,
  onInheritSelected,
  onCreateNew,
}) => {
  const theme = useTheme();
  const s = styles(theme);

  if (isActing) {
    return (
      <View style={[s.area, s.centered]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  // ── No sessions at all ──────────────────────────────────────────────────────
  if (!hasAnySessions) {
    return (
      <View style={s.area}>
        <Pressable
          style={({ pressed }) => [s.btnPrimary, pressed && s.pressed]}
          onPress={onCreateNew}
        >
          <Text style={s.btnPrimaryLabel}>+ Create & Start New</Text>
          <Text style={s.btnPrimaryHint}>Start your first session</Text>
        </Pressable>
      </View>
    );
  }

  // ── Active session selected ─────────────────────────────────────────────────
  if (selectedSession && isActive(selectedSession)) {
    return (
      <View style={s.area}>
        <Pressable
          style={({ pressed }) => [s.btnPrimary, pressed && s.pressed]}
          onPress={onContinue}
        >
          <Text style={s.btnPrimaryLabel}>▶ Continue Session</Text>
          <Text style={s.btnPrimaryHint}>Resume your active workout</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [s.btnSecondary, pressed && s.pressed]}
          onPress={onInheritSelected}
        >
          <Text style={s.btnPrimaryLabel}>↺ Inherit & Start</Text>
          <Text style={s.btnSecondaryHint}>Will ask to finish active session and inherit it</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [s.btnSecondary, pressed && s.pressed]}
          onPress={onCreateNew}
        >
          <Text style={s.btnSecondaryLabel}>+ Create & Start New</Text>
          <Text style={s.btnSecondaryHint}>Will ask to finish active session first</Text>
        </Pressable>
      </View>
    );
  }

  // ── Finished session selected ───────────────────────────────────────────────
  if (selectedSession && !isActive(selectedSession)) {
    const copyHint = selectedSession.label ?? 'selected session';
    return (
      <View style={s.area}>
        <Pressable
          style={({ pressed }) => [s.btnPrimary, pressed && s.pressed]}
          onPress={onInheritSelected}
        >
          <Text style={s.btnPrimaryLabel}>↺ Inherit & Start</Text>
          <Text style={s.btnPrimaryHint} numberOfLines={1}>
            {`Inherit exercises from "${copyHint}"`}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [s.btnSecondary, pressed && s.pressed]}
          onPress={onCreateNew}
        >
          <Text style={s.btnSecondaryLabel}>+ Create New & Start</Text>
          <Text style={s.btnSecondaryHint}>Fresh blank session</Text>
        </Pressable>
      </View>
    );
  }

  // ── Has sessions but nothing selected (shouldn't happen — safety fallback) ──
  return (
    <View style={s.area}>
      <Pressable
        style={({ pressed }) => [s.btnSecondary, pressed && s.pressed]}
        onPress={onCreateNew}
      >
        <Text style={s.btnSecondaryLabel}>+ Create New & Start</Text>
        <Text style={s.btnSecondaryHint}>Fresh blank session</Text>
      </Pressable>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = (theme: AppTheme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    area: {
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 32,
      gap: 10,
      borderTopWidth: 0.5,
      borderTopColor: theme.border,
    },
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 80,
    },
    areaLabel: {
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: theme.textMuted,
      marginBottom: 4,
    },

    // Primary button — lime, large
    btnPrimary: {
      backgroundColor: theme.accent,
      borderRadius: 14,
      padding: 18,
      gap: 2,
    },
    btnPrimaryIcon: {
      fontSize: 20,
      color: '#0E0E0F',
      marginBottom: 2,
    },
    btnPrimaryLabel: {
      fontSize: 17,
      fontWeight: '800',
      color: '#0E0E0F',
      letterSpacing: 0.2,
    },
    btnPrimaryHint: {
      fontSize: 12,
      color: '#4B5E0F',
      marginTop: 2,
    },

    // Secondary button — surface, bordered
    btnSecondary: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      padding: 16,
      gap: 2,
    },
    btnSecondaryLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    btnSecondaryHint: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },

    pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  });
