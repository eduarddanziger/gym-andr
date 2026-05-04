import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Session, isActive } from '@domain/session/Session';
import { AppTheme } from '@presentation/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SessionListItemProps {
  session: Session;
  isLatestFinished: boolean;
  onPress: () => void;
  theme: AppTheme;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const SessionListItem: React.FC<SessionListItemProps> = ({
  session,
  isLatestFinished,
  onPress,
  theme,
}) => {
  const active = isActive(session);
  const s = itemStyles(theme, active, isLatestFinished);

  return (
    <Pressable style={({ pressed }) => [s.item, pressed && s.pressed]} onPress={onPress}>
      <View style={s.left}>
        {/* Status pill */}
        <View style={s.pill}>
          {active && <View style={s.pillDot} />}
          <Text style={s.pillLabel}>
            {active ? 'Active' : isLatestFinished ? 'Latest' : 'Finished'}
          </Text>
        </View>
        {/* Label (if set) */}
        {session.label ? (
          <Text style={s.label} numberOfLines={1}>
            {session.label}
          </Text>
        ) : null}
        {/* Date */}
        <Text style={s.date}>{formatDate(session.createdAt)}</Text>
        {/* Exercise count */}
        <Text style={s.count}>
          {session.exercises.length} {session.exercises.length === 1 ? 'exercise' : 'exercises'}
        </Text>
      </View>
      <Text style={s.arrow}>›</Text>
    </Pressable>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (date: Date): string =>
  new Date(date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

// ── Styles ────────────────────────────────────────────────────────────────────

const itemStyles = (
  theme: AppTheme,
  active: boolean,
  isLatest: boolean,
): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    item: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: active ? theme.accent : isLatest ? '#534AB7' : theme.border,
      borderRadius: 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    pressed: {
      opacity: 0.8,
    },
    left: {
      flex: 1,
      gap: 2,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      borderRadius: 4,
      paddingHorizontal: 7,
      paddingVertical: 2,
      marginBottom: 4,
      backgroundColor: active ? '#0F6E56' : isLatest ? '#534AB7' : theme.border,
    },
    pillDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: '#5DCAA5',
    },
    pillLabel: {
      fontSize: 9,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: active ? '#9FE1CB' : isLatest ? '#AFA9EC' : theme.textSecondary,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    date: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    count: {
      fontSize: 11,
      color: theme.textMuted,
    },
    arrow: {
      fontSize: 18,
      color: theme.textMuted,
      marginLeft: 8,
    },
  });
