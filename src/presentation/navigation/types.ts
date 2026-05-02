// Shared navigation param list — single source of truth for all screen params.
// Import this in every screen and navigator — never use untyped navigation.
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  SessionHub: undefined;
  ActiveSession: { sessionId: string };
  SessionFinished: { sessionId: string };
};

// Per-screen prop types — use these in screen components
export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;
export type SessionHubScreenProps = NativeStackScreenProps<RootStackParamList, 'SessionHub'>;
export type ActiveSessionScreenProps = NativeStackScreenProps<RootStackParamList, 'ActiveSession'>;
export type SessionFinishedScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'SessionFinished'
>;
