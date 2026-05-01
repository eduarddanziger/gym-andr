import { ISessionRepository } from '@domain/session/ISessionRepository';

export class DeleteSessionUseCase {
  constructor(private readonly sessionRepo: ISessionRepository) {}

  async execute(sessionId: string): Promise<void> {
    return this.sessionRepo.deleteSession(sessionId);
  }
}
