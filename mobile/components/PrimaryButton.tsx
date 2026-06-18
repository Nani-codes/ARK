import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { colors, spacing, typography } from '@/lib/theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'filled' | 'outline' | 'navy' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  icon?: ReactNode;
};

const SIZE_STYLES = {
  sm: { paddingVertical: spacing.unit2, paddingHorizontal: spacing.unit3 },
  md: { paddingVertical: spacing.unit4, paddingHorizontal: spacing.unit4 },
  lg: { paddingVertical: spacing.unit6, paddingHorizontal: spacing.unit6 },
} as const;

const LABEL_SIZES = {
  sm: typography.labelMd,
  md: typography.labelLg,
  lg: typography.labelLg,
} as const;

export function PrimaryButton({
  label,
  onPress,
  variant = 'filled',
  size = 'md',
  loading,
  disabled,
  style,
  accessibilityLabel,
  icon,
}: PrimaryButtonProps) {
  const isOutline = variant === 'outline';
  const isNavy = variant === 'navy';
  const isSecondary = variant === 'secondary';
  const isGhost = variant === 'ghost';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [
        styles.btn,
        SIZE_STYLES[size],
        isGhost
          ? styles.ghost
          : isSecondary
            ? styles.secondary
            : isOutline
              ? styles.outline
              : isNavy
                ? styles.navy
                : styles.filled,
        (pressed || disabled) && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          color={isOutline || isSecondary || isGhost ? colors.primary : colors.onSecondary}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.label,
              LABEL_SIZES[size],
              isGhost
                ? styles.ghostLabel
                : isSecondary
                  ? styles.secondaryLabel
                  : isOutline
                    ? styles.outlineLabel
                    : isNavy
                      ? styles.navyLabel
                      : styles.filledLabel,
              icon ? styles.labelWithIcon : null,
            ]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.unit2,
  },
  filled: {
    backgroundColor: colors.secondary,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  navy: {
    backgroundColor: colors.primaryContainer,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.secondary,
    borderStyle: 'dashed',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: { opacity: 0.88 },
  label: { textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  labelWithIcon: { marginLeft: 0 },
  filledLabel: { color: colors.onSecondary },
  navyLabel: { color: colors.onPrimary },
  outlineLabel: { color: colors.primary },
  secondaryLabel: { color: colors.secondary },
  ghostLabel: { color: colors.secondary, textTransform: 'none', letterSpacing: 0 },
});
