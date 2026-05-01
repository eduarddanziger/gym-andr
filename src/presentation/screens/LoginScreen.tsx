import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '@presentation/context/AuthContext';
import { useTheme } from '@presentation/theme';

// Navigation — typed once React Navigation is wired in RootNavigator
// For now uses a callback prop so the screen is testable standalone
export interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const theme = useTheme();
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');

  const styles = makeStyles(theme);

  const handleLogin = async (): Promise<void> => {
    if (!email.trim()) return;
    try {
      await login(email.trim());
      onLoginSuccess();
    } catch {
      // error is already in AuthContext state — displayed below
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.wordmark}>KISS GYM</Text>
          <Text style={styles.tagline}>track. lift. repeat.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={theme.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            onSubmitEditing={handleLogin}
            returnKeyType="go"
            editable={!isLoading}
          />

          {/* Error */}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Login button */}
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={handleLogin}
            disabled={isLoading || !email.trim()}
          >
            {isLoading ? (
              <ActivityIndicator color={styles.buttonText.color} />
            ) : (
              <Text style={styles.buttonText}>Log in</Text>
            )}
          </Pressable>
        </View>

        {/* Footer hint */}
        <Text style={styles.footer}>No account yet? Just log in — one will be created.</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const makeStyles = (
  theme: ReturnType<typeof import('@presentation/theme').useTheme>,
): ReturnType<typeof StyleSheet.create> =>
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
    header: {
      gap: 6,
    },
    wordmark: {
      fontSize: 42,
      fontWeight: '800',
      letterSpacing: 6,
      color: theme.accent,
    },
    tagline: {
      fontSize: 13,
      letterSpacing: 2,
      color: theme.textSecondary,
      textTransform: 'uppercase',
    },
    form: {
      gap: 10,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: theme.textSecondary,
      marginBottom: 2,
    },
    input: {
      height: 52,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 16,
      fontSize: 16,
      color: theme.textPrimary,
    },
    error: {
      fontSize: 13,
      color: theme.danger,
      marginTop: 2,
    },
    button: {
      height: 54,
      backgroundColor: theme.accent,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    buttonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#0E0E0F', // always dark — accent is bright on both schemes
      letterSpacing: 0.5,
    },
    footer: {
      fontSize: 13,
      color: theme.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
