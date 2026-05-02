import { IUserRepository } from '@domain/user/IUserRepository';
import { User } from '@domain/user/User';

// Dev: server mocks auth by email only — no password.
// Production: Supabase handles auth; this use case will call supabase.auth.signIn instead.
export class LoginUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(email: string): Promise<User> {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) throw new Error('Email is required');
    try {
      return await this.userRepo.login(trimmed);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
        throw new Error('No account found. Please register.');
      }
      throw e;
    }
  }
}
