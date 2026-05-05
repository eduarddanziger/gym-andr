// Dependency Injection wiring — no framework, just a plain object.
// Swap HTTP ↔ InMemory by setting EXPO_PUBLIC_USE_MOCK=true in .env

import { HttpSessionRepository } from '@infrastructure/session/HttpSessionRepository';
import { HttpUserRepository } from '@infrastructure/user/HttpUserRepository';
import { InMemorySessionRepository } from '@infrastructure/session/InMemorySessionRepository';
import { InMemoryUserRepository } from '@infrastructure/user/InMemoryUserRepository';

import { CreateSessionUseCase } from '@application/session/CreateSessionUseCase';
import { InheritSessionUseCase } from '@application/session/InheritSessionUseCase';
import { RenameSessionUseCase } from '@application/session/RenameSessionUseCase';
import { DeleteSessionUseCase } from '@application/session/DeleteSessionUseCase';
import { AddExerciseUseCase } from '@application/session/AddExerciseUseCase';
import { StartExerciseUseCase } from '@application/session/StartExerciseUseCase';
import { FinishExerciseUseCase } from '@application/session/FinishExerciseUseCase';
import { DeleteExerciseUseCase } from '@application/session/DeleteExerciseUseCase';
import { FinishSessionUseCase } from '@application/session/FinishSessionUseCase';
import { GetActiveSessionUseCase } from '@application/session/GetActiveSessionUseCase';
import { GetLastFinishedSessionUseCase } from '@application/session/GetLastFinishedSessionUseCase';
import { GetSessionsUseCase } from '@application/session/GetSessionsUseCase';
import { GetSessionByIdUseCase } from '@application/session/GetSessionByIdUseCase';
import { LoginUseCase } from '@application/user/LoginUseCase';
import { RegisterUseCase } from '@application/user/RegisterUseCase';
import { GetCurrentUserUseCase } from '@application/user/GetCurrentUserUseCase';

const useMock = process.env['EXPO_PUBLIC_USE_MOCK'] === 'true';

const sessionRepo = useMock ? new InMemorySessionRepository() : new HttpSessionRepository();
const userRepo = useMock ? new InMemoryUserRepository() : new HttpUserRepository();

export const serviceLocator = {
  // Session use cases
  createSession: new CreateSessionUseCase(sessionRepo),
  inheritSession: new InheritSessionUseCase(sessionRepo),
  renameSession: new RenameSessionUseCase(sessionRepo),
  deleteSession: new DeleteSessionUseCase(sessionRepo),
  getSessionById: new GetSessionByIdUseCase(sessionRepo),
  addExercise: new AddExerciseUseCase(sessionRepo),
  startExercise: new StartExerciseUseCase(sessionRepo),
  finishExercise: new FinishExerciseUseCase(sessionRepo),
  deleteExercise: new DeleteExerciseUseCase(sessionRepo),
  finishSession: new FinishSessionUseCase(sessionRepo),
  getActiveSession: new GetActiveSessionUseCase(sessionRepo),
  getLastFinishedSession: new GetLastFinishedSessionUseCase(sessionRepo),
  getSessions: new GetSessionsUseCase(sessionRepo),

  // User use cases
  login: new LoginUseCase(userRepo),
  register: new RegisterUseCase(userRepo),
  getCurrentUser: new GetCurrentUserUseCase(userRepo),

  // Auth persistence helpers
  restoreUserId: (): Promise<string | null> =>
    useMock ? Promise.resolve(null) : HttpUserRepository.restoreUserId(),

  clearUserId: (): Promise<void> =>
    useMock ? Promise.resolve() : HttpUserRepository.clearUserId(),

  restoreLastLoginEmail: (): Promise<string | null> =>
    useMock ? Promise.resolve(null) : HttpUserRepository.restoreLastLoginEmail(),
} as const;
