import { ISessionRepository } from '@domain/session/ISessionRepository';
import { Session } from '@domain/session/Session';

// ── Auto-naming ───────────────────────────────────────────────────────────────
// Generates a contemporary label when the user does not provide one.
// Format: "Morning · Monday", "Evening · Friday", etc.
// Pure function — no side effects, easily testable.

const getTimeSlot = (hour: number): string => {
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
};

export const generateSessionLabel = (): string => {
  const now = new Date();
  const slot = getTimeSlot(now.getHours());
  const day = now.toLocaleDateString(undefined, { weekday: 'long' });
  return `${slot} · ${day}`;
};

// ── Use case ──────────────────────────────────────────────────────────────────

export class CreateSessionUseCase {
  constructor(private readonly sessionRepo: ISessionRepository) {}

  async execute(userId: string, label?: string): Promise<Session> {
    const autoLabel = label ?? generateSessionLabel();
    return this.sessionRepo.create(userId, autoLabel);
  }
}
