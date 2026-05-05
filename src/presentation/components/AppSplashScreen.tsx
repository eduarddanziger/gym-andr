import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppTheme, useTheme } from '@presentation/theme';

export const AppSplashScreen: React.FC = () => {
  const theme = useTheme();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const s = styles(theme);

  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds(seconds => seconds + 1), 1000);
    return (): void => {
      clearInterval(interval);
    };
  }, []);

  return (
    <View style={s.root}>
      <View style={s.content}>
        <Text style={s.wordmark}>KISS GYM</Text>
        <Text style={s.subtitle}>TRACK. LIFT. REPEAT.</Text>

        <View
          style={s.barWrap}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <View style={s.plateLeft} />
          <View style={s.barTrack}>
            <View style={s.barAccent} />
            <View style={[s.grip, s.gripLeft]} />
            <View style={[s.grip, s.gripRight]} />
          </View>
          <View style={s.plateRight} />
        </View>

        <Text style={s.timer}>{formatElapsed(elapsedSeconds)}</Text>
        <Text style={s.status}>Warming up your session...</Text>
      </View>
    </View>
  );
};

const formatElapsed = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const styles = (theme: AppTheme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    root: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.background,
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: 32,
      transform: [{ translateY: -28 }],
    },
    wordmark: {
      fontSize: 32,
      fontWeight: '800',
      letterSpacing: 4,
      color: theme.textPrimary,
    },
    subtitle: {
      marginTop: 8,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 1.8,
      color: theme.textSecondary,
    },
    barWrap: {
      marginTop: 38,
      width: 212,
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    plateLeft: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 2,
      borderColor: theme.border,
      marginRight: -8,
      zIndex: 1,
    },
    plateRight: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 2,
      borderColor: theme.border,
      marginLeft: -8,
      zIndex: 1,
    },
    barTrack: {
      width: 164,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.border,
      overflow: 'hidden',
    },
    barAccent: {
      width: 54,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.accent,
    },
    grip: {
      position: 'absolute',
      top: -2,
      width: 10,
      height: 12,
      borderRadius: 2,
      backgroundColor: theme.isDark ? '#3A3A35' : '#D0D0D2',
    },
    gripLeft: {
      left: 68,
    },
    gripRight: {
      left: 104,
    },
    timer: {
      marginTop: 34,
      fontSize: 44,
      fontWeight: '200',
      letterSpacing: 2,
      color: theme.accent,
      fontVariant: ['tabular-nums'],
    },
    status: {
      marginTop: 14,
      fontSize: 13,
      fontWeight: '500',
      color: theme.textSecondary,
      textAlign: 'center',
    },
  });
