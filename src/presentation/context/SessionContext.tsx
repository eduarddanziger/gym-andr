import React, { createContext, useCallback, useContext, useReducer } from 'react';
import { Session, runningExercise } from '@domain/session/Session';
import { Exercise } from '@domain/session/Exercise';
import { AddExerciseInput } from '@domain/session/ISessionRepository';
import { serviceLocator } from '@src/ServiceLocator';
import { useAuth } from './AuthContext';

// ── State ─────────────────────────────────────────────────────────────────────

interface SessionState {
  currentSession: Session | null;
  isLoading: boolean;
  error: string | null;
}

// ── Actions ───────────────────────────────────────────────────────────────────

type SessionAction =
  | { type: 'LOADING' }
  | { type: 'ERROR'; payload: string }
  | { type: 'SESSION_SET'; payload: Session }
  | { type: 'EXERCISE_UPSERT'; payload: Exercise }
  | { type: 'EXERCISE_DELETED'; payload: string }
  | { type: 'RESET' };

// ── Reducer ───────────────────────────────────────────────────────────────────

const initialState: SessionState = {
  currentSession: null,
  isLoading: false,
  error: null,
};

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'LOADING':
      return { ...state, isLoading: true, error: null };

    case 'ERROR':
      return { ...state, isLoading: false, error: action.payload };

    case 'SESSION_SET':
      return { currentSession: action.payload, isLoading: false, error: null };

    case 'EXERCISE_UPSERT': {
      if (!state.currentSession) return state;
      const incoming = action.payload;
      const exists = state.currentSession.exercises.some(e => e.id === incoming.id);

      let exercises = exists
        ? state.currentSession.exercises.map(e => (e.id === incoming.id ? incoming : e))
        : [...state.currentSession.exercises, incoming];

      // Mirror server behavior: when a new Running exercise arrives,
      // auto-finish the previous Running one in local state too.
      if (incoming.status === 'Running') {
        exercises = exercises.map(e =>
          e.id !== incoming.id && e.status === 'Running'
            ? { ...e, status: 'Finished' as const, realEndAt: new Date() }
            : e,
        );
      }

      return {
        ...state,
        isLoading: false,
        currentSession: { ...state.currentSession, exercises },
      };
    }

    case 'EXERCISE_DELETED': {
      if (!state.currentSession) return state;
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          exercises: state.currentSession.exercises.filter(e => e.id !== action.payload),
        },
      };
    }

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// ── Context value ─────────────────────────────────────────────────────────────

interface SessionContextValue extends SessionState {
  runningExercise: Exercise | undefined;
  restoreSession: (sessionId: string) => Promise<void>;
  startNewSession: () => Promise<Session>;
  inheritLastSession: (inheritFromSessionId: string) => Promise<Session>;
  addExercise: (input: AddExerciseInput) => Promise<Exercise>;
  startExercise: (exerciseId: string) => Promise<Exercise>;
  finishExercise: (exerciseId: string) => Promise<Exercise>;
  deleteExercise: (exerciseId: string) => Promise<void>;
  finishSession: () => Promise<Session>;
  renameSession: (sessionId: string, label: string) => Promise<Session>;
  deleteSession: (sessionId: string) => Promise<void>;
  resetSession: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(sessionReducer, initialState);
  const { user } = useAuth();

  const requireSession = (): Session => {
    if (!state.currentSession) throw new Error('No active session');
    return state.currentSession;
  };

  const requireUser = (): string => {
    if (!user) throw new Error('Not authenticated');
    return user.id;
  };

  // Loads a session by ID into context — used when coming from SessionHub "Continue"
  const restoreSession = useCallback(
    async (sessionId: string): Promise<void> => {
      if (state.currentSession?.id === sessionId) return;
      dispatch({ type: 'LOADING' });
      try {
        const session = await serviceLocator.getSessionById.execute(sessionId);
        dispatch({ type: 'SESSION_SET', payload: session });
      } catch (e) {
        dispatch({ type: 'ERROR', payload: (e as Error).message });
        throw e;
      }
    },
    [state.currentSession?.id],
  );

  const startNewSession = useCallback(async (): Promise<Session> => {
    dispatch({ type: 'LOADING' });
    try {
      const session = await serviceLocator.createSession.execute(requireUser());
      dispatch({ type: 'SESSION_SET', payload: session });
      return session;
    } catch (e) {
      dispatch({ type: 'ERROR', payload: (e as Error).message });
      throw e;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const inheritLastSession = useCallback(
    async (inheritFromSessionId: string): Promise<Session> => {
      dispatch({ type: 'LOADING' });
      try {
        const session = await serviceLocator.inheritSession.execute(
          requireUser(),
          inheritFromSessionId,
        );
        dispatch({ type: 'SESSION_SET', payload: session });
        return session;
      } catch (e) {
        dispatch({ type: 'ERROR', payload: (e as Error).message });
        throw e;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user],
  );

  const addExercise = useCallback(
    async (input: AddExerciseInput): Promise<Exercise> => {
      dispatch({ type: 'LOADING' });
      try {
        const exercise = await serviceLocator.addExercise.execute(requireSession().id, input);
        dispatch({ type: 'EXERCISE_UPSERT', payload: exercise });
        return exercise;
      } catch (e) {
        dispatch({ type: 'ERROR', payload: (e as Error).message });
        throw e;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.currentSession?.id],
  );

  const startExercise = useCallback(
    async (exerciseId: string): Promise<Exercise> => {
      dispatch({ type: 'LOADING' });
      try {
        const exercise = await serviceLocator.startExercise.execute(
          requireSession().id,
          exerciseId,
        );
        dispatch({ type: 'EXERCISE_UPSERT', payload: exercise });
        return exercise;
      } catch (e) {
        dispatch({ type: 'ERROR', payload: (e as Error).message });
        throw e;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.currentSession?.id],
  );

  const finishExercise = useCallback(
    async (exerciseId: string): Promise<Exercise> => {
      dispatch({ type: 'LOADING' });
      try {
        const exercise = await serviceLocator.finishExercise.execute(
          requireSession().id,
          exerciseId,
        );
        dispatch({ type: 'EXERCISE_UPSERT', payload: exercise });
        return exercise;
      } catch (e) {
        dispatch({ type: 'ERROR', payload: (e as Error).message });
        throw e;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.currentSession?.id],
  );

  const deleteExercise = useCallback(
    async (exerciseId: string): Promise<void> => {
      dispatch({ type: 'LOADING' });
      try {
        await serviceLocator.deleteExercise.execute(requireSession().id, exerciseId);
        dispatch({ type: 'EXERCISE_DELETED', payload: exerciseId });
      } catch (e) {
        dispatch({ type: 'ERROR', payload: (e as Error).message });
        throw e;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.currentSession?.id],
  );

  const finishSession = useCallback(async (): Promise<Session> => {
    dispatch({ type: 'LOADING' });
    try {
      const session = await serviceLocator.finishSession.execute(requireSession().id);
      dispatch({ type: 'SESSION_SET', payload: session });
      return session;
    } catch (e) {
      dispatch({ type: 'ERROR', payload: (e as Error).message });
      throw e;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentSession?.id]);

  const renameSession = useCallback(async (sessionId: string, label: string): Promise<Session> => {
    dispatch({ type: 'LOADING' });
    try {
      const session = await serviceLocator.renameSession.execute(sessionId, label);
      dispatch({ type: 'SESSION_SET', payload: session });
      return session;
    } catch (e) {
      dispatch({ type: 'ERROR', payload: (e as Error).message });
      throw e;
    }
  }, []);

  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    dispatch({ type: 'LOADING' });
    try {
      await serviceLocator.deleteSession.execute(sessionId);
      dispatch({ type: 'RESET' });
    } catch (e) {
      dispatch({ type: 'ERROR', payload: (e as Error).message });
      throw e;
    }
  }, []);

  const resetSession = useCallback(() => dispatch({ type: 'RESET' }), []);

  return (
    <SessionContext.Provider
      value={{
        ...state,
        runningExercise: state.currentSession ? runningExercise(state.currentSession) : undefined,
        restoreSession,
        startNewSession,
        inheritLastSession,
        addExercise,
        startExercise,
        finishExercise,
        deleteExercise,
        finishSession,
        renameSession,
        deleteSession,
        resetSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextValue => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
};
