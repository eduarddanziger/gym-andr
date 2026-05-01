import { Exercise } from './Exercise';
import { isFinished, isPending, isRunning } from './ExerciseStatus';

export type SessionStatus = 'Active' | 'Finished';

// Aggregate Root — owns the Exercise collection lifecycle
export interface Session {
  readonly id: string;
  readonly userId: string;
  readonly createdAt: Date;
  readonly finishedAt?: Date;
  readonly status: SessionStatus;
  readonly inheritedFromSessionId?: string;
  readonly exercises: Exercise[];
}

// Derived queries — keep business logic in domain, not in components

export const isActive = (session: Session): boolean => session.status === 'Active';

export const runningExercise = (session: Session): Exercise | undefined =>
  session.exercises.find(e => isRunning(e.status));

export const pendingExercises = (session: Session): Exercise[] =>
  session.exercises.filter(e => isPending(e.status));

export const finishedExercises = (session: Session): Exercise[] =>
  session.exercises.filter(e => isFinished(e.status));

export const durationSeconds = (session: Session): number => {
  const end = session.finishedAt ?? new Date();
  return Math.floor((end.getTime() - session.createdAt.getTime()) / 1000);
};
