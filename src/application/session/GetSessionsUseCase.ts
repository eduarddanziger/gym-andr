import { GetSessionsQuery, ISessionRepository } from '@domain/session/ISessionRepository';
import { Session } from '@domain/session/Session';
import { PagedResponse } from '@domain/PagedResponse';

// Returns a paged list of sessions matching the query.
// Used by SessionHubScreen to populate the session list.
export class GetSessionsUseCase {
  constructor(private readonly sessionRepo: ISessionRepository) {}

  async execute(query: GetSessionsQuery): Promise<PagedResponse<Session>> {
    return this.sessionRepo.getSessions(query);
  }
}
