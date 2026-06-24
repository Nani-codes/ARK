import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenBackground } from '@/components/ScreenBackground';
import { isValidPassword, savePassword } from '@/lib/credentials';
import { authParamsWithReturnTo, routeAfterAuth } from '@/lib/authGate';
import { colors, spacing, typography } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth';

type SetPasswordMode = 'create' | 'reset';

export default function SetPasswordScreen() {
  const { phone, mode = 'create', returnTo } = useLocalSearchParams<{
    phone: string;
    mode?: SetPasswordMode;
    returnTo?: string;
  }>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const heading = mode === 'reset' ? 'Choose a new password' : 'Set your password';
  const sub =
    mode === 'reset'
      ? 'Use this password the next time you sign in.'
      : 'You will use this password for future sign-ins — no OTP needed.';

  const handleSave = async () => {
    if (!phone) {
      setError('Missing phone number');
      return;
    }
    if (!isValidPassword(password)) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await savePassword(phone, password);

      if (mode === 'reset') {
        router.replace({
          pathname: '/(auth)/login' as never,
          params: authParamsWithReturnTo(returnTo),
        });
        return;
      }

      if (user) {
        routeAfterAuth(user, returnTo);
      } else {
        router.replace('/(tabs)' as never);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground variant="hero">
      <View style={[styles.container, { paddingTop: insets.top + spacing.unit8 }]}>
        <Text style={styles.heading}>{heading}</Text>
        <Text style={styles.sub}>{sub}</Text>

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Min 6 characters"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          value={password}
          onChangeText={setPassword}
        />

        <Text style={styles.label}>Confirm password</Text>
        <TextInput
          style={styles.input}
          placeholder="Re-enter password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          value={confirm}
          onChangeText={setConfirm}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton label="Save & Continue" onPress={handleSave} loading={loading} />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.containerMargin },
  heading: { ...typography.headlineLgMobile, color: colors.onSurface, marginBottom: spacing.unit1 },
  sub: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.unit8 },
  label: { ...typography.labelLg, color: colors.onSurfaceVariant, marginBottom: spacing.unit2 },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    paddingHorizontal: spacing.unit4,
    backgroundColor: colors.surfaceContainerLow,
    ...typography.bodyLg,
    color: colors.onSurface,
    marginBottom: spacing.unit4,
  },
  error: { color: colors.error, marginBottom: spacing.unit4 },
});
