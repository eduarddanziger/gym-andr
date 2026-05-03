import { ISessionRepository } from '@domain/session/ISessionRepository';
import { Session } from '@domain/session/Session';

export class RenameSessionUseCase {
  constructor(private readonly sessionRepo: ISessionRepository) {}

  async execute(sessionId: string, label: string): Promise<Session> {
    return this.sessionRepo.renameSession(sessionId, label);
  }
}
