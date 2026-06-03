import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, spacing, typography } from '@/lib/theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'filled' | 'outline' | 'navy';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({
  label,
  onPress,
  variant = 'filled',
  loading,
  disabled,
  style,
}: PrimaryButtonProps) {
  const isOutline = variant === 'outline';
  const isNavy = variant === 'navy';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        isOutline ? styles.outline : isNavy ? styles.navy : styles.filled,
        (pressed || disabled) && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          color={isOutline ? colors.primary : colors.onSecondary}
        />
      ) : (
        <Text
          style={[
            styles.label,
            isOutline ? styles.outlineLabel : isNavy ? styles.navyLabel : styles.filledLabel,
          ]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: spacing.unit4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  pressed: { opacity: 0.88 },
  label: { ...typography.labelLg, textTransform: 'uppercase', letterSpacing: 1 },
  filledLabel: { color: colors.onSecondary },
  navyLabel: { color: colors.onPrimary },
  outlineLabel: { color: colors.primary },
});
