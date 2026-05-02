import { apiRequest } from '@infrastructure/api/ApiClient';
import {
  AddExerciseInput,
  GetSessionsQuery,
  ISessionRepository,
} from '@domain/session/ISessionRepository';
import { Exercise } from '@domain/session/Exercise';
import { Session } from '@domain/session/Session';
import { PagedResponse } from '@domain/PagedResponse';

// Maps raw API responses to domain entities.
// The server returns ISO strings for dates — we convert to Date objects here.

const mapExercise = (raw: Record<string, unknown>): Exercise => ({
  id: raw['id'] as string,
  autoLabel: raw['autoLabel'] as string,
  photoUrl: raw['photoUrl'] as string | undefined,
  startedAt: raw['startedAt'] ? new Date(raw['startedAt'] as string) : undefined,
  maxEndAt: raw['maxEndAt'] ? new Date(raw['maxEndAt'] as string) : undefined,
  realEndAt: raw['realEndAt'] ? new Date(raw['realEndAt'] as string) : undefined,
  status: raw['status'] as Exercise['status'],
  properties: (raw['properties'] as { name: string; value: string }[]) ?? [],
});

const mapSession = (raw: Record<string, unknown>): Session => ({
  id: raw['id'] as string,
  userId: raw['userId'] as string,
  createdAt: new Date(raw['createdAt'] as string),
  finishedAt: raw['finishedAt'] ? new Date(raw['finishedAt'] as string) : undefined,
  status: raw['status'] as Session['status'],
  inheritedFromSessionId: raw['inheritedFromSessionId'] as string | undefined,
  exercises: ((raw['exercises'] as Record<string, unknown>[]) ?? []).map(mapExercise),
});

// Build query string from an object — omits undefined values
const toQueryString = (params: Record<string, string | number | undefined>): string => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
};

export class HttpSessionRepository implements ISessionRepository {
  async create(userId: string, inheritFromSessionId?: string): Promise<Session> {
    const raw = await apiRequest<Record<string, unknown>>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ userId, inheritFromSessionId }),
    });
    return mapSession(raw);
  }

  async getById(sessionId: string): Promise<Session> {
    const raw = await apiRequest<Record<string, unknown>>(`/api/sessions/${sessionId}`);
    return mapSession(raw);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await apiRequest<void>(`/api/sessions/${sessionId}`, { method: 'DELETE' });
  }

  async finish(sessionId: string): Promise<Session> {
    const raw = await apiRequest<Record<string, unknown>>(
      `/api/sessions/${sessionId}/finish`,
      { method: 'POST' },
    );
    return mapSession(raw);
  }

  async getActive(userId: string): Promise<Session | null> {
    const qs = toQueryString({ userId, page: 1, pageSize: 1 });
    const raw = await apiRequest<{ items?: Record<string, unknown>[] }>(
      `/api/sessions/active${qs}`,
    );
    const first = raw.items?.[0];
    return first ? mapSession(first) : null;
  }

  async getSessions(query: GetSessionsQuery): Promise<PagedResponse<Session>> {
    const qs = toQueryString({
      userId: query.userId,
      status: query.status,
      sort: query.sort,
      page: query.page,
      pageSize: query.pageSize,
    });
    const raw = await apiRequest<{
      items: Record<string, unknown>[];
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    }>(`/api/sessions${qs}`);
    return {
      items: (raw.items ?? []).map(mapSession),
      page: raw.page,
      pageSize: raw.pageSize,
      totalCount: raw.totalCount,
      totalPages: raw.totalPages,
    };
  }

  async addExercise(sessionId: string, input: AddExerciseInput): Promise<Exercise> {
    const raw = await apiRequest<Record<string, unknown>>(
      `/api/sessions/${sessionId}/exercises`,
      {
        method: 'POST',
        body: JSON.stringify({
          autoLabel: input.autoLabel,
          photoUrl: input.photoUrl,
          maxEndAt: input.maxEndAt?.toISOString(),
          properties: input.properties,
        }),
      },
    );
    return mapExercise(raw);
  }

  async startExercise(sessionId: string, exerciseId: string, maxEndAt?: Date): Promise<Exercise> {
    const raw = await apiRequest<Record<string, unknown>>(
      `/api/sessions/${sessionId}/exercises/${exerciseId}/start`,
      {
        method: 'POST',
        body: JSON.stringify({ maxEndAt: maxEndAt?.toISOString() }),
      },
    );
    return mapExercise(raw);
  }

  async finishExercise(sessionId: string, exerciseId: string): Promise<Exercise> {
    const raw = await apiRequest<Record<string, unknown>>(
      `/api/sessions/${sessionId}/exercises/${exerciseId}/finish`,
      { method: 'POST' },
    );
    return mapExercise(raw);
  }

  async deleteExercise(sessionId: string, exerciseId: string): Promise<void> {
    await apiRequest<void>(`/api/sessions/${sessionId}/exercises/${exerciseId}`, {
      method: 'DELETE',
    });
  }
}
