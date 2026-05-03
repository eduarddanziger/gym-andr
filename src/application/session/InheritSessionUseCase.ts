import { ISessionRepository } from '@domain/session/ISessionRepository';
import { Session } from '@domain/session/Session';
import { generateSessionLabel } from './CreateSessionUseCase';

// Copies exercises from a previous session as Pending.
// Auto-names the copy with the current time slot + weekday if no label provided.
export class InheritSessionUseCase {
  constructor(private readonly sessionRepo: ISessionRepository) {}

  async execute(userId: string, inheritFromSessionId: string, label?: string): Promise<Session> {
    const autoLabel = label ?? generateSessionLabel();
    return this.sessionRepo.create(userId, autoLabel, inheritFromSessionId);
  }
}
