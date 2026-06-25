import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, spacing, typography } from '@/lib/theme';

const THUB_LOGO = require('@/assets/images/thub-logo.png');

export function ThubBrandingSection() {
  return (
    <Pressable
      style={styles.wrap}
      onPress={() => void Linking.openURL('https://www.t-hub.co/')}
      accessibilityRole="link"
      accessibilityLabel="Incubated with T-Hub. Opens T-Hub website.">
      <Text style={styles.label}>Incubated with</Text>
      <Image
        source={THUB_LOGO}
        style={styles.logo}
        contentFit="contain"
        accessibilityLabel="T-Hub logo"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.unit2,
    backgroundColor: colors.surface,
    paddingVertical: spacing.unit3,
    paddingHorizontal: spacing.containerMargin,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  label: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },
  logo: {
    width: 38,
    height: 32,
  },
});
