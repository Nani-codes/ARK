import { router } from 'expo-router';
import { useState } from 'react';
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
import { ScreenBackground } from '@/components/ScreenBackground';
import { sendOtp } from '@/lib/strapi';
import { colors, spacing, typography } from '@/lib/theme';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (phone.length !== 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendOtp(phone);
      router.push({ pathname: '/(auth)/verify', params: { phone, mode: 'signup' } });
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
        <Text style={styles.heading}>Create account</Text>
        <Text style={styles.sub}>
          We&apos;ll verify your WhatsApp number once, then you&apos;ll set a password for future sign-ins.
        </Text>

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

        <PrimaryButton label="Send OTP" onPress={handleContinue} loading={loading} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.link}>Sign in</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.containerMargin },
  heading: { ...typography.headlineLgMobile, color: colors.onSurface, marginBottom: spacing.unit1 },
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
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.unit8 },
  footerText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  link: { ...typography.labelLg, color: colors.primary },
});
