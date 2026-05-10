import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { isActive } from '@domain/session/Session';
import { useAuth } from '@presentation/context/AuthContext';
import { useSession } from '@presentation/context/SessionContext';
import { SessionHubScreenProps } from '@presentation/navigation/types';
import { serviceLocator } from '@src/ServiceLocator';
import { useSessionHubData } from '@presentation/hooks/useSessionHubData';
import { HubHeader } from '../components/session-hub/HubHeader';
import { HubSessionItem } from '../components/session-hub/HubSessionItem';
import { HubActionArea } from '../components/session-hub/HubActionArea';

export const SessionHubScreen: React.FC<SessionHubScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { startNewSession, inheritLastSession } = useSession();
  const s = styles();

  const { sessions, selectedSession, isLoading, reload, selectSession } = useSessionHubData();

  const [isActing, setIsActing] = useState(false);

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handleNavigate = useCallback(
    (sessionId: string, active: boolean): void => {
      if (active) {
        navigation.navigate('ActiveSession', { sessionId });
      } else {
        navigation.navigate('SessionDetail', { sessionId });
      }
    },
    [navigation],
  );

  // ── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = useCallback(
    (sessionId: string, active: boolean): void => {
      if (active) {
        Alert.alert(
          'Finish and delete?',
          'This will finish the active session and permanently delete it.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Finish & Delete',
              style: 'destructive',
              onPress: async (): Promise<void> => {
                setIsActing(true);
                try {
                  await serviceLocator.finishSession.execute(sessionId);
                  await serviceLocator.deleteSession.execute(sessionId);
                  await reload();
                } catch (e) {
                  Alert.alert('Error', (e as Error).message);
                } finally {
                  setIsActing(false);
                }
              },
            },
          ],
        );
      } else {
        Alert.alert('Delete session?', 'This session will be permanently removed.', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async (): Promise<void> => {
              setIsActing(true);
              try {
                await serviceLocator.deleteSession.execute(sessionId);
                await reload();
              } catch (e) {
                Alert.alert('Error', (e as Error).message);
              } finally {
                setIsActing(false);
              }
            },
          },
        ]);
      }
    },
    [reload],
  );

  // ── Continue ────────────────────────────────────────────────────────────────

  const handleContinue = useCallback((): void => {
    if (!selectedSession || !isActive(selectedSession)) return;
    navigation.navigate('ActiveSession', { sessionId: selectedSession.id });
  }, [selectedSession, navigation]);

  // ── Create New ──────────────────────────────────────────────────────────────

  const handleCreateNew = useCallback((): void => {
    if (!user) return;

    // If active session exists — ask to finish it first
    const activeSession = sessions.find(s => isActive(s));
    if (activeSession) {
      Alert.alert(
        'Active session in progress',
        'You must finish your active session before starting a new one.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Finish & Create New',
            onPress: async (): Promise<void> => {
              setIsActing(true);
              try {
                await serviceLocator.finishSession.execute(activeSession.id);
                const session = await startNewSession();
                navigation.navigate('ActiveSession', { sessionId: session.id });
              } catch (e) {
                Alert.alert('Error', (e as Error).message);
                setIsActing(false);
              }
            },
          },
        ],
      );
      return;
    }

    // No active session — create directly
    setIsActing(true);
    startNewSession()
      .then(session => navigation.navigate('ActiveSession', { sessionId: session.id }))
      .catch(e => {
        Alert.alert('Error', (e as Error).message);
        setIsActing(false);
      });
  }, [user, sessions, startNewSession, navigation]);

  // ── Copy Selected ───────────────────────────────────────────────────────────

  const handleCopySelected = useCallback((): void => {
    if (!user || !selectedSession || isActive(selectedSession)) return;

    setIsActing(true);
    inheritLastSession(selectedSession.id)
      .then(session => navigation.navigate('ActiveSession', { sessionId: session.id }))
      .catch(e => {
        Alert.alert('Error', (e as Error).message);
        setIsActing(false);
      });
  }, [user, selectedSession, inheritLastSession, navigation]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>
      {/* ── Area 1: Header ── */}
      <HubHeader
        userName={user?.name ?? 'Athlete'}
        selectedSession={selectedSession}
        onLogout={logout}
      />

      {/* ── Area 2: Session list ── */}
      <ScrollView
        style={s.list}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
      >
        {sessions.map(session => (
          <HubSessionItem
            key={session.id}
            session={session}
            isSelected={selectedSession?.id === session.id}
            onSelect={() => selectSession(session.id)}
            onNavigate={() => handleNavigate(session.id, isActive(session))}
            onDelete={() => handleDelete(session.id, isActive(session))}
          />
        ))}
      </ScrollView>

      {/* ── Area 3: Action area ── */}
      <HubActionArea
        selectedSession={selectedSession}
        hasAnySessions={sessions.length > 0}
        isActing={isLoading || isActing}
        onContinue={handleContinue}
        onCopySelected={handleCopySelected}
        onCreateNew={handleCreateNew}
      />
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = (): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
  });
