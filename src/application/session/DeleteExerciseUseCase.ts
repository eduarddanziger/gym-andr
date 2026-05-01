import { ISessionRepository } from '@domain/session/ISessionRepository';

// Removes a Pending or Running exercise from an active session.
// Server returns 409 if the session is already finished.
export class DeleteExerciseUseCase {
  constructor(private readonly sessionRepo: ISessionRepository) {}

  async execute(sessionId: string, exerciseId: string): Promise<void> {
    return this.sessionRepo.deleteExercise(sessionId, exerciseId);
  }
}
