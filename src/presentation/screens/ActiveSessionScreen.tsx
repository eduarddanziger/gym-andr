import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Exercise, elapsedSeconds } from '@domain/session/Exercise';
import { isFinished, isPending, isRunning } from '@domain/session/ExerciseStatus';
import { useSession } from '@presentation/context/SessionContext';
import { AppTheme, useTheme } from '@presentation/theme';
import { ActiveSessionScreenProps } from '@presentation/navigation/types';

// ── Screen ────────────────────────────────────────────────────────────────────

export const ActiveSessionScreen: React.FC<ActiveSessionScreenProps> = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const theme = useTheme();
  const {
    currentSession,
    runningExercise,
    isLoading,
    error,
    restoreSession,
    startExercise,
    finishExercise,
    finishSession,
    renameSession,
  } = useSession();

  const s = styles(theme);

  // ── Inline rename (Option C) ───────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [labelDraft, setLabelDraft] = useState('');
  const inputRef = useRef<TextInput>(null);

  const startEditing = (): void => {
    setLabelDraft(currentSession?.label ?? '');
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const commitRename = async (): Promise<void> => {
    setEditing(false);
    const trimmed = labelDraft.trim();
    if (!trimmed || trimmed === currentSession?.label) return;
    try {
      await renameSession(sessionId, trimmed);
    } catch {
      // error shown via context
    }
  };

  const cancelEditing = (): void => {
    setEditing(false);
    setLabelDraft('');
  };

  // ── Load session if not in context ────────────────────────────────────────
  useEffect(() => {
    if (currentSession?.id !== sessionId) {
      void restoreSession(sessionId);
    }
  }, [sessionId, currentSession?.id, restoreSession]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!runningExercise) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return (): void => {
      clearInterval(interval);
    };
  }, [runningExercise]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleStartExercise = useCallback(
    async (exerciseId: string): Promise<void> => {
      try {
        await startExercise(exerciseId);
      } catch {
        /* context holds error */
      }
    },
    [startExercise],
  );

  const handleFinishExercise = useCallback(async (): Promise<void> => {
    if (!runningExercise) return;
    try {
      await finishExercise(runningExercise.id);
    } catch {
      /* context holds error */
    }
  }, [runningExercise, finishExercise]);

  const handleFinishSession = useCallback(async (): Promise<void> => {
    try {
      const session = await finishSession();
      navigation.replace('SessionFinished', { sessionId: session.id });
    } catch {
      /* context holds error */
    }
  }, [finishSession, navigation]);

  // ── Loading / error guard ─────────────────────────────────────────────────
  if (isLoading && !currentSession) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  if (!currentSession) {
    return (
      <View style={s.centered}>
        <Text style={s.errorText}>{error ?? 'Session not found'}</Text>
      </View>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const sessionLabel = currentSession.label ?? 'Session';

  const exercises = [...currentSession.exercises].sort((a, b) => {
    const order = { Running: 0, Pending: 1, Finished: 2 };
    return order[a.status] - order[b.status];
  });

  return (
    <View style={s.root}>
      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable style={s.backBtn} hitSlop={12} onPress={() => navigation.navigate('SessionHub')}>
          <Text style={s.backArrow}>‹</Text>
          <Text style={s.backLabel}>Hub</Text>
        </Pressable>

        {/* Option C — tap pencil icon or title to rename */}
        {editing ? (
          <TextInput
            ref={inputRef}
            style={s.titleInput}
            value={labelDraft}
            onChangeText={setLabelDraft}
            onSubmitEditing={commitRename}
            onBlur={commitRename}
            returnKeyType="done"
            selectTextOnFocus
            maxLength={60}
          />
        ) : (
          <Pressable style={s.titleBtn} onPress={startEditing} hitSlop={8}>
            <Text style={s.sessionTitle} numberOfLines={1}>
              {sessionLabel}
            </Text>
            <Text style={s.editHint}>✎</Text>
          </Pressable>
        )}

        {editing ? (
          <Pressable style={s.cancelBtn} onPress={cancelEditing} hitSlop={12}>
            <Text style={s.cancelLabel}>✕</Text>
          </Pressable>
        ) : (
          <View style={s.headerRight} />
        )}
      </View>

      {/* ── Running exercise card ── */}
      {runningExercise ? (
        <View style={s.runningCard}>
          <View style={s.runningPill}>
            <View style={s.runningDot} />
            <Text style={s.runningPillLabel}>Running</Text>
          </View>
          <Text style={s.runningName}>{runningExercise.autoLabel}</Text>
          <Text style={s.runningTimer}>{formatElapsed(elapsedSeconds(runningExercise))}</Text>
          <Pressable
            style={({ pressed }) => [s.finishExerciseBtn, pressed && s.pressed]}
            onPress={handleFinishExercise}
            disabled={isLoading}
          >
            <Text style={s.finishExerciseBtnLabel}>✓ Finish exercise</Text>
          </Pressable>
        </View>
      ) : (
        <View style={s.noRunningCard}>
          <Text style={s.noRunningText}>No exercise running</Text>
          <Text style={s.noRunningHint}>
            {exercises.some(e => isPending(e.status))
              ? 'Tap an exercise below to start it'
              : 'Add a new exercise to begin'}
          </Text>
        </View>
      )}

      {/* ── Exercise list ── */}
      <ScrollView
        style={s.list}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
      >
        {exercises.length === 0 ? (
          <Text style={s.emptyList}>No exercises yet — add one below.</Text>
        ) : (
          exercises.map(exercise => (
            <ExerciseItem
              key={exercise.id}
              exercise={exercise}
              onStart={() => handleStartExercise(exercise.id)}
              theme={theme}
            />
          ))
        )}
      </ScrollView>

      {/* ── Bottom bar ── */}
      <View style={s.bottomBar}>
        {error ? <Text style={s.errorText}>{error}</Text> : null}
        <Pressable
          style={({ pressed }) => [s.addBtn, pressed && s.pressed]}
          onPress={() => navigation.navigate('AddExercise', { sessionId })}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#0E0E0F" />
          ) : (
            <Text style={s.addBtnLabel}>+ Add Exercise</Text>
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [s.finishSessionBtn, pressed && s.pressed]}
          onPress={handleFinishSession}
          disabled={isLoading}
        >
          <Text style={s.finishSessionBtnLabel}>⏹ Finish Session</Text>
        </Pressable>
      </View>
    </View>
  );
};

// ── ExerciseItem ──────────────────────────────────────────────────────────────

interface ExerciseItemProps {
  exercise: Exercise;
  onStart: () => void;
  theme: AppTheme;
}

const ExerciseItem: React.FC<ExerciseItemProps> = ({ exercise, onStart, theme }) => {
  const running = isRunning(exercise.status);
  const pending = isPending(exercise.status);
  const finished = isFinished(exercise.status);
  const s = exerciseItemStyles(theme, running, pending, finished);

  const duration =
    finished && exercise.startedAt && exercise.realEndAt
      ? formatElapsed(
          Math.floor((exercise.realEndAt.getTime() - exercise.startedAt.getTime()) / 1000),
        )
      : null;

  return (
    <Pressable
      style={({ pressed }) => [s.item, pending && pressed && s.pressed]}
      onPress={pending ? onStart : undefined}
    >
      <View style={s.left}>
        <View style={s.pill}>
          {running && <View style={s.pillDot} />}
          <Text style={s.pillLabel}>{running ? 'Running' : pending ? 'Pending' : 'Done'}</Text>
        </View>
        <Text style={s.name} numberOfLines={1}>
          {exercise.autoLabel}
        </Text>
        {pending ? <Text style={s.hint}>Tap to start</Text> : null}
      </View>
      {duration ? <Text style={s.duration}>{duration}</Text> : null}
    </Pressable>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatElapsed = (totalSeconds: number): string => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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
    },
    errorText: { fontSize: 13, color: theme.danger, textAlign: 'center', marginBottom: 8 },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 56,
      paddingBottom: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.border,
    },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, width: 60 },
    backArrow: { fontSize: 24, color: theme.accent, lineHeight: 28 },
    backLabel: { fontSize: 14, color: theme.accent },
    titleBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    sessionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      textAlign: 'center',
      flexShrink: 1,
    },
    editHint: { fontSize: 12, color: theme.textMuted },
    titleInput: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      textAlign: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.accent,
      paddingVertical: 2,
      paddingHorizontal: 8,
    },
    cancelBtn: { width: 60, alignItems: 'flex-end' },
    cancelLabel: { fontSize: 16, color: theme.textMuted },
    headerRight: { width: 60 },

    runningCard: {
      margin: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.accent,
      borderRadius: 16,
      padding: 20,
      gap: 6,
    },
    runningPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      backgroundColor: '#0F6E56',
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    runningDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#5DCAA5' },
    runningPillLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: '#9FE1CB',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    runningName: { fontSize: 22, fontWeight: '700', color: theme.textPrimary, marginTop: 4 },
    runningTimer: {
      fontSize: 40,
      fontWeight: '200',
      color: theme.accent,
      letterSpacing: 2,
      fontVariant: ['tabular-nums'],
    },
    finishExerciseBtn: {
      marginTop: 8,
      backgroundColor: theme.accent,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
    },
    finishExerciseBtnLabel: { fontSize: 15, fontWeight: '700', color: '#0E0E0F' },

    noRunningCard: {
      margin: 16,
      backgroundColor: theme.surface,
      borderWidth: 0.5,
      borderColor: theme.border,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      gap: 4,
    },
    noRunningText: { fontSize: 15, fontWeight: '500', color: theme.textSecondary },
    noRunningHint: { fontSize: 12, color: theme.textMuted },

    list: { flex: 1 },
    listContent: { paddingHorizontal: 16, paddingBottom: 8, gap: 6 },
    emptyList: { fontSize: 13, color: theme.textMuted, textAlign: 'center', marginTop: 24 },

    bottomBar: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 32,
      borderTopWidth: 0.5,
      borderTopColor: theme.border,
      gap: 10,
    },
    addBtn: {
      backgroundColor: theme.accent,
      borderRadius: 14,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addBtnLabel: { fontSize: 16, fontWeight: '700', color: '#0E0E0F' },
    finishSessionBtn: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: '#BA7517',
      borderRadius: 14,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    finishSessionBtnLabel: { fontSize: 14, fontWeight: '600', color: '#FAC775' },
    pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  });

const exerciseItemStyles = (
  theme: AppTheme,
  running: boolean,
  pending: boolean,
  finished: boolean,
): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    item: {
      backgroundColor: theme.surface,
      borderWidth: 0.5,
      borderColor: running ? theme.accent : theme.border,
      borderRadius: 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      opacity: finished ? 0.55 : 1,
    },
    pressed: { opacity: 0.75 },
    left: { flex: 1, gap: 2 },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      borderRadius: 4,
      paddingHorizontal: 7,
      paddingVertical: 2,
      marginBottom: 2,
      backgroundColor: running ? '#0F6E56' : theme.border,
    },
    pillDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#5DCAA5' },
    pillLabel: {
      fontSize: 9,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: running ? '#9FE1CB' : theme.textSecondary,
    },
    name: { fontSize: 15, fontWeight: pending ? '500' : '400', color: theme.textPrimary },
    hint: { fontSize: 11, color: theme.accent, marginTop: 1 },
    duration: {
      fontSize: 13,
      color: theme.textMuted,
      fontVariant: ['tabular-nums'],
      marginLeft: 8,
    },
  });
