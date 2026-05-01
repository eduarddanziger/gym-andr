import { AddExerciseInput, ISessionRepository } from '@domain/session/ISessionRepository';
import { Exercise } from '@domain/session/Exercise';

// Adds a new exercise and starts it immediately.
// Any currently running exercise is auto-finished by the server.
export class AddExerciseUseCase {
  constructor(private readonly sessionRepo: ISessionRepository) {}

  async execute(sessionId: string, input: AddExerciseInput): Promise<Exercise> {
    if (!input.autoLabel.trim()) {
      throw new Error('Exercise name is required');
    }
    return this.sessionRepo.addExercise(sessionId, input);
  }
}
