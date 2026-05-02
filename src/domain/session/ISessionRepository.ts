import { Exercise } from './Exercise';
import { Session, SessionStatus } from './Session';
import { PagedResponse } from '../PagedResponse';

// Input shape for adding a new exercise (mirrors OpenAPI AddExerciseRequest)
export interface AddExerciseInput {
  autoLabel: string;
  photoUrl?: string;
  maxEndAt?: Date;
  properties?: { name: string; value: string }[];
}

// Query params for GET /api/sessions
// sort format: 'property[:asc|desc]' — supported: finishedAt, createdAt
// Example: 'finishedAt:desc'
export interface GetSessionsQuery {
  userId?: string;
  status?: SessionStatus;
  sort?: string;
  page?: number;
  pageSize?: number;
}

// Repository interface — Dependency Inversion boundary.
// Domain defines the contract; Infrastructure implements it.
// NO fetch(), NO HTTP details here.
export interface ISessionRepository {
  create(userId: string, inheritFromSessionId?: string): Promise<Session>;
  getById(sessionId: string): Promise<Session>;
  deleteSession(sessionId: string): Promise<void>;
  finish(sessionId: string): Promise<Session>;

  // Returns first active session for userId, or null if none exists.
  // Calls GET /api/sessions/active — takes items[0] ?? null.
  getActive(userId: string): Promise<Session | null>;

  // Returns paged list of sessions — supports status filter and sort.
  getSessions(query: GetSessionsQuery): Promise<PagedResponse<Session>>;

  addExercise(sessionId: string, input: AddExerciseInput): Promise<Exercise>;
  startExercise(sessionId: string, exerciseId: string, maxEndAt?: Date): Promise<Exercise>;
  finishExercise(sessionId: string, exerciseId: string): Promise<Exercise>;
  deleteExercise(sessionId: string, exerciseId: string): Promise<void>;
}
