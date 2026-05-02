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
import { SessionFinishedScreen } from '@presentation/screens/SessionFinishedScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Auth guard lives here — screens never check auth state themselves.
// When user logs in → AuthContext updates → navigator re-renders → app stack shown.
// When user logs out → auth stack shown automatically.

export const RootNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();
  const theme = useTheme();

  // Splash — restore from SecureStore on startup
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
          headerShown: false, // all screens are full-bleed
          contentStyle: { backgroundColor: theme.background },
          animation: 'slide_from_right',
        }}
      >
        {user === null ? (
          // ── Auth stack (unauthenticated) ──────────────────────────────────
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // ── App stack (authenticated) ─────────────────────────────────────
          <>
            <Stack.Screen name="SessionHub" component={SessionHubScreen} />
            <Stack.Screen name="ActiveSession" component={ActiveSessionScreen} />
            <Stack.Screen name="SessionFinished" component={SessionFinishedScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
