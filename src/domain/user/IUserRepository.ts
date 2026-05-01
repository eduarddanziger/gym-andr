import { User } from './User';

// Repository interface — User Management bounded context.
// Note: login is mocked server-side in dev (no password).
// In production, auth token comes from Supabase directly.
export interface IUserRepository {
  login(email: string): Promise<User>;
  register(email: string, name: string): Promise<User>;
  getMe(): Promise<User>;
}
