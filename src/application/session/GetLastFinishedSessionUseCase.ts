import { ISessionRepository } from '@domain/session/ISessionRepository';
import { Session } from '@domain/session/Session';

// Returns the most recently finished session for the user, or null if none.
// Used by SessionHub to show the summary card and enable the Repeat CTA.
export class GetLastFinishedSessionUseCase {
  constructor(private readonly sessionRepo: ISessionRepository) {}

  async execute(userId: string): Promise<Session | null> {
    const result = await this.sessionRepo.getSessions({
      userId,
      status: 'Finished',
      sort: 'finishedAt:desc',
      page: 1,
      pageSize: 1,
    });
    return result.items[0] ?? null;
  }
}
