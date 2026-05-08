import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { elapsedSeconds } from '@domain/session/Exercise';
import { isFinished, isPending, isRunning } from '@domain/session/ExerciseStatus';
import { useSession } from '@presentation/context/SessionContext';
import { AppTheme, useTheme } from '@presentation/theme';
import { ActiveSessionScreenProps } from '@presentation/navigation/types';

// ── Suggestion pool ───────────────────────────────────────────────────────────
// Random suggestion shown as pre-filled placeholder with '?' suffix.
// Stripped before API call if still present.

const SUGGESTIONS = [
  'Bench Press',
  'Squat',
  'Deadlift',
  'Pull-up',
  'Row',
  'Overhead Press',
  'Lunge',
  'Plank',
  'Dip',
  'Curl',
];

const randomSuggestion = (): string =>
  SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)] + '?';

const stripSuggestionMark = (name: string): string =>
  name.endsWith('?') ? name.slice(0, -1).trim() : name.trim();

const isSuggestionName = (name: string): boolean => name.endsWith('?');

// ── New exercise draft ────────────────────────────────────────────────────────

interface NewExerciseDraft {
  name: string;
  photoUri: string | null;
  timerEnabled: boolean;
  timerMinutes: number;
  timerSeconds: number;
}

const makeDraft = (): NewExerciseDraft => ({
  name: randomSuggestion(),
  photoUri: null,
  timerEnabled: false,
  timerMinutes: 5,
  timerSeconds: 0,
});

// ── Screen ────────────────────────────────────────────────────────────────────

export const ActiveSessionScreen: React.FC<ActiveSessionScreenProps> = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const theme = useTheme();
  const s = styles(theme);

  const {
    currentSession,
    isLoading,
    error,
    restoreSession,
    addExercise,
    startExercise,
    finishExercise,
    deleteExercise,
    finishSession,
    renameSession,
  } = useSession();

  // ── Selection state ───────────────────────────────────────────────────────
  // null = nothing selected
  // 'new' = New draft row is selected
  // string = exerciseId of existing exercise
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);

  // ── New exercise draft ────────────────────────────────────────────────────
  const [draft, setDraft] = useState<NewExerciseDraft | null>(null);
  const nameInputRef = useRef<TextInput>(null);

  // ── Inline rename ─────────────────────────────────────────────────────────
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const titleInputRef = useRef<TextInput>(null);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const [, setTick] = useState(0);

  // ── Load session ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentSession?.id !== sessionId) {
      void restoreSession(sessionId);
    }
  }, [sessionId, currentSession?.id, restoreSession]);

  // ── Timer tick ────────────────────────────────────────────────────────────
  const runningExercise = currentSession?.exercises.find(e => isRunning(e.status));

  useEffect(() => {
    if (!runningExercise) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return (): void => {
      clearInterval(interval);
    };
  }, [runningExercise]);

  // Auto-select running exercise on load
  useEffect(() => {
    if (runningExercise && selectedId === null) {
      setSelectedId(runningExercise.id);
    }
  }, [runningExercise, sessionId, selectedId]);

  // ── Sorted exercise list ──────────────────────────────────────────────────
  // New (draft) always on top, then Running, Pending, Finished
  const sortedExercises = currentSession
    ? [...currentSession.exercises].sort((a, b) => {
        const order = { Running: 0, Pending: 1, Finished: 2 };
        return order[a.status] - order[b.status];
      })
    : [];

  // ── Item tap handler ──────────────────────────────────────────────────────
  const handleItemTap = useCallback(
    (exerciseId: string): void => {
      if (selectedId === exerciseId) return;

      // If New draft exists and user taps another item — confirm drop
      if (draft !== null && selectedId === 'new') {
        Alert.alert(
          'Drop new exercise?',
          'You have an unsaved exercise. Drop it and select the tapped one?',
          [
            {
              text: 'Keep editing',
              style: 'cancel',
              // no-op — selection stays on 'new'
            },
            {
              text: 'Drop it',
              style: 'destructive',
              onPress: (): void => {
                setDraft(null);
                setSelectedId(exerciseId);
              },
            },
          ],
        );
        return;
      }

      setSelectedId(exerciseId);
    },
    [selectedId, draft],
  );

  // ── Add new exercise ──────────────────────────────────────────────────────
  const handleAddNew = useCallback((): void => {
    if (draft !== null || runningExercise) return;
    const newDraft = makeDraft();
    setDraft(newDraft);
    setSelectedId('new');
    setTimeout(() => nameInputRef.current?.focus(), 50);
  }, [draft, runningExercise]);

  // ── Photo picker ──────────────────────────────────────────────────────────
  const handlePickPhoto = useCallback(async (): Promise<void> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setDraft(d => (d ? { ...d, photoUri: result.assets[0].uri } : d));
    }
  }, []);

  // ── Start exercise (new or pending) ──────────────────────────────────────
  const handleStart = useCallback(async (): Promise<void> => {
    if (!currentSession) return;

    if (selectedId === 'new' && draft) {
      // New exercise — strip '?' if suggestion not replaced
      const name = stripSuggestionMark(draft.name);
      if (!name) return;

      let maxEndAt: Date | undefined;
      if (draft.timerEnabled) {
        const totalMs = (draft.timerMinutes * 60 + draft.timerSeconds) * 1000;
        maxEndAt = new Date(Date.now() + totalMs);
      }

      try {
        await addExercise({
          autoLabel: name,
          photoUrl: draft.photoUri ?? undefined,
          maxEndAt,
        });
        setDraft(null);
        setSelectedId(null);
      } catch {
        /* error in context */
      }
      return;
    }

    if (selectedId && selectedId !== 'new') {
      // Existing pending exercise
      try {
        await startExercise(selectedId);
      } catch {
        /* error in context */
      }
    }
  }, [selectedId, draft, currentSession, addExercise, startExercise]);

  // ── Finish exercise ───────────────────────────────────────────────────────
  const handleFinishExercise = useCallback(async (): Promise<void> => {
    if (!runningExercise) return;
    try {
      await finishExercise(runningExercise.id);
      setSelectedId(null);
    } catch {
      /* error in context */
    }
  }, [runningExercise, finishExercise]);

  // ── Delete exercise ───────────────────────────────────────────────────────
  const handleDelete = useCallback(
    async (exerciseId: string): Promise<void> => {
      Alert.alert('Remove exercise?', 'This exercise will be removed from the session.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async (): Promise<void> => {
            try {
              await deleteExercise(exerciseId);
              setSelectedId(null);
            } catch {
              /* error in context */
            }
          },
        },
      ]);
    },
    [deleteExercise],
  );

  // ── Finish session ────────────────────────────────────────────────────────
  const handleFinishSession = useCallback(async (): Promise<void> => {
    try {
      const session = await finishSession();
      navigation.replace('SessionFinished', { sessionId: session.id });
    } catch {
      /* error in context */
    }
  }, [finishSession, navigation]);

  // ── Title rename ──────────────────────────────────────────────────────────
  const startEditingTitle = (): void => {
    setTitleDraft(currentSession?.label ?? '');
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 50);
  };

  const commitTitleRename = async (): Promise<void> => {
    setEditingTitle(false);
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === currentSession?.label) return;
    try {
      await renameSession(sessionId, trimmed);
    } catch {
      /* error in context */
    }
  };

  // ── Guards ────────────────────────────────────────────────────────────────
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

  // ── Derived state for action area ─────────────────────────────────────────
  const selectedExercise =
    selectedId && selectedId !== 'new'
      ? currentSession.exercises.find(e => e.id === selectedId)
      : null;

  const isSelectedRunning = selectedExercise ? isRunning(selectedExercise.status) : false;
  const isSelectedPending = selectedExercise ? isPending(selectedExercise.status) : false;
  const isSelectedDone = selectedExercise ? isFinished(selectedExercise.status) : false;
  const isSelectedNew = selectedId === 'new';

  const canAddNew = !draft && !runningExercise;
  const canStart = isSelectedNew
    ? !!(draft && stripSuggestionMark(draft.name))
    : isSelectedPending && !runningExercise;
  const canFinish = isSelectedRunning;
  const canDelete = (isSelectedPending || isSelectedDone) && !isSelectedRunning;

  const sessionLabel = currentSession.label ?? 'Session';

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* ── Area 1: Header ── */}
      <View style={s.header}>
        <Pressable style={s.backBtn} hitSlop={12} onPress={() => navigation.navigate('SessionHub')}>
          <Text style={s.backArrow}>‹</Text>
          <Text style={s.backLabel}>Hub</Text>
        </Pressable>

        {editingTitle ? (
          <TextInput
            ref={titleInputRef}
            style={s.titleInput}
            value={titleDraft}
            onChangeText={setTitleDraft}
            onSubmitEditing={commitTitleRename}
            onBlur={commitTitleRename}
            returnKeyType="done"
            selectTextOnFocus
            maxLength={60}
          />
        ) : (
          <Pressable style={s.titleBtn} onPress={startEditingTitle} hitSlop={8}>
            <Text style={s.titleText} numberOfLines={1}>
              {sessionLabel}
            </Text>
            <Text style={s.titleEdit}>✎</Text>
          </Pressable>
        )}

        {editingTitle ? (
          <Pressable style={s.cancelTitle} hitSlop={12} onPress={() => setEditingTitle(false)}>
            <Text style={s.cancelTitleLabel}>✕</Text>
          </Pressable>
        ) : (
          <View style={s.headerRight} />
        )}
      </View>

      {/* ── Area 2: Exercise list ── */}
      <ScrollView
        style={s.list}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
      >
        {/* New draft row — always on top */}
        {draft && (
          <Pressable style={[s.exItem, s.exNew]} onPress={() => setSelectedId('new')}>
            <View style={s.exLeft}>
              <View style={[s.pill, s.pillNew]}>
                <Text style={s.pillNewLabel}>New</Text>
              </View>
              <Text
                style={[s.exName, isSuggestionName(draft.name) ? s.exNameSuggestion : s.exNameLime]}
              >
                {draft.name}
              </Text>
            </View>
          </Pressable>
        )}

        {sortedExercises.map(exercise => {
          const running = isRunning(exercise.status);
          const pending = isPending(exercise.status);
          const done = isFinished(exercise.status);
          const selected = selectedId === exercise.id;

          return (
            <Pressable
              key={exercise.id}
              style={[
                s.exItem,
                running && s.exRunning,
                pending && !selected && s.exPending,
                pending && selected && s.exPendingSel,
                done && s.exDone,
              ]}
              onPress={() => handleItemTap(exercise.id)}
            >
              <View style={s.exLeft}>
                <View style={[s.pill, running ? s.pillRun : done ? s.pillDone : s.pillPend]}>
                  {running && <View style={s.pillDot} />}
                  <Text style={running ? s.pillRunLabel : done ? s.pillDoneLabel : s.pillPendLabel}>
                    {running ? 'Running' : done ? 'Done' : 'Pending'}
                  </Text>
                </View>
                <Text style={[s.exName, done && s.exNameMuted]}>{exercise.autoLabel}</Text>
                {running && (
                  <Text style={s.exTimer}>{formatElapsed(elapsedSeconds(exercise))}</Text>
                )}
                {done && exercise.startedAt && exercise.realEndAt && (
                  <Text style={s.exDuration}>
                    {formatElapsed(
                      Math.floor(
                        (exercise.realEndAt.getTime() - exercise.startedAt.getTime()) / 1000,
                      ),
                    )}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}

        {sortedExercises.length === 0 && !draft && (
          <Text style={s.emptyList}>Tap &quot;+ Add New&quot; to start your first exercise.</Text>
        )}
      </ScrollView>

      {/* ── Area 3: Action area ── */}
      <View style={s.actionArea}>
        {error ? <Text style={s.errorText}>{error}</Text> : null}

        {/* Name input + photo — shown when New is selected */}
        {isSelectedNew && draft && (
          <>
            <View style={s.inputRow}>
              <TextInput
                ref={nameInputRef}
                style={[
                  s.nameInput,
                  isSuggestionName(draft.name) ? s.nameInputSuggestion : s.nameInputLime,
                ]}
                value={draft.name}
                onChangeText={name => setDraft(d => (d ? { ...d, name } : d))}
                returnKeyType="done"
                maxLength={80}
                selectTextOnFocus
              />
              <Pressable
                style={[s.photoBtn, draft.photoUri && s.photoBtnFilled]}
                onPress={handlePickPhoto}
              >
                <Text>{draft.photoUri ? '🖼️' : '📷'}</Text>
              </Pressable>
            </View>

            {/* Compact timer row */}
            <View style={s.timerRow}>
              <Text style={s.timerLabel}>Max duration</Text>
              {draft.timerEnabled ? (
                <View style={s.timerInputRow}>
                  <TextInput
                    style={s.timerSegment}
                    value={String(draft.timerMinutes).padStart(2, '0')}
                    onChangeText={v =>
                      setDraft(d =>
                        d ? { ...d, timerMinutes: Math.min(99, parseInt(v) || 0) } : d,
                      )
                    }
                    keyboardType="number-pad"
                    maxLength={2}
                    selectTextOnFocus
                  />
                  <Text style={s.timerColon}>:</Text>
                  <TextInput
                    style={s.timerSegment}
                    value={String(draft.timerSeconds).padStart(2, '0')}
                    onChangeText={v =>
                      setDraft(d =>
                        d ? { ...d, timerSeconds: Math.min(59, parseInt(v) || 0) } : d,
                      )
                    }
                    keyboardType="number-pad"
                    maxLength={2}
                    selectTextOnFocus
                  />
                </View>
              ) : (
                <Text style={s.timerOff}>off</Text>
              )}
              <Pressable
                style={[s.toggle, draft.timerEnabled && s.toggleOn]}
                onPress={() => setDraft(d => (d ? { ...d, timerEnabled: !d.timerEnabled } : d))}
              >
                <View style={[s.toggleKnob, draft.timerEnabled && s.toggleKnobOn]} />
              </Pressable>
            </View>
          </>
        )}

        {/* Primary action row */}
        <View style={s.btnRow}>
          {canFinish && (
            <Pressable
              style={({ pressed }) => [s.btnWarning, pressed && s.pressed]}
              onPress={handleFinishExercise}
              disabled={isLoading}
            >
              <Text style={s.btnWarningLabel}>⏹ Finish Exercise</Text>
            </Pressable>
          )}

          {(isSelectedNew || isSelectedPending) && (
            <Pressable
              style={({ pressed }) => [
                s.btnPrimary,
                !canStart && s.btnDisabled,
                pressed && s.pressed,
              ]}
              onPress={handleStart}
              disabled={!canStart || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#0E0E0F" />
              ) : (
                <Text style={[s.btnPrimaryLabel, !canStart && s.btnDisabledLabel]}>
                  ▶ Start Exercise
                </Text>
              )}
            </Pressable>
          )}

          {/* Trash icon for Pending or Done */}
          {canDelete && selectedExercise && (
            <Pressable
              style={({ pressed }) => [s.btnTrash, pressed && s.pressed]}
              onPress={() => handleDelete(selectedExercise.id)}
            >
              <Text style={s.btnTrashIcon}>🗑</Text>
            </Pressable>
          )}

          {/* Add New button */}
          {!isSelectedNew && !canFinish && (
            <Pressable
              style={({ pressed }) => [
                s.btnSecondary,
                !canAddNew && s.btnDisabled,
                pressed && s.pressed,
              ]}
              onPress={handleAddNew}
              disabled={!canAddNew}
            >
              <Text style={[s.btnSecondaryLabel, !canAddNew && s.btnDisabledLabel]}>+ Add New</Text>
            </Pressable>
          )}
        </View>

        {/* Finish session — always at bottom */}
        <Pressable
          style={({ pressed }) => [s.btnFinishSession, pressed && s.pressed]}
          onPress={handleFinishSession}
          disabled={isLoading}
        >
          <Text style={s.btnFinishSessionLabel}>⏹ Finish Session</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
    errorText: { fontSize: 12, color: theme.danger, textAlign: 'center', marginBottom: 6 },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 52,
      paddingBottom: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.border,
    },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, width: 52 },
    backArrow: { fontSize: 22, color: theme.accent, lineHeight: 26 },
    backLabel: { fontSize: 13, color: theme.accent },
    titleBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },
    titleText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textPrimary,
      textAlign: 'center',
      flexShrink: 1,
    },
    titleEdit: { fontSize: 11, color: theme.textMuted },
    titleInput: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: theme.textPrimary,
      textAlign: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.accent,
      paddingVertical: 2,
      paddingHorizontal: 8,
    },
    cancelTitle: { width: 52, alignItems: 'flex-end' },
    cancelTitleLabel: { fontSize: 15, color: theme.textMuted },
    headerRight: { width: 52 },

    // List
    list: { flex: 1, minHeight: 80 },
    listContent: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8, gap: 5 },
    emptyList: { fontSize: 13, color: theme.textMuted, textAlign: 'center', marginTop: 32 },

    // Exercise items
    exItem: {
      borderRadius: 11,
      padding: 11,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 0.5,
    },
    exRunning: { backgroundColor: '#0A1F14', borderColor: theme.accent },
    exPending: { backgroundColor: theme.surface, borderColor: theme.border },
    exPendingSel: { backgroundColor: '#141420', borderColor: '#534AB7' },
    exDone: { backgroundColor: theme.surface, borderColor: theme.surface, opacity: 0.5 },
    exNew: { backgroundColor: '#141420', borderColor: '#534AB7', borderStyle: 'dashed' },
    exLeft: { flex: 1, gap: 2 },
    exName: { fontSize: 14, fontWeight: '500', color: theme.textPrimary },
    exNameMuted: { color: theme.textMuted, fontWeight: '400' },
    exNameSuggestion: { color: '#AFA9EC', fontStyle: 'italic' },
    exNameLime: { color: theme.accent },
    exTimer: {
      fontSize: 28,
      fontWeight: '200',
      color: theme.accent,
      letterSpacing: 2,
      fontVariant: ['tabular-nums'],
    },
    exDuration: { fontSize: 11, color: theme.textMuted, fontVariant: ['tabular-nums'] },

    // Pills
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      alignSelf: 'flex-start',
      borderRadius: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginBottom: 3,
    },
    pillRun: { backgroundColor: '#0F6E56' },
    pillDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#5DCAA5' },
    pillRunLabel: {
      fontSize: 8,
      fontWeight: '600',
      color: '#9FE1CB',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    pillPend: { backgroundColor: theme.border },
    pillPendLabel: {
      fontSize: 8,
      fontWeight: '500',
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    pillDone: { backgroundColor: theme.surface },
    pillDoneLabel: {
      fontSize: 8,
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    pillNew: { backgroundColor: '#2A2A40' },
    pillNewLabel: {
      fontSize: 8,
      fontWeight: '600',
      color: '#AFA9EC',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },

    // Action area
    actionArea: {
      borderTopWidth: 0.5,
      borderTopColor: theme.border,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 28,
      gap: 8,
    },

    // Input row
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    nameInput: {
      flex: 1,
      backgroundColor: theme.surface,
      borderWidth: 0.5,
      borderRadius: 9,
      paddingHorizontal: 12,
      paddingVertical: 9,
      fontSize: 14,
      color: theme.textPrimary,
      borderColor: '#534AB7',
    },
    nameInputSuggestion: { color: '#AFA9EC', borderColor: '#534AB7' },
    nameInputLime: { color: theme.accent, borderColor: theme.accent },
    photoBtn: {
      width: 38,
      height: 38,
      backgroundColor: theme.surface,
      borderWidth: 0.5,
      borderColor: theme.border,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoBtnFilled: { borderColor: '#534AB7', backgroundColor: '#141420' },

    // Timer
    timerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    timerLabel: { flex: 1, fontSize: 11, color: theme.textMuted },
    timerInputRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    timerSegment: {
      width: 32,
      textAlign: 'center',
      fontSize: 13,
      color: theme.textPrimary,
      backgroundColor: theme.surface,
      borderWidth: 0.5,
      borderColor: theme.border,
      borderRadius: 6,
      paddingVertical: 4,
      fontVariant: ['tabular-nums'],
    },
    timerColon: { fontSize: 13, color: theme.textSecondary },
    timerOff: { fontSize: 11, color: theme.textMuted },
    toggle: {
      width: 36,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 2,
    },
    toggleOn: { backgroundColor: '#0F6E56' },
    toggleKnob: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#F5F5F5' },
    toggleKnobOn: { marginLeft: 16 },

    // Buttons
    btnRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    btnPrimary: {
      flex: 1,
      backgroundColor: theme.accent,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnPrimaryLabel: { fontSize: 14, fontWeight: '700', color: '#0E0E0F' },
    btnWarning: {
      flex: 1,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: '#BA7517',
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
    },
    btnWarningLabel: { fontSize: 13, fontWeight: '600', color: '#FAC775' },
    btnSecondary: {
      flex: 1,
      backgroundColor: theme.surface,
      borderWidth: 0.5,
      borderColor: theme.border,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
    },
    btnSecondaryLabel: { fontSize: 14, fontWeight: '500', color: theme.textPrimary },
    btnTrash: {
      width: 42,
      height: 42,
      backgroundColor: theme.surface,
      borderWidth: 0.5,
      borderColor: theme.danger,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnTrashIcon: { fontSize: 16 },
    btnDisabled: { backgroundColor: theme.surface, borderColor: theme.border },
    btnDisabledLabel: { color: theme.textMuted },
    btnFinishSession: {
      backgroundColor: theme.surface,
      borderWidth: 0.5,
      borderColor: theme.border,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
    },
    btnFinishSessionLabel: { fontSize: 12, color: theme.textMuted },
    pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  });
