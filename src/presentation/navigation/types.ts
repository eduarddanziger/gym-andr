import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  SessionHub: undefined;
  ActiveSession: { sessionId: string };
  SessionDetail: { sessionId: string }; // ← read-only view of a finished session
  SessionFinished: { sessionId: string };
};

export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;
export type SessionHubScreenProps = NativeStackScreenProps<RootStackParamList, 'SessionHub'>;
export type ActiveSessionScreenProps = NativeStackScreenProps<RootStackParamList, 'ActiveSession'>;
export type SessionDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'SessionDetail'>;
export type SessionFinishedScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'SessionFinished'
>;
