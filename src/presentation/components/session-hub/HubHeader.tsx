import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppTheme, useTheme } from '@presentation/theme';

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Props ─────────────────────────────────────────────────────────────────────

interface HubHeaderProps {
  userName: string;
  onLogout: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const HubHeader: React.FC<HubHeaderProps> = ({ userName, onLogout }) => {
  const theme = useTheme();
  const s = styles(theme);

  const handleMenuPress = (): void => {
    Alert.alert('Menu', undefined, [
      { text: 'Log out', style: 'destructive', onPress: onLogout },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={s.header}>
      <View style={s.textBlock}>
        <View style={s.nameRow}>
          <Text style={s.userIcon}>👤</Text>
          <Text style={s.userName}>{userName}</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [s.menuBtn, pressed && s.menuBtnPressed]}
        onPress={handleMenuPress}
        hitSlop={12}
      >
        <Text style={s.menuIcon}>≡</Text>
      </Pressable>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = (theme: AppTheme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 52,
      paddingBottom: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.border,
      gap: 12,
    },
    textBlock: {
      flex: 1,
      gap: 2,
    },
    userName: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    sessionLine: {
      fontSize: 12,
      color: theme.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    sessionLineActive: {
      color: theme.accent,
    },
    menuBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.surface,
      borderWidth: 0.5,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    menuBtnPressed: {
      opacity: 0.7,
    },
    menuIcon: {
      fontSize: 18,
      color: theme.textSecondary,
      lineHeight: 22,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    userIcon: {
      fontSize: 14,
    },
  });
