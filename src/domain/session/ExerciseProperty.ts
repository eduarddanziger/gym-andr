// Value Object — immutable key/value pair attached to an Exercise
// Examples: { name: 'weight', value: '80kg' }, { name: 'reps', value: '12' }
export interface ExerciseProperty {
  readonly name: string;
  readonly value: string;
}
