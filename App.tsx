import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@presentation/context/AuthContext';
import { SessionProvider } from '@presentation/context/SessionContext';
import { RootNavigator } from '@presentation/navigation/RootNavigator';

// Provider order matters:
// AuthProvider must wrap SessionProvider — SessionContext reads useAuth()
export default function App(): React.ReactElement {
  return (
    <AuthProvider>
      <SessionProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </SessionProvider>
    </AuthProvider>
  );
}
