import { useTheme } from '@/hooks/useTheme';
import { FilterChipProps } from '@/types/types';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from '../shared/Icon';

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  active,
  onPress,
  icon,
  badgeCount,
}) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? theme.primary : theme.surface,
          borderColor: active ? theme.primary : theme.border,
        },
      ]}
    >
      {icon ? (
        <Icon
          sf={icon}
          fallback="•"
          size={16}
          color={active ? '#FFFFFF' : theme.textSecondary}
          style={styles.icon}
        />
      ) : null}
      <Text
        style={[
          styles.label,
          {
            color: active ? '#FFFFFF' : theme.text,
            fontWeight: active ? '600' : '400',
          },
        ]}
      >
        {label}
      </Text>
      {badgeCount !== undefined && badgeCount > 0 ? (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: active ? 'rgba(255,255,255,0.3)' : theme.primaryLight,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: active ? '#FFFFFF' : theme.primary },
            ]}
          >
            {badgeCount}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 14,
  },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
