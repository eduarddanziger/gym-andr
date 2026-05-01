import { IUserRepository } from '@domain/user/IUserRepository';
import { User } from '@domain/user/User';

const uuid = (): string => Math.random().toString(36).slice(2, 10);

export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();
  private currentUserId: string | null = null;

  async login(email: string): Promise<User> {
    // Find by email or auto-register for convenience in mock mode
    const existing = [...this.users.values()].find(u => u.email === email);
    if (existing) {
      this.currentUserId = existing.id;
      return existing;
    }
    return this.register(email, email.split('@')[0] ?? 'Athlete');
  }

  async register(email: string, name: string): Promise<User> {
    const user: User = { id: uuid(), email, name };
    this.users.set(user.id, user);
    this.currentUserId = user.id;
    return user;
  }

  async getMe(): Promise<User> {
    if (!this.currentUserId) throw new Error('Not authenticated');
    const user = this.users.get(this.currentUserId);
    if (!user) throw new Error('User not found');
    return user;
  }
}
