import {
  AddExerciseInput,
  GetSessionsQuery,
  ISessionRepository,
} from '@domain/session/ISessionRepository';
import { Exercise } from '@domain/session/Exercise';
import { Session } from '@domain/session/Session';
import { PagedResponse } from '@domain/PagedResponse';

// Offline mock — swap in via ServiceLocator when EXPO_PUBLIC_USE_MOCK=true.
// Mirrors server business rules: running exercise is auto-finished when a new one starts.

const uuid = (): string => Math.random().toString(36).slice(2, 10);
const now = (): Date => new Date();

export class InMemorySessionRepository implements ISessionRepository {
  private sessions: Map<string, Session> = new Map();

  async create(userId: string, inheritFromSessionId?: string): Promise<Session> {
    let exercises: Exercise[] = [];

    if (inheritFromSessionId) {
      const source = this.sessions.get(inheritFromSessionId);
      if (source) {
        exercises = source.exercises.map(e => ({
          ...e,
          id: uuid(),
          status: 'Pending' as const,
          startedAt: undefined,
          realEndAt: undefined,
        }));
      }
    }

    const session: Session = {
      id: uuid(),
      userId,
      createdAt: now(),
      status: 'Active',
      inheritedFromSessionId: inheritFromSessionId,
      exercises,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async getById(sessionId: string): Promise<Session> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    return session;
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (!this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} not found`);
    }
    this.sessions.delete(sessionId);
  }

  async getActive(userId: string): Promise<Session | null> {
    const active = [...this.sessions.values()].find(
      s => s.userId === userId && s.status === 'Active',
    );
    return active ?? null;
  }

  async getSessions(query: GetSessionsQuery): Promise<PagedResponse<Session>> {
    let all = [...this.sessions.values()];

    // Filter
    if (query.userId) all = all.filter(s => s.userId === query.userId);
    if (query.status) all = all.filter(s => s.status === query.status);

    // Sort — default finishedAt:desc
    const [prop, dir] = (query.sort ?? 'finishedAt:desc').split(':');
    all.sort((a, b) => {
      const aVal = prop === 'finishedAt' ? (a.finishedAt?.getTime() ?? 0) : a.createdAt.getTime();
      const bVal = prop === 'finishedAt' ? (b.finishedAt?.getTime() ?? 0) : b.createdAt.getTime();
      return dir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    // Paginate — page is 1-based (matching server default)
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const totalCount = all.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const items = all.slice((page - 1) * pageSize, page * pageSize);

    return { items, page, pageSize, totalCount, totalPages };
  }

  async finish(sessionId: string): Promise<Session> {
    const session = await this.getById(sessionId);
    const exercises = session.exercises.map(e =>
      e.status === 'Running' ? { ...e, status: 'Finished' as const, realEndAt: now() } : e,
    );
    const updated: Session = { ...session, status: 'Finished', finishedAt: now(), exercises };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  async addExercise(sessionId: string, input: AddExerciseInput): Promise<Exercise> {
    const session = await this.getById(sessionId);
    const exercises = session.exercises.map(e =>
      e.status === 'Running' ? { ...e, status: 'Finished' as const, realEndAt: now() } : e,
    );
    const newExercise: Exercise = {
      id: uuid(),
      autoLabel: input.autoLabel,
      photoUrl: input.photoUrl,
      maxEndAt: input.maxEndAt,
      startedAt: now(),
      status: 'Running',
      properties: input.properties ?? [],
    };
    this.sessions.set(sessionId, { ...session, exercises: [...exercises, newExercise] });
    return newExercise;
  }

  async startExercise(sessionId: string, exerciseId: string, maxEndAt?: Date): Promise<Exercise> {
    const session = await this.getById(sessionId);
    let started: Exercise | undefined;
    const exercises = session.exercises.map(e => {
      if (e.status === 'Running') return { ...e, status: 'Finished' as const, realEndAt: now() };
      if (e.id === exerciseId) {
        started = { ...e, status: 'Running' as const, startedAt: now(), maxEndAt };
        return started;
      }
      return e;
    });
    if (!started) throw new Error(`Exercise ${exerciseId} not found`);
    this.sessions.set(sessionId, { ...session, exercises });
    return started;
  }

  async finishExercise(sessionId: string, exerciseId: string): Promise<Exercise> {
    const session = await this.getById(sessionId);
    let finished: Exercise | undefined;
    const exercises = session.exercises.map(e => {
      if (e.id === exerciseId) {
        finished = { ...e, status: 'Finished' as const, realEndAt: now() };
        return finished;
      }
      return e;
    });
    if (!finished) throw new Error(`Exercise ${exerciseId} not found`);
    this.sessions.set(sessionId, { ...session, exercises });
    return finished;
  }

  async deleteExercise(sessionId: string, exerciseId: string): Promise<void> {
    const session = await this.getById(sessionId);
    const exercises = session.exercises.filter(e => e.id !== exerciseId);
    this.sessions.set(sessionId, { ...session, exercises });
  }
}
