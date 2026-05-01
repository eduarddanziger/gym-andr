// Entity — Generic context (User Management)
// Kept intentionally minimal per YAGNI — no roles, no avatars, no preferences yet
export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
}
