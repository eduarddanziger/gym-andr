import { IUserRepository } from '@domain/user/IUserRepository';
import { User } from '@domain/user/User';

export class RegisterUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(email: string, name: string): Promise<User> {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    if (!trimmedEmail) throw new Error('Email is required');
    if (!trimmedName) throw new Error('Name is required');
    try {
      return await this.userRepo.register(trimmedEmail, trimmedName);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes('400') || msg.toLowerCase().includes('bad request')) {
        throw new Error('This email is already registered. Try logging in instead.');
      }
      throw e;
    }
  }
}
