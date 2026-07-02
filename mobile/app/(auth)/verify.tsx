import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenBackground } from '@/components/ScreenBackground';
import { hasPassword } from '@/lib/credentials';
import { authParamsWithReturnTo, routeAfterAuth } from '@/lib/authGate';
import { sendOtp } from '@/lib/strapi';
import { colors, spacing, typography } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth';
import type { AuthUser } from '@/lib/types';

type VerifyMode = 'signup' | 'reset' | 'refresh';

function routeAfterVerify(
  phone: string,
  mode: VerifyMode | undefined,
  user: AuthUser,
  needsSetPassword: boolean,
  returnTo?: string
) {
  if (mode === 'reset' || needsSetPassword) {
    router.replace({
      pathname: '/(auth)/set-password' as never,
      params: {
        phone,
        mode: mode === 'reset' ? 'reset' : 'create',
        ...authParamsWithReturnTo(returnTo),
      },
    });
    return;
  }

  routeAfterAuth(user, returnTo);
}

export default function VerifyScreen() {
  const { phone, mode, returnTo } = useLocalSearchParams<{
    phone: string;
    mode?: VerifyMode;
    returnTo?: string;
  }>();
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const subtitle =
    mode === 'refresh'
      ? 'Your session expired. Enter the OTP sent to WhatsApp to continue.'
      : `Check WhatsApp on +91 ${phone} for your 6-digit code`;

  const handleVerify = async () => {
    if (!phone || otp.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await login(phone, otp);
      // New users (no device password yet) set one; existing users skip unless resetting.
      const needsSetPassword = mode === 'reset' || !(await hasPassword(phone));
      routeAfterVerify(phone, mode, user, needsSetPassword, returnTo);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!phone) return;
    setResending(true);
    setError('');
    try {
      await sendOtp(phone);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <ScreenBackground variant="hero">
      <View style={[styles.container, { paddingTop: insets.top + spacing.unit8 }]}>
        <Text style={styles.heading}>Enter OTP</Text>
        <Text style={styles.sub}>{subtitle}</Text>

        <TextInput
          style={styles.input}
          placeholder="6-digit OTP"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={(t) => setOtp(t.replace(/\D/g, ''))}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton label="Verify & Continue" onPress={handleVerify} loading={loading} />

        <Pressable onPress={handleResend} disabled={resending} style={styles.linkWrap}>
          <Text style={styles.link}>{resending ? 'Sending…' : 'Resend OTP'}</Text>
        </Pressable>

        <PrimaryButton
          label="Change Number"
          variant="outline"
          onPress={() => router.back()}
          style={{ marginTop: spacing.unit3 }}
        />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.containerMargin },
  heading: { ...typography.headlineLgMobile, color: colors.onSurface, marginBottom: spacing.unit1 },
  sub: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.unit8 },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    paddingHorizontal: spacing.unit4,
    backgroundColor: colors.surfaceContainerLow,
    ...typography.headlineMd,
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: spacing.unit4,
    color: colors.onSurface,
  },
  error: { color: colors.error, marginBottom: spacing.unit4 },
  linkWrap: { alignItems: 'center', marginTop: spacing.unit4 },
  link: { ...typography.labelLg, color: colors.primary },
});
