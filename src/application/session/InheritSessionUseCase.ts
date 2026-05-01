import { ISessionRepository } from '@domain/session/ISessionRepository';
import { Session } from '@domain/session/Session';

// Copies exercises from a previous session as Pending — user starts them one by one
export class InheritSessionUseCase {
  constructor(private readonly sessionRepo: ISessionRepository) {}

  async execute(userId: string, inheritFromSessionId: string): Promise<Session> {
    return this.sessionRepo.create(userId, inheritFromSessionId);
  }
}
