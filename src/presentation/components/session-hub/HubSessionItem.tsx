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
    <View style={s.row}>
      {/* Card — item body + chevron inside */}
      <Pressable
        style={({ pressed }) => [s.item, pressed && !isSelected && s.itemPressed]}
        onPress={onSelect}
      >
        {isSelected && <View style={s.accentBar} />}

        <View style={s.left}>
          <View style={s.pill}>
            {active && <View style={s.pillDot} />}
            <Text style={s.pillLabel}>{active ? 'Active' : 'Finished'}</Text>
          </View>
          <Text style={s.label} numberOfLines={1}>
            {session.label ?? 'Session'}
          </Text>
          <Text style={s.meta}>
            {formatDate(session.createdAt)} · {session.exercises.length}{' '}
            {session.exercises.length === 1 ? 'exercise' : 'exercises'}
          </Text>
        </View>

        <Pressable onPress={onNavigate} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <View style={s.chevronCircle}>
            <Text style={s.chevron}>›</Text>
          </View>
        </Pressable>
      </Pressable>

      <Pressable
        onPress={onDelete}
        style={s.trashBtn}
        hitSlop={{ top: 12, bottom: 12, left: 8, right: 16 }}
      >
        <Text style={s.trash}>🗑</Text>
      </Pressable>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = (
  theme: AppTheme,
  active: boolean,
  isSelected: boolean,
): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    // Outer row — card + trash side by side
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
      gap: 10,
    },

    item: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderWidth: isSelected ? 1 : 0.5,
      borderColor: isSelected ? (active ? theme.accent : '#534AB7') : theme.border,
      borderRadius: 12,
      padding: 12,
      overflow: 'hidden',
    },
    accentBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      borderRadius: 12,
      backgroundColor: active ? theme.accent : '#534AB7',
    },
    itemPressed: {
      opacity: 0.75,
    },

    left: {
      flex: 1,
      gap: 2,
      marginRight: 8,
    },
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
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    meta: {
      fontSize: 11,
      color: theme.textSecondary,
    },
    chevron: {
      fontSize: 22,
      color: isSelected ? theme.accent : theme.textSecondary,
      lineHeight: 26,
    },
    chevronCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isSelected ? (active ? '#1A3010' : '#1E1A3A') : theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    trashBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 24,
    },
    trash: {
      fontSize: 16,
    },
  });
