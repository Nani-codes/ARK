import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenBackground } from '@/components/ScreenBackground';
import { colors, spacing, typography } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth';

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!phone || otp.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(phone, otp);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground variant="hero">
    <View style={[styles.container, { paddingTop: insets.top + spacing.unit8 }]}>
      <Text style={styles.heading}>Enter OTP</Text>
      <Text style={styles.sub}>Sent to +91 {phone}</Text>

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
});
