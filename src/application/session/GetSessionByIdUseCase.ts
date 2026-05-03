import { ISessionRepository } from '@domain/session/ISessionRepository';
import { Session } from '@domain/session/Session';

// Fetches a single session by ID.
// Used by ActiveSessionScreen when coming from SessionHub "Continue" —
// the session may not yet be in SessionContext.
export class GetSessionByIdUseCase {
  constructor(private readonly sessionRepo: ISessionRepository) {}

  async execute(sessionId: string): Promise<Session> {
    return this.sessionRepo.getById(sessionId);
  }
}
