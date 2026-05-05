import React, { useState, useEffect } from 'react'; // Added useEffect
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Session, isActive } from '@domain/session/Session';
import { useAuth } from '@presentation/context/AuthContext';
import { useSession } from '@presentation/context/SessionContext';
import { AppTheme, useTheme } from '@presentation/theme';
import { SessionHubScreenProps } from '@presentation/navigation/types';
import { serviceLocator } from '@src/ServiceLocator';
import { SessionListArea } from '@presentation/components/SessionListArea';
import { SessionActionArea } from '@presentation/components/SessionActionArea';
import { useSessionHubData } from '@presentation/hooks/useSessionHubData';

// ── Screen ────────────────────────────────────────────────────────────────────

export const SessionHubScreen: React.FC<SessionHubScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { startNewSession, inheritLastSession } = useSession();
  const s = styles(theme);

  const { data, isLoading, error: dataLoadingError, loadData } = useSessionHubData();

  const [isActing, setIsActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null); // New state for action-specific errors

  // Clear action error when data reloads or user changes
  useEffect(() => {
    if (!isActing) {
      setActionError(null);
    }
  }, [isActing]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleContinue = (): void => {
    if (!data?.activeSession) return;
    setActionError(null); // Clear previous action error
    navigation.navigate('ActiveSession', { sessionId: data.activeSession.id });
  };

  const handleFinishAndContinue = async (): Promise<void> => {
    if (!data?.activeSession) return;
    setIsActing(true);
    setActionError(null); // Clear previous action error
    try {
      await serviceLocator.finishSession.execute(data.activeSession.id);
      await loadData(); // reload hub — active session gone, appears in finished list
    } catch (e) {
      setActionError((e as Error).message); // Set action error
    } finally {
      setIsActing(false);
    }
  };

  const handleCreateNew = async (): Promise<void> => {
    if (!user) return;
    setIsActing(true);
    setActionError(null); // Clear previous action error
    try {
      const session = await startNewSession();
      navigation.navigate('ActiveSession', { sessionId: session.id });
    } catch (e) {
      setActionError((e as Error).message); // Set action error
      setIsActing(false); // Ensure acting state is reset on error
    }
  };

  const handleCreateCopy = async (): Promise<void> => {
    if (!user || !data?.finishedSessions[0]) return;
    setIsActing(true);
    setActionError(null); // Clear previous action error
    try {
      // Inherit from the most recent finished session (top of list)
      const session = await inheritLastSession(data.finishedSessions[0].id);
      navigation.navigate('ActiveSession', { sessionId: session.id });
    } catch (e) {
      setActionError((e as Error).message); // Set action error
      setIsActing(false); // Ensure acting state is reset on error
    }
  };

  const handleSessionTap = (session: Session): void => {
    if (isActive(session)) {
      navigation.navigate('ActiveSession', { sessionId: session.id });
    } else {
      navigation.navigate('SessionDetail', { sessionId: session.id });
    }
  };

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

      {/* Display data loading error if any */}
      {dataLoadingError && (
        <View style={s.errorContainer}>
          <Text style={s.errorText}>Error loading data: {dataLoadingError}</Text>
        </View>
      )}

      {/* ── Area 2 — Session list ── */}
      <View style={s.listArea}>
        <SessionListArea
          isLoading={isLoading}
          activeSession={data?.activeSession ?? null}
          finishedSessions={data?.finishedSessions ?? []}
          onSessionTap={handleSessionTap}
          theme={theme}
        />
      </View>

      {/* Display action error if any */}
      {actionError && (
        <View style={s.errorContainer}>
          <Text style={s.errorText}>Action failed: {actionError}</Text>
        </View>
      )}

      {/* ── Area 3 — Actions ── */}
      <View style={s.actionArea}>
        <SessionActionArea
          isActing={isActing}
          activeSession={data?.activeSession ?? null}
          finishedSessionsCount={data?.finishedSessions.length ?? 0}
          onContinue={handleContinue}
          onFinishAndContinue={handleFinishAndContinue}
          onCreateCopy={handleCreateCopy}
          onCreateNew={handleCreateNew}
        />
      </View>
    </View>
  );
};

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
    errorContainer: {
      paddingHorizontal: 24,
      paddingVertical: 8,
      backgroundColor: theme.surface, // Or a specific error background color
      borderBottomWidth: 0.5,
      borderBottomColor: theme.border,
    },
    errorText: {
      color: theme.danger,
      fontSize: 13,
      textAlign: 'center',
    },
    listArea: { flex: 3 },
    actionArea: { flex: 2 },
  });
