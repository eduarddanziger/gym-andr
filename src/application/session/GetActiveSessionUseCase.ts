import { ISessionRepository } from '@domain/session/ISessionRepository';
import { Session } from '@domain/session/Session';

// Returns the user's current active session, or null if there is none.
// Used by RootNavigator on startup: active session → go directly to ActiveSessionScreen.
export class GetActiveSessionUseCase {
  constructor(private readonly sessionRepo: ISessionRepository) {}

  async execute(userId: string): Promise<Session | null> {
    return this.sessionRepo.getActive(userId);
  }
}
