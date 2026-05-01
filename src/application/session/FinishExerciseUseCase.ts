import { ISessionRepository } from '@domain/session/ISessionRepository';
import { Exercise } from '@domain/session/Exercise';

export class FinishExerciseUseCase {
  constructor(private readonly sessionRepo: ISessionRepository) {}

  async execute(sessionId: string, exerciseId: string): Promise<Exercise> {
    return this.sessionRepo.finishExercise(sessionId, exerciseId);
  }
}
