import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { colors, spacing, typography } from '@/lib/theme';

type SectionHeaderProps = ViewProps & {
  title: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
};

/** Navy strip header used on cart, checkout, etc. */
export function SectionHeader({ title, icon, style, ...props }: SectionHeaderProps) {
  return (
    <View style={[styles.wrap, style]} {...props}>
      {icon ? (
        <MaterialIcons name={icon} size={24} color={colors.onPrimary} style={styles.icon} />
      ) : null}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.containerMargin,
    paddingVertical: spacing.unit4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
  },
  icon: {},
  title: {
    ...typography.headlineLgMobile,
    color: colors.onPrimary,
    fontWeight: '700',
  },
});
