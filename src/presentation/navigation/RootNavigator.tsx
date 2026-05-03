import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@presentation/context/AuthContext';
import { useTheme } from '@presentation/theme';
import { LoginScreen } from '@presentation/screens/LoginScreen';
import { RegisterScreen } from '@presentation/screens/RegisterScreen';
import { SessionHubScreen } from '@presentation/screens/SessionHubScreen';
import { ActiveSessionScreen } from '@presentation/screens/ActiveSessionScreen';
import { SessionDetailScreen } from '@presentation/screens/SessionDetailScreen';
import { SessionFinishedScreen } from '@presentation/screens/SessionFinishedScreen';
import { AddExerciseSheet } from '@presentation/screens/AddExerciseSheet';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();
  const theme = useTheme();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'slide_from_right',
        }}
      >
        {user === null ? (
          // ── Auth stack ────────────────────────────────────────────────────
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // ── App stack ─────────────────────────────────────────────────────
          <>
            <Stack.Screen name="SessionHub" component={SessionHubScreen} />
            <Stack.Screen name="ActiveSession" component={ActiveSessionScreen} />
            <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
            <Stack.Screen name="SessionFinished" component={SessionFinishedScreen} />

            {/* Modal — slides up over ActiveSessionScreen */}
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
              <Stack.Screen name="AddExercise" component={AddExerciseSheet} />
            </Stack.Group>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
