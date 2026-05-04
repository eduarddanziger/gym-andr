import { useCallback, useEffect, useState } from 'react';
import { Session } from '@domain/session/Session';
import { useAuth } from '@presentation/context/AuthContext';
import { serviceLocator } from '@src/ServiceLocator';

interface HubData {
  activeSession: Session | null;
  finishedSessions: Session[];
}

interface UseSessionHubDataResult {
  data: HubData | null;
  isLoading: boolean;
  error: string | null;
  loadData: () => Promise<void>;
}

export const useSessionHubData = (): UseSessionHubDataResult => {
  const { user } = useAuth();

  const [data, setData] = useState<HubData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    if (!user) return; // Don't load data if user is not available
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
  }, [user]); // Dependency on user

  useEffect(() => {
    void loadData();
  }, [loadData]); // Dependency on loadData

  return { data, isLoading, error, loadData };
};
