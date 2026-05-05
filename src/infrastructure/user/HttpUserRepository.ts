import { apiRequest, setCurrentUserId } from '@infrastructure/api/ApiClient';
import { IUserRepository } from '@domain/user/IUserRepository';
import { User } from '@domain/user/User';
import * as SecureStore from 'expo-secure-store';

const USER_ID_KEY = 'gym_andr_user_id';
const LAST_LOGIN_EMAIL_KEY = 'gym_andr_last_login_email';

const mapUser = (raw: Record<string, unknown>): User => ({
  id: raw['id'] as string,
  email: raw['email'] as string,
  name: raw['name'] as string,
});

export class HttpUserRepository implements IUserRepository {
  async login(email: string): Promise<User> {
    const raw = await apiRequest<Record<string, unknown>>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    const user = mapUser(raw);
    // Persist userId so app can restore auth on next launch
    await SecureStore.setItemAsync(USER_ID_KEY, user.id);
    await SecureStore.setItemAsync(LAST_LOGIN_EMAIL_KEY, user.email);
    setCurrentUserId(user.id);
    return user;
  }

  async register(email: string, name: string): Promise<User> {
    const raw = await apiRequest<Record<string, unknown>>('/api/users/register', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
    const user = mapUser(raw);
    await SecureStore.setItemAsync(USER_ID_KEY, user.id);
    await SecureStore.setItemAsync(LAST_LOGIN_EMAIL_KEY, user.email);
    setCurrentUserId(user.id);
    return user;
  }

  async getMe(): Promise<User> {
    const raw = await apiRequest<Record<string, unknown>>('/api/users/me');
    return mapUser(raw);
  }

  // Called by AuthContext on startup
  static async restoreUserId(): Promise<string | null> {
    const userId = await SecureStore.getItemAsync(USER_ID_KEY);
    if (userId) setCurrentUserId(userId);
    return userId;
  }

  static async clearUserId(): Promise<void> {
    await SecureStore.deleteItemAsync(USER_ID_KEY);
    setCurrentUserId(null);
  }

  static async restoreLastLoginEmail(): Promise<string | null> {
    return SecureStore.getItemAsync(LAST_LOGIN_EMAIL_KEY);
  }
}
