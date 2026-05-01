import { Exercise } from './Exercise';
import { Session } from './Session';

// Input shape for adding a new exercise (mirrors OpenAPI AddExerciseRequest)
export interface AddExerciseInput {
  autoLabel: string;
  photoUrl?: string;
  maxEndAt?: Date;
  properties?: { name: string; value: string }[];
}

// Repository interface — Dependency Inversion boundary.
// Domain defines the contract; Infrastructure implements it.
// NO fetch(), NO HTTP details here.
export interface ISessionRepository {
  create(userId: string, inheritFromSessionId?: string): Promise<Session>;
  getById(sessionId: string): Promise<Session>;
  deleteSession(sessionId: string): Promise<void>;
  finish(sessionId: string): Promise<Session>;
  addExercise(sessionId: string, input: AddExerciseInput): Promise<Exercise>;
  startExercise(sessionId: string, exerciseId: string, maxEndAt?: Date): Promise<Exercise>;
  finishExercise(sessionId: string, exerciseId: string): Promise<Exercise>;
  deleteExercise(sessionId: string, exerciseId: string): Promise<void>;
}
