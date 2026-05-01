// Value Object — no framework deps, plain TypeScript
export type ExerciseStatus = 'Pending' | 'Running' | 'Finished';

export const isRunning = (s: ExerciseStatus): boolean => s === 'Running';
export const isFinished = (s: ExerciseStatus): boolean => s === 'Finished';
export const isPending = (s: ExerciseStatus): boolean => s === 'Pending';
