import { AuthProvider, useAuth } from '@presentation/context/AuthContext';
import { LoginScreen } from '@presentation/screens/LoginScreen';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, View } from 'react-native';

const AppInner: React.FC = () => {
  const { user } = useAuth();

  if (user) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 18 }}>✅ Logged in as {user.name}</Text>
      </View>
    );
  }

  return <LoginScreen onLoginSuccess={() => {}} />;
};

export default function App(): React.ReactElement {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppInner />
    </AuthProvider>
  );
}
