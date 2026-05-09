import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { durationSeconds, finishedExercises } from '@domain/session/Session';
import { useSession } from '@presentation/context/SessionContext';
import { AppTheme, useTheme } from '@presentation/theme';
import { SessionFinishedScreenProps } from '@presentation/navigation/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDuration = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const formatDateTime = (date: Date): string => {
  const d = new Date(date);
  const datePart = d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timePart = d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart} · ${timePart}`;
};

const exerciseDuration = (startedAt?: Date, realEndAt?: Date): string => {
  if (!startedAt || !realEndAt) return '—';
  const secs = Math.floor((realEndAt.getTime() - startedAt.getTime()) / 1000);
  return formatDuration(secs);
};

// ── Screen ────────────────────────────────────────────────────────────────────

export const SessionFinishedScreen: React.FC<SessionFinishedScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { currentSession, resetSession } = useSession();
  const s = styles(theme);

  const handleBackToHub = (): void => {
    resetSession();
    navigation.navigate('SessionHub');
  };

  // Guard — should always have session here, but handle gracefully
  if (!currentSession) {
    return (
      <View style={s.centered}>
        <Text style={s.emptyText}>Session not found.</Text>
        <Pressable style={s.ctaBtn} onPress={handleBackToHub}>
          <Text style={s.ctaBtnLabel}>↩ Back to Hub</Text>
        </Pressable>
      </View>
    );
  }

  const sessionLabel = currentSession.label ?? 'Session';
  const totalDuration = formatDuration(durationSeconds(currentSession));
  const exercises = finishedExercises(currentSession);
  const totalExercises = currentSession.exercises.length;

  return (
    <View style={s.root}>
      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Session Complete</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero card ── */}
        <View style={s.heroCard}>
          <View style={s.heroPill}>
            <View style={s.heroPillDot} />
            <Text style={s.heroPillLabel}>Finished</Text>
          </View>
          <Text style={s.heroLabel}>{sessionLabel}</Text>
          <Text style={s.heroDate}>{formatDateTime(currentSession.createdAt)}</Text>

          <View style={s.statsRow}>
            <View style={s.statTile}>
              <Text style={s.statValue}>{totalDuration}</Text>
              <Text style={s.statLabel}>Duration</Text>
            </View>
            <View style={s.statTile}>
              <Text style={s.statValue}>{totalExercises}</Text>
              <Text style={s.statLabel}>Exercises</Text>
            </View>
          </View>
        </View>

        {/* ── Exercise list ── */}
        {exercises.length > 0 && (
          <>
            <View style={s.listHeader}>
              <Text style={s.listHeaderLabel}>Exercises</Text>
              <View style={s.listHeaderLine} />
            </View>

            <View style={s.exList}>
              {exercises.map((exercise, index) => (
                <View key={exercise.id} style={s.exRow}>
                  <Text style={s.exIndex}>{index + 1}</Text>
                  <Text style={s.exName} numberOfLines={1}>
                    {exercise.autoLabel}
                  </Text>
                  <Text style={s.exDuration}>
                    {exerciseDuration(exercise.startedAt, exercise.realEndAt)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* ── CTA ── */}
      <View style={s.ctaArea}>
        <Pressable
          style={({ pressed }) => [s.ctaBtn, pressed && s.pressed]}
          onPress={handleBackToHub}
        >
          <Text style={s.ctaBtnLabel}>↩ Back to Hub</Text>
        </Pressable>
      </View>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = (theme: AppTheme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.background,
      gap: 24,
      paddingHorizontal: 24,
    },
    emptyText: { fontSize: 14, color: theme.textMuted, textAlign: 'center' },

    // Header
    header: {
      paddingTop: 56,
      paddingBottom: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.border,
      alignItems: 'center',
    },
    headerTitle: { fontSize: 15, fontWeight: '600', color: theme.textPrimary },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, gap: 0 },

    // Hero card
    heroCard: {
      backgroundColor: '#0A1F14',
      borderWidth: 0.5,
      borderColor: theme.accent,
      borderRadius: 16,
      padding: 18,
      marginBottom: 14,
    },
    heroPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      backgroundColor: '#0F6E56',
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginBottom: 10,
    },
    heroPillDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#5DCAA5' },
    heroPillLabel: {
      fontSize: 8,
      fontWeight: '600',
      color: '#9FE1CB',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    heroLabel: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.textPrimary,
      marginBottom: 2,
    },
    heroDate: { fontSize: 12, color: theme.textSecondary, marginBottom: 14 },

    statsRow: { flexDirection: 'row', gap: 10 },
    statTile: {
      flex: 1,
      backgroundColor: theme.background,
      borderRadius: 10,
      padding: 12,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '200',
      color: theme.accent,
      letterSpacing: 1,
      fontVariant: ['tabular-nums'],
    },
    statLabel: {
      fontSize: 9,
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 3,
    },

    // Exercise list
    listHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    listHeaderLabel: {
      fontSize: 9,
      fontWeight: '600',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: theme.textMuted,
    },
    listHeaderLine: { flex: 1, height: 0.5, backgroundColor: theme.border },

    exList: { gap: 4 },
    exRow: {
      backgroundColor: theme.surface,
      borderRadius: 9,
      padding: 11,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    exIndex: {
      fontSize: 10,
      color: theme.textMuted,
      fontVariant: ['tabular-nums'],
      width: 16,
    },
    exName: { flex: 1, fontSize: 13, fontWeight: '500', color: theme.textPrimary },
    exDuration: {
      fontSize: 12,
      color: theme.textMuted,
      fontVariant: ['tabular-nums'],
    },

    // CTA
    ctaArea: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 32,
      borderTopWidth: 0.5,
      borderTopColor: theme.border,
    },
    ctaBtn: {
      backgroundColor: theme.accent,
      borderRadius: 14,
      padding: 18,
      alignItems: 'center',
    },
    ctaBtnLabel: { fontSize: 15, fontWeight: '700', color: '#0E0E0F' },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  });
