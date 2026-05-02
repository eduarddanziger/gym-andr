import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useAuth } from '@presentation/context/AuthContext';
import { AppTheme, useTheme } from '@presentation/theme';
import {
  AuthError,
  AuthField,
  AuthWordmark,
  GhostButton,
  PrimaryButton,
} from '@presentation/components/AuthComponents';
import { LoginScreenProps } from '@presentation/navigation/types';

// Single Responsibility: this screen owns login flow only.
// Registration → RegisterScreen (navigate via stack).
// Supabase migration: only LoginUseCase changes, this screen stays as-is.

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');

  const s = styles(theme);

  const canSubmit = email.trim().length > 0 && !isLoading;

  const handleLogin = async (): Promise<void> => {
    if (!canSubmit) return;
    try {
      await login(email.trim());
      // Navigation to SessionHub is handled by RootNavigator auth guard —
      // once user is set in AuthContext, navigator re-renders automatically.
    } catch {
      // error state is in AuthContext — displayed by AuthError below
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.inner}>
        <AuthWordmark theme={theme} subtitle="track. lift. repeat." />

        <View style={s.form}>
          <AuthField
            label="Email"
            theme={theme}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            returnKeyType="go"
            onSubmitEditing={handleLogin}
            editable={!isLoading}
          />

          <AuthError message={error} theme={theme} />

          <PrimaryButton
            label="Log in"
            onPress={handleLogin}
            isLoading={isLoading}
            disabled={!canSubmit}
            theme={theme}
          />
        </View>

        <GhostButton
          label="No account yet? Register"
          onPress={() => navigation.navigate('Register')}
          theme={theme}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = (theme: AppTheme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background,
    },
    inner: {
      flex: 1,
      paddingHorizontal: 28,
      justifyContent: 'center',
      gap: 32,
    },
    form: {
      gap: 12,
    },
  });
