import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Session, isActive } from '@domain/session/Session';
import { useAuth } from '@presentation/context/AuthContext';
import { useSession } from '@presentation/context/SessionContext';
import { AppTheme, useTheme } from '@presentation/theme';
import { SessionHubScreenProps } from '@presentation/navigation/types';
import { serviceLocator } from '@src/ServiceLocator';
import { SessionListArea } from '@presentation/components/SessionListArea';
import { SessionActionArea } from '@presentation/components/SessionActionArea';
import { useSessionHubData } from '@presentation/hooks/useSessionHubData'; // Import the new hook

// ── Screen ────────────────────────────────────────────────────────────────────

export const SessionHubScreen: React.FC<SessionHubScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { startNewSession, inheritLastSession } = useSession();
  const s = styles(theme);

  const { data, isLoading, error, loadData } = useSessionHubData();

  const [isActing, setIsActing] = useState(false);

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
      console.error('Error finishing session:', e); // Log for now
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
      console.error('Error creating new session:', e); // Log for now
      setIsActing(false); // Ensure acting state is reset on error
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
      console.error('Error creating copy session:', e); // Log for now
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

      {/* ── Area 2 — Session list ── */}
      <SessionListArea
        isLoading={isLoading}
        error={error}
        activeSession={data?.activeSession ?? null}
        finishedSessions={data?.finishedSessions ?? []}
        onSessionTap={handleSessionTap}
        theme={theme}
      />

      {/* ── Area 3 — Actions ── */}
      <SessionActionArea
        isActing={isActing}
        activeSession={data?.activeSession ?? null}
        finishedSessionsCount={data?.finishedSessions.length ?? 0}
        onContinue={handleContinue}
        onFinishAndContinue={handleFinishAndContinue}
        onCreateCopy={handleCreateCopy}
        onCreateNew={handleCreateNew} // Corrected from onCreateNew to handleCreateNew
      />
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
  });
