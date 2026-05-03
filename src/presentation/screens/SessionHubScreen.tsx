import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Session, isActive } from '@domain/session/Session';
import { useAuth } from '@presentation/context/AuthContext';
import { useSession } from '@presentation/context/SessionContext';
import { AppTheme, useTheme } from '@presentation/theme';
import { SessionHubScreenProps } from '@presentation/navigation/types';
import { serviceLocator } from '@src/ServiceLocator';

// ── Types ─────────────────────────────────────────────────────────────────────

interface HubData {
  activeSession: Session | null;
  finishedSessions: Session[];
}

// ── Screen ────────────────────────────────────────────────────────────────────

export const SessionHubScreen: React.FC<SessionHubScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { startNewSession, inheritLastSession } = useSession();
  const s = styles(theme);

  const [data, setData] = useState<HubData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadData = useCallback(async (): Promise<void> => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const [activeSession, result] = await Promise.all([
        serviceLocator.getActiveSession.execute(user.id),
        serviceLocator.getSessions.execute({
          userId: user.id,
          status: 'Finished',
          sort: 'finishedAt:desc',
          pageSize: 10,
        }),
      ]);
      setData({ activeSession, finishedSessions: result.items });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleContinue = (): void => {
    if (!data?.activeSession) return;
    navigation.navigate('ActiveSession', { sessionId: data.activeSession.id });
  };

  const handleFinishAndContinue = async (): Promise<void> => {
    if (!data?.activeSession) return;
    setIsActing(true);
    try {
      await serviceLocator.finishSession.execute(data.activeSession.id);
      await loadData(); // reload hub — active session gone, appears in finished list
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsActing(false);
    }
  };

  const handleCreateNew = async (): Promise<void> => {
    if (!user) return;
    setIsActing(true);
    try {
      const session = await startNewSession();
      navigation.navigate('ActiveSession', { sessionId: session.id });
    } catch (e) {
      setError((e as Error).message);
      setIsActing(false);
    }
  };

  const handleCreateCopy = async (): Promise<void> => {
    if (!user || !data?.finishedSessions[0]) return;
    setIsActing(true);
    try {
      // Inherit from the most recent finished session (top of list)
      const session = await inheritLastSession(data.finishedSessions[0].id);
      navigation.navigate('ActiveSession', { sessionId: session.id });
    } catch (e) {
      setError((e as Error).message);
      setIsActing(false);
    }
  };

  const handleSessionTap = (session: Session): void => {
    if (isActive(session)) {
      navigation.navigate('ActiveSession', { sessionId: session.id });
    } else {
      navigation.navigate('SessionDetail', { sessionId: session.id });
    }
  };

  // ── Derived list ────────────────────────────────────────────────────────────

  // Active session always on top, finished sessions below
  const listItems: Session[] = [
    ...(data?.activeSession ? [data.activeSession] : []),
    ...(data?.finishedSessions ?? []),
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>
      {/* ── Area 1 — Header ── */}
      <View style={s.header}>
        <Text style={s.greeting}>Hey, {user?.name ?? 'Athlete'} 👋</Text>
        <Pressable onPress={logout} hitSlop={12}>
          <Text style={s.logoutLink}>Log out</Text>
        </Pressable>
      </View>

      {/* ── Area 2 — Session list ── */}
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
                isLatestFinished={!data?.activeSession && index === 0}
                onPress={() => handleSessionTap(session)}
                theme={theme}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* ── Area 3 — Actions ── */}
      <View style={s.actionArea}>
        <Text style={s.areaLabel}>Actions</Text>
        {isActing ? (
          <ActivityIndicator color={theme.accent} />
        ) : data?.activeSession ? (
          // State 1 — active session exists
          <>
            <Pressable
              style={({ pressed }) => [s.btnPrimary, pressed && s.pressed]}
              onPress={handleContinue}
            >
              <Text style={s.btnPrimaryIcon}>▶</Text>
              <Text style={s.btnPrimaryLabel}>Continue session</Text>
              <Text style={s.btnPrimaryHint}>Pick up where you left off</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.btnWarning, pressed && s.pressed]}
              onPress={handleFinishAndContinue}
            >
              <Text style={s.btnWarningLabel}>⏹ Finish & Continue</Text>
              <Text style={s.btnWarningHint}>Ends active session, returns here</Text>
            </Pressable>
          </>
        ) : (data?.finishedSessions.length ?? 0) > 0 ? (
          // State 2 — no active, has history
          <>
            <Pressable
              style={({ pressed }) => [s.btnPrimary, pressed && s.pressed]}
              onPress={handleCreateCopy}
            >
              <Text style={s.btnPrimaryIcon}>↺</Text>
              <Text style={s.btnPrimaryLabel}>Create Copy</Text>
              <Text style={s.btnPrimaryHint}>{"Inherit latest session's exercises"}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.btnSecondary, pressed && s.pressed]}
              onPress={handleCreateNew}
            >
              <Text style={s.btnSecondaryLabel}>+ Create New</Text>
              <Text style={s.btnSecondaryHint}>Fresh blank session</Text>
            </Pressable>
          </>
        ) : (
          // State 3 — first-time user
          <Pressable
            style={({ pressed }) => [s.btnPrimary, pressed && s.pressed]}
            onPress={handleCreateNew}
          >
            <Text style={s.btnPrimaryIcon}>+</Text>
            <Text style={s.btnPrimaryLabel}>Create New</Text>
            <Text style={s.btnPrimaryHint}>Start your first session</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

// ── SessionListItem ───────────────────────────────────────────────────────────

interface SessionListItemProps {
  session: Session;
  isLatestFinished: boolean;
  onPress: () => void;
  theme: AppTheme;
}

const SessionListItem: React.FC<SessionListItemProps> = ({
  session,
  isLatestFinished,
  onPress,
  theme,
}) => {
  const active = isActive(session);
  const s = itemStyles(theme, active, isLatestFinished);

  return (
    <Pressable style={({ pressed }) => [s.item, pressed && s.pressed]} onPress={onPress}>
      <View style={s.left}>
        {/* Status pill */}
        <View style={s.pill}>
          {active && <View style={s.pillDot} />}
          <Text style={s.pillLabel}>
            {active ? 'Active' : isLatestFinished ? 'Latest' : 'Finished'}
          </Text>
        </View>
        {/* Label (if set) */}
        {session.label ? (
          <Text style={s.label} numberOfLines={1}>
            {session.label}
          </Text>
        ) : null}
        {/* Date */}
        <Text style={s.date}>{formatDate(session.createdAt)}</Text>
        {/* Exercise count */}
        <Text style={s.count}>
          {session.exercises.length} {session.exercises.length === 1 ? 'exercise' : 'exercises'}
        </Text>
      </View>
      <Text style={s.arrow}>›</Text>
    </Pressable>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (date: Date): string =>
  new Date(date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = (theme: AppTheme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background,
    },

    // Area 1 — header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 56,
      paddingBottom: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.border,
    },
    greeting: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    logoutLink: {
      fontSize: 13,
      color: theme.textMuted,
    },

    // Area 2 — list
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
    // Fixed height shows ~2 items, scrollable for more
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

    // Area 3 — actions
    actionArea: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 32,
      gap: 10,
    },

    // Primary button — lime accent
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

    // Secondary button — surface
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

    // Warning button — amber, for destructive-ish action
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

const itemStyles = (
  theme: AppTheme,
  active: boolean,
  isLatest: boolean,
): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    item: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: active ? theme.accent : isLatest ? '#534AB7' : theme.border,
      borderRadius: 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    pressed: {
      opacity: 0.8,
    },
    left: {
      flex: 1,
      gap: 2,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      borderRadius: 4,
      paddingHorizontal: 7,
      paddingVertical: 2,
      marginBottom: 4,
      backgroundColor: active ? '#0F6E56' : isLatest ? '#534AB7' : theme.border,
    },
    pillDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: '#5DCAA5',
    },
    pillLabel: {
      fontSize: 9,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: active ? '#9FE1CB' : isLatest ? '#AFA9EC' : theme.textSecondary,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    date: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    count: {
      fontSize: 11,
      color: theme.textMuted,
    },
    arrow: {
      fontSize: 18,
      color: theme.textMuted,
      marginLeft: 8,
    },
  });
