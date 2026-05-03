import { ISessionRepository } from '@domain/session/ISessionRepository';
import { Session } from '@domain/session/Session';

export class RenameSessionUseCase {
  constructor(private readonly sessionRepo: ISessionRepository) {}

  async execute(sessionId: string, label: string): Promise<Session> {
    const trimmed = label.trim();
    if (!trimmed) throw new Error('Label cannot be empty');
    return this.sessionRepo.renameSession(sessionId, trimmed);
  }
}
