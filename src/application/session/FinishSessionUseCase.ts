import { ISessionRepository } from '@domain/session/ISessionRepository';
import { Session } from '@domain/session/Session';

// Finishes the session. Any running exercise is auto-finished by the server first.
export class FinishSessionUseCase {
  constructor(private readonly sessionRepo: ISessionRepository) {}

  async execute(sessionId: string): Promise<Session> {
    return this.sessionRepo.finish(sessionId);
  }
}
