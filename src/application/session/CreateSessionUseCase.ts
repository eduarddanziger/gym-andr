import { ISessionRepository } from '@domain/session/ISessionRepository';
import { Session } from '@domain/session/Session';

export class CreateSessionUseCase {
  constructor(private readonly sessionRepo: ISessionRepository) {}

  async execute(userId: string): Promise<Session> {
    return this.sessionRepo.create(userId);
  }
}
