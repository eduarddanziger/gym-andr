import React, { createContext, useCallback, useContext, useReducer } from 'react';
import { Session, runningExercise } from '@domain/session/Session';
import { Exercise } from '@domain/session/Exercise';
import { AddExerciseInput } from '@domain/session/ISessionRepository';
import { serviceLocator } from '@src/ServiceLocator';
import { useAuth } from './AuthContext';

// ── State ────────────────────────────────────────────────────────────────────

interface SessionState {
  currentSession: Session | null;
  isLoading: boolean;
  error: string | null;
}

// ── Actions (discriminated union) ────────────────────────────────────────────

type SessionAction =
  | { type: 'LOADING' }
  | { type: 'ERROR'; payload: string }
  | { type: 'SESSION_SET'; payload: Session }
  | { type: 'EXERCISE_UPSERT'; payload: Exercise }
  | { type: 'EXERCISE_DELETED'; payload: string }
  | { type: 'RESET' };

// ── Reducer ──────────────────────────────────────────────────────────────────

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
      const exists = state.currentSession.exercises.some(e => e.id === action.payload.id);
      const exercises = exists
        ? state.currentSession.exercises.map(e => (e.id === action.payload.id ? action.payload : e))
        : [...state.currentSession.exercises, action.payload];
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

// ── Context value ────────────────────────────────────────────────────────────

interface SessionContextValue extends SessionState {
  runningExercise: Exercise | undefined;
  startNewSession: () => Promise<Session>;
  inheritLastSession: (inheritFromSessionId: string) => Promise<Session>;
  addExercise: (input: AddExerciseInput) => Promise<Exercise>;
  startExercise: (exerciseId: string, maxEndAt?: Date) => Promise<Exercise>;
  finishExercise: (exerciseId: string) => Promise<Exercise>;
  deleteExercise: (exerciseId: string) => Promise<void>;
  finishSession: () => Promise<Session>;
  resetSession: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(sessionReducer, initialState);
  const { user } = useAuth();

  const requireSession = useCallback((): Session => {
    if (!state.currentSession) throw new Error('No active session');
    return state.currentSession;
  }, [state.currentSession]);

  const requireUser = useCallback((): string => {
    if (!user) throw new Error('Not authenticated');
    return user.id;
  }, [user]);

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
  }, [requireUser]);

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
    [requireUser],
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
    [requireSession],
  );

  const startExercise = useCallback(
    async (exerciseId: string, maxEndAt?: Date): Promise<Exercise> => {
      dispatch({ type: 'LOADING' });
      try {
        const exercise = await serviceLocator.startExercise.execute(
          requireSession().id,
          exerciseId,
          maxEndAt,
        );
        dispatch({ type: 'EXERCISE_UPSERT', payload: exercise });
        return exercise;
      } catch (e) {
        dispatch({ type: 'ERROR', payload: (e as Error).message });
        throw e;
      }
    },
    [requireSession],
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
    [requireSession],
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
    [requireSession],
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
  }, [requireSession]);

  const resetSession = useCallback(() => dispatch({ type: 'RESET' }), []);

  return (
    <SessionContext.Provider
      value={{
        ...state,
        runningExercise: state.currentSession ? runningExercise(state.currentSession) : undefined,
        startNewSession,
        inheritLastSession,
        addExercise,
        startExercise,
        finishExercise,
        deleteExercise,
        finishSession,
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
