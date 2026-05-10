import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Session, isActive } from '@domain/session/Session';
import { AppTheme, useTheme } from '@presentation/theme';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (date: Date): string =>
  new Date(date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

// ── Props ─────────────────────────────────────────────────────────────────────

interface HubSessionItemProps {
  session: Session;
  isSelected: boolean;
  onSelect: () => void;
  onNavigate: () => void;
  onDelete: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const HubSessionItem: React.FC<HubSessionItemProps> = ({
  session,
  isSelected,
  onSelect,
  onNavigate,
  onDelete,
}) => {
  const theme = useTheme();
  const active = isActive(session);
  const s = styles(theme, active, isSelected);

  return (
    <Pressable
      style={({ pressed }) => [s.item, pressed && !isSelected && s.itemPressed]}
      onPress={onSelect}
    >
      {/* Left — session info */}
      <View style={s.left}>
        {/* Status pill */}
        <View style={s.pill}>
          {active && <View style={s.pillDot} />}
          <Text style={s.pillLabel}>{active ? 'Active' : 'Finished'}</Text>
        </View>

        {/* Label */}
        <Text style={s.label} numberOfLines={1}>
          {session.label ?? 'Session'}
        </Text>

        {/* Date + exercise count */}
        <Text style={s.meta}>
          {formatDate(session.createdAt)} · {session.exercises.length}{' '}
          {session.exercises.length === 1 ? 'exercise' : 'exercises'}
        </Text>
      </View>

      {/* Right — action buttons */}
      <View style={s.btns}>
        {/* Navigate button ··· */}
        <Pressable
          style={({ pressed }) => [s.btn, s.btnNav, pressed && s.btnPressed]}
          onPress={onNavigate}
          hitSlop={6}
        >
          <Text style={s.btnNavLabel}>···</Text>
        </Pressable>

        {/* Delete button ✕ */}
        <Pressable
          style={({ pressed }) => [s.btn, s.btnDel, pressed && s.btnPressed]}
          onPress={onDelete}
          hitSlop={6}
        >
          <Text style={s.btnDelLabel}>✕</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = (
  theme: AppTheme,
  active: boolean,
  isSelected: boolean,
): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isSelected ? (active ? '#0A1F14' : '#141420') : theme.surface,
      borderWidth: isSelected ? 1 : 0.5,
      borderColor: isSelected ? (active ? theme.accent : '#534AB7') : theme.border,
      borderRadius: 12,
      padding: 12,
      marginBottom: 6,
    },
    itemPressed: {
      opacity: 0.75,
    },

    // Left content
    left: {
      flex: 1,
      gap: 2,
      marginRight: 8,
    },

    // Status pill
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      borderRadius: 4,
      paddingHorizontal: 7,
      paddingVertical: 2,
      marginBottom: 3,
      backgroundColor: active ? '#0F6E56' : theme.border,
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
      color: active ? '#9FE1CB' : theme.textSecondary,
    },

    // Text
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    meta: {
      fontSize: 11,
      color: theme.textSecondary,
    },

    // Right buttons
    btns: {
      flexDirection: 'row',
      gap: 6,
      flexShrink: 0,
    },
    btn: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnNav: {
      backgroundColor: theme.surface,
      borderWidth: 0.5,
      borderColor: theme.border,
    },
    btnNavLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      letterSpacing: 1,
      lineHeight: 14,
    },
    btnDel: {
      backgroundColor: theme.surface,
      borderWidth: 0.5,
      borderColor: '#3C2020',
    },
    btnDelLabel: {
      fontSize: 11,
      color: theme.danger,
    },
    btnPressed: {
      opacity: 0.6,
    },
  });
