import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Logo } from '@/components/Logo';
import { ScreenBackground } from '@/components/ScreenBackground';
import { getLastPhone, SessionExpiredError } from '@/lib/credentials';
import { routeAfterAuth } from '@/lib/authGate';
import { colors, spacing, typography } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth';

export default function LoginScreen() {
  const { returnTo, message } = useLocalSearchParams<{
    returnTo?: string;
    message?: string;
  }>();
  const insets = useSafeAreaInsets();
  const loginWithPassword = useAuthStore((s) => s.loginWithPassword);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void getLastPhone().then((last) => {
      if (last) setPhone(last);
    });
  }, []);

  const handleSignIn = async () => {
    if (phone.length !== 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    if (password.length < 6) {
      setError('Enter your password (min 6 characters)');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await loginWithPassword(phone, password);
      routeAfterAuth(user, returnTo);
    } catch (e) {
      if (e instanceof SessionExpiredError) {
        setError(
          'No saved session on this device. Use Create account if you are new, or Forgot password to sign in with OTP once.'
        );
        return;
      }
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground variant="hero">
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top + spacing.unit8 }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.brand}>
          <Logo size="hero" style={styles.logoWrap} />
          <Text style={styles.tagline}>Industrial Procurement Simplified</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.sub}>
            {message ?? 'Sign in with your phone and password'}
          </Text>

          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneRow}>
            <View style={styles.prefix}>
              <Text style={styles.prefixText}>+91</Text>
            </View>
            <TextInput
              style={[styles.phoneInput, error ? styles.inputError : null]}
              placeholder="Enter your mobile number"
              keyboardType="number-pad"
              maxLength={10}
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[styles.fieldInput, error ? styles.inputError : null]}
            placeholder="Enter your password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={password}
            onChangeText={setPassword}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton label="Sign In" onPress={handleSignIn} loading={loading} style={styles.btn} />

          <Pressable onPress={() => router.push('/(auth)/forgot-password' as never)} style={styles.linkWrap}>
            <Text style={styles.link}>Forgot password?</Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to ARK? </Text>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(auth)/signup' as never,
                  params: returnTo ? { returnTo } : {},
                })
              }>
              <Text style={styles.link}>Create account</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.containerMargin },
  brand: { alignItems: 'center', marginBottom: spacing.unit8 },
  logoWrap: { marginBottom: spacing.unit4 },
  tagline: { ...typography.labelLg, color: colors.onSurfaceVariant },
  form: { flex: 1 },
  heading: { ...typography.headlineLgMobile, color: colors.primary, marginBottom: spacing.unit1 },
  sub: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.unit6 },
  label: { ...typography.labelLg, color: colors.onSurfaceVariant, marginBottom: spacing.unit2 },
  phoneRow: { flexDirection: 'row', gap: spacing.unit2, marginBottom: spacing.unit4 },
  prefix: {
    height: 56,
    width: 72,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLow,
  },
  prefixText: { ...typography.bodyLg, color: colors.onSurface },
  phoneInput: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    paddingHorizontal: spacing.unit4,
    backgroundColor: colors.surfaceContainerLow,
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  fieldInput: {
    height: 56,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    paddingHorizontal: spacing.unit4,
    backgroundColor: colors.surfaceContainerLow,
    ...typography.bodyLg,
    color: colors.onSurface,
    marginBottom: spacing.unit2,
  },
  inputError: { borderColor: colors.error },
  error: { color: colors.error, ...typography.bodyMd, marginBottom: spacing.unit2 },
  btn: { marginTop: spacing.unit2 },
  linkWrap: { alignItems: 'center', marginTop: spacing.unit4 },
  link: { ...typography.labelLg, color: colors.primary },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.unit8,
  },
  footerText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
});
