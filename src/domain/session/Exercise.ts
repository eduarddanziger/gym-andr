import { ExerciseProperty } from './ExerciseProperty';
import { ExerciseStatus } from './ExerciseStatus';

// Entity — identified by id, lifecycle managed by Session aggregate
export interface Exercise {
  readonly id: string;
  readonly autoLabel: string;
  readonly photoUrl?: string;
  readonly startedAt?: Date;
  readonly maxEndAt?: Date;
  readonly realEndAt?: Date;
  readonly status: ExerciseStatus;
  readonly properties: ExerciseProperty[];
}

// Derive elapsed seconds for a running exercise (UI timer)
