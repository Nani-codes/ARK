import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { promptAuth } from '@/lib/authGate';
import { colors, spacing, typography } from '@/lib/theme';

type GuestAuthPromptProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  returnTo: string;
  message?: string;
};

export function GuestAuthPrompt({
  icon,
  title,
  subtitle,
  returnTo,
  message,
}: GuestAuthPromptProps) {
  return (
    <View style={styles.container}>
      <MaterialIcons name={icon} size={64} color={colors.iconMuted} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <PrimaryButton
        label="Sign In"
        onPress={() =>
          promptAuth({
            returnTo,
            message: message ?? 'Sign in to continue',
          })
        }
        style={styles.btn}
      />
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/(auth)/signup' as never,
            params: { returnTo },
          })
        }>
        <Text style={styles.link}>Create account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.unit8,
    gap: spacing.unit2,
  },
  title: { ...typography.headlineMd, color: colors.onSurface, marginTop: spacing.unit4 },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.unit4,
  },
  btn: { alignSelf: 'stretch', maxWidth: 280 },
  link: { ...typography.labelLg, color: colors.secondary, marginTop: spacing.unit3 },
});
