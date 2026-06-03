import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenBackground } from '@/components/ScreenBackground';
import { sendOtp } from '@/lib/strapi';
import { colors, spacing, typography } from '@/lib/theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGetOtp = async () => {
    if (phone.length !== 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendOtp(phone);
      router.push({ pathname: '/(auth)/verify', params: { phone } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP');
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
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>ARK</Text>
        </View>
        <Text style={styles.tagline}>Industrial Procurement Simplified</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.heading}>Welcome to ARK</Text>
        <Text style={styles.sub}>Sign in to order materials in minutes</Text>

        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.phoneRow}>
          <View style={styles.prefix}>
            <Text style={styles.prefixText}>+91</Text>
          </View>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="Enter your mobile number"
            keyboardType="number-pad"
            maxLength={10}
            value={phone}
            onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
          />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton label="Get OTP" onPress={handleGetOtp} loading={loading} style={styles.btn} />

        <Text style={styles.hint}>MVP: any 6-digit OTP will work</Text>
      </View>
    </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.containerMargin },
  brand: { alignItems: 'center', marginBottom: spacing.unit12 },
  logoBox: {
    width: 96,
    height: 96,
    backgroundColor: colors.primaryContainer,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.unit4,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  logoText: { ...typography.headlineLgMobile, color: colors.onPrimary, fontWeight: '800' },
  tagline: { ...typography.labelLg, color: colors.onSurfaceVariant },
  form: { flex: 1 },
  heading: { ...typography.headlineLgMobile, color: colors.primary, marginBottom: spacing.unit1 },
  sub: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.unit8 },
  label: { ...typography.labelLg, color: colors.onSurfaceVariant, marginBottom: spacing.unit2 },
  phoneRow: { flexDirection: 'row', gap: spacing.unit2, marginBottom: spacing.unit2 },
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
  input: {
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
  inputError: { borderColor: colors.error },
  error: { color: colors.error, ...typography.bodyMd, marginBottom: spacing.unit2 },
  btn: { marginTop: spacing.unit4 },
  hint: { ...typography.labelMd, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.unit6 },
});
