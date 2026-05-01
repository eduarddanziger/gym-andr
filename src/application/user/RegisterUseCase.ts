import { IUserRepository } from '@domain/user/IUserRepository';
import { User } from '@domain/user/User';

export class RegisterUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(email: string, name: string): Promise<User> {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    if (!trimmedEmail) throw new Error('Email is required');
    if (!trimmedName) throw new Error('Name is required');
    return this.userRepo.register(trimmedEmail, trimmedName);
  }
}
