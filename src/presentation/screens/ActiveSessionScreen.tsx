import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { elapsedSeconds } from '@domain/session/Exercise';
import { isFinished, isPending, isRunning } from '@domain/session/ExerciseStatus';
import { useSession } from '@presentation/context/SessionContext';
import { AppTheme, useTheme } from '@presentation/theme';
import { ActiveSessionScreenProps } from '@presentation/navigation/types';

// ── Suggestion pool ───────────────────────────────────────────────────────────

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
}

const makeDraft = (): NewExerciseDraft => ({
  name: randomSuggestion(),
  photoUri: null,
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

  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<NewExerciseDraft | null>(null);
  const nameInputRef = useRef<TextInput>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const titleInputRef = useRef<TextInput>(null);
  const [, setTick] = useState(0);

  // ── Load session ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentSession?.id !== sessionId) {
      void restoreSession(sessionId);
    }
  }, [sessionId, currentSession?.id, restoreSession]);

  // ── Timer tick — fix: primitive dep, not object ───────────────────────────
  const runningExercise = currentSession?.exercises.find(e => isRunning(e.status));

  useEffect(() => {
    if (!runningExercise) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return (): void => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runningExercise?.id]); // intentionally only id, because it is enough

  // ── Auto-select running exercise ──────────────────────────────────────────
  useEffect(() => {
    if (runningExercise && selectedId === null) {
      setSelectedId(runningExercise.id);
    }
  }, [runningExercise, selectedId]);

  // ── Sorted exercise list ──────────────────────────────────────────────────
  const sortedExercises = currentSession
    ? [...currentSession.exercises].sort((a, b) => {
        const order = { Running: 0, Pending: 1, Finished: 2 };
        return order[a.status] - order[b.status];
      })
    : [];

  // ── Item tap ──────────────────────────────────────────────────────────────
  const handleItemTap = useCallback(
    (exerciseId: string): void => {
      if (selectedId === exerciseId) return;

      if (draft !== null && selectedId === 'new') {
        Alert.alert(
          'Drop new exercise?',
          'You have an unsaved exercise. Drop it and select the tapped one?',
          [
            { text: 'Keep editing', style: 'cancel' },
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

  // ── Add new ───────────────────────────────────────────────────────────────
  const handleAddNew = useCallback((): void => {
    if (draft !== null || runningExercise) return;
    setDraft(makeDraft());
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

  // ── Start exercise ────────────────────────────────────────────────────────
  const handleStart = useCallback(async (): Promise<void> => {
    if (!currentSession) return;

    if (selectedId === 'new' && draft) {
      const name = stripSuggestionMark(draft.name);
      if (!name) return;
      try {
        await addExercise({ autoLabel: name, photoUrl: draft.photoUri ?? undefined });
        setDraft(null);
        setSelectedId(null);
      } catch {
        /* error in context */
      }
      return;
    }

    if (selectedId && selectedId !== 'new') {
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

  // ── Derived state ─────────────────────────────────────────────────────────
  const sessionLabel = currentSession.label ?? 'Session';

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

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
            {/* Accent bar */}
            <View style={[s.accentBar, { backgroundColor: '#534AB7' }]} />
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
              {/* Accent bar — shown when selected */}
              {selected && (
                <View
                  style={[s.accentBar, { backgroundColor: running ? theme.accent : '#534AB7' }]}
                />
              )}

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
          <Text style={s.emptyList}>{'Tap "+ Add New" to start your first exercise.'}</Text>
        )}
      </ScrollView>

      {/* ── Area 3: Action area ── */}
      <View style={s.actionArea}>
        <Text style={s.actionAreaLabel}>Actions</Text>

        {error ? <Text style={s.errorText}>{error}</Text> : null}

        {/* Input row — shown when New is selected */}
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

          {/* Trash — Pending or Done only */}
          {canDelete && selectedExercise && (
            <Pressable
              style={({ pressed }) => [s.btnTrash, pressed && s.pressed]}
              onPress={() => handleDelete(selectedExercise.id)}
            >
              <Text style={s.btnTrashIcon}>🗑</Text>
            </Pressable>
          )}

          {/* Add New */}
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

        {/* Finish session */}
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
      paddingHorizontal: 16, // ← was 16, consistent ✅
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
    listContent: {
      paddingHorizontal: 16, // ← was 14, now matches SessionHub ✅
      paddingTop: 10,
      paddingBottom: 8,
      gap: 5,
    },
    emptyList: { fontSize: 13, color: theme.textMuted, textAlign: 'center', marginTop: 32 },

    // Exercise items
    exItem: {
      borderRadius: 12, // ← was 11, now matches SessionHub ✅
      padding: 11,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 0.5,
      overflow: 'hidden', // ← needed for accent bar + borderRadius
    },
    exRunning: { backgroundColor: '#0A1F14', borderColor: theme.accent },
    exPending: { backgroundColor: theme.surface, borderColor: theme.border },
    exPendingSel: { backgroundColor: theme.surface, borderColor: '#534AB7' }, // ← no dark tint, accent bar handles it
    exDone: { backgroundColor: theme.surface, borderColor: theme.surface, opacity: 0.5 },
    exNew: { backgroundColor: theme.surface, borderColor: '#534AB7', borderStyle: 'dashed' },
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

    // Accent bar — left strip, mirrors SessionHub HubSessionItem
    accentBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      borderRadius: 12,
    },

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
      paddingHorizontal: 20, // ← was 14, now matches HubActionArea ✅
      paddingTop: 12,
      paddingBottom: 28,
      gap: 8,
    },
    actionAreaLabel: {
      // ← new, matches SessionHub area labels ✅
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: theme.textMuted,
      marginBottom: 2,
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

    // Buttons
    btnRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    btnPrimary: {
      flex: 1,
      backgroundColor: theme.accent,
      borderRadius: 14, // ← was 10, now matches HubActionArea ✅
      paddingVertical: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnPrimaryLabel: { fontSize: 14, fontWeight: '700', color: '#0E0E0F' },
    btnWarning: {
      flex: 1,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: '#BA7517',
      borderRadius: 14, // ← was 10 ✅
      paddingVertical: 13,
      alignItems: 'center',
    },
    btnWarningLabel: { fontSize: 13, fontWeight: '600', color: '#FAC775' },
    btnSecondary: {
      flex: 1,
      backgroundColor: theme.surface,
      borderWidth: 0.5,
      borderColor: theme.border,
      borderRadius: 14, // ← was 10 ✅
      paddingVertical: 13,
      alignItems: 'center',
    },
    btnSecondaryLabel: { fontSize: 14, fontWeight: '500', color: theme.textPrimary },
    btnTrash: {
      width: 46,
      height: 46,
      backgroundColor: theme.surface,
      borderWidth: 0.5,
      borderColor: theme.danger,
      borderRadius: 14, // ← was 10 ✅
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
      borderRadius: 14, // ← was 10 ✅
      paddingVertical: 10,
      alignItems: 'center',
    },
    btnFinishSessionLabel: { fontSize: 12, color: theme.textMuted },
    pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  });
