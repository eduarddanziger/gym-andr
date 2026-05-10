import { useCallback, useEffect, useState } from 'react';
import { Session, isActive } from '@domain/session/Session';
import { serviceLocator } from '@src/ServiceLocator';
import { useAuth } from '@presentation/context/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SessionHubData {
  sessions: Session[];           // active first (if any), then finished desc
  selectedSession: Session | null;
  isLoading: boolean;
  error: string | null;
  selectSession: (id: string) => void;
  reload: () => Promise<void>;
}

// ── Auto-select rule ──────────────────────────────────────────────────────────
// Active session always wins; otherwise take the first (latest finished)

const autoSelect = (sessions: Session[]): Session | null =>
  sessions.find(s => isActive(s)) ?? sessions[0] ?? null;

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useSessionHubData = (): SessionHubData => {
  const { user } = useAuth();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const [activeSession, finishedResult] = await Promise.all([
        serviceLocator.getActiveSession.execute(user.id),
        serviceLocator.getSessions.execute({
          userId: user.id,
          status: 'Finished',
          sort: 'finishedAt:desc',
          pageSize: 20,
        }),
      ]);

      // Merge — active always first
      const merged: Session[] = [
        ...(activeSession ? [activeSession] : []),
        ...finishedResult.items,
      ];

      setSessions(merged);

      // Auto-select: preserve current selection if still valid, otherwise auto
      setSelectedId(prev => {
        const stillExists = prev && merged.some(s => s.id === prev);
        if (stillExists) return prev;
        return autoSelect(merged)?.id ?? null;
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectSession = useCallback((id: string): void => {
    setSelectedId(id);
  }, []);

  const selectedSession = sessions.find(s => s.id === selectedId) ?? null;

  return {
    sessions,
    selectedSession,
    isLoading,
    error,
    selectSession,
    reload: load,
  };
};
