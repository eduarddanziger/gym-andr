import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  SessionHub: undefined;
  ActiveSession: { sessionId: string };
  SessionDetail: { sessionId: string };
  SessionFinished: { sessionId: string };
  // Modal — presented over ActiveSessionScreen
  AddExercise: { sessionId: string };
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
export type AddExerciseScreenProps = NativeStackScreenProps<RootStackParamList, 'AddExercise'>;
