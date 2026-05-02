import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useAuth } from '@presentation/context/AuthContext';
import { AppTheme, useTheme } from '@presentation/theme';
import {
  AuthError,
  AuthField,
  AuthWordmark,
  GhostButton,
  PrimaryButton,
} from '@presentation/components/AuthComponents';
import { RegisterScreenProps } from '@presentation/navigation/types';

// Single Responsibility: this screen owns registration flow only.
// Supabase migration: only RegisterUseCase changes, this screen stays as-is.

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { register, isLoading, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Ref lets "Next" on the name keyboard jump focus to email field
  const emailRef = useRef<TextInput>(null);

  const s = styles(theme);

  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && !isLoading;

  const handleRegister = async (): Promise<void> => {
    if (!canSubmit) return;
    try {
      await register(email.trim(), name.trim());
      // RootNavigator auth guard navigates to SessionHub automatically
    } catch {
      // error state is in AuthContext — displayed by AuthError below
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.inner}>
        <AuthWordmark theme={theme} subtitle="create your account" />

        <View style={s.form}>
          <AuthField
            label="Name"
            theme={theme}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            editable={!isLoading}
          />

          <AuthField
            label="Email"
            theme={theme}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={handleRegister}
            editable={!isLoading}
            // @ts-expect-error — ref forwarding via TextInputProps
            ref={emailRef}
          />

          <AuthError message={error} theme={theme} />

          <PrimaryButton
            label="Create account"
            onPress={handleRegister}
            isLoading={isLoading}
            disabled={!canSubmit}
            theme={theme}
          />
        </View>

        <GhostButton
          label="Already have an account? Log in"
          onPress={() => navigation.goBack()}
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
