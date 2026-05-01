import { IUserRepository } from '@domain/user/IUserRepository';
import { User } from '@domain/user/User';

// Called on app startup to restore the authenticated user from SecureStore userId
export class GetCurrentUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(): Promise<User> {
    return this.userRepo.getMe();
  }
}
