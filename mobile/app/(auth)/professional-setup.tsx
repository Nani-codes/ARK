import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenBackground } from '@/components/ScreenBackground';
import { updateMyProfile } from '@/lib/api';
import { routeAfterAuth } from '@/lib/authGate';
import { PROFESSION_OPTIONS } from '@/lib/professions';
import { colors, spacing, typography } from '@/lib/theme';
import type { ProfessionType } from '@/lib/types';
import { useAuthStore } from '@/stores/auth';

type Step = 'ask' | 'details';

export default function ProfessionalSetupScreen() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const insets = useSafeAreaInsets();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState<Step>('ask');
  const [professionType, setProfessionType] = useState<ProfessionType>('contractor');
  const [listed, setListed] = useState(true);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const finishAsNonPro = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await updateMyProfile({
        isProfessional: false,
        listedAsProfessional: false,
        professionType: null,
        onboardingComplete: true,
      });
      await setUser(res.user);
      routeAfterAuth(res.user, returnTo);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save preference');
    } finally {
      setLoading(false);
    }
  };

  const finishAsPro = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await updateMyProfile({
        isProfessional: true,
        listedAsProfessional: listed,
        professionType,
        professionalBio: bio.trim() || undefined,
        displayName: user?.displayName,
        onboardingComplete: true,
      });
      await setUser(res.user);
      routeAfterAuth(res.user, returnTo);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground variant="hero">
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.unit8, paddingBottom: insets.bottom + spacing.unit8 },
        ]}>
        {step === 'ask' ? (
          <>
            <View style={styles.iconWrap}>
              <MaterialIcons name="engineering" size={40} color={colors.secondary} />
            </View>
            <Text style={styles.heading}>Are you a construction professional?</Text>
            <Text style={styles.sub}>
              Contractors, architects, electricians, and other pros can appear in ARK's
              Hyderabad professionals directory so customers and peers can find you.
            </Text>

            <PrimaryButton
              label="Yes, I'm a professional"
              onPress={() => setStep('details')}
              style={styles.btn}
            />
            <PrimaryButton
              label="No, I'm ordering for personal use"
              variant="outline"
              onPress={() => void finishAsNonPro()}
              loading={loading}
              style={styles.btn}
            />
          </>
        ) : (
          <>
            <Text style={styles.heading}>Your professional profile</Text>
            <Text style={styles.sub}>Choose your trade. You can hide from the directory anytime.</Text>

            <Text style={styles.label}>PROFESSION</Text>
            <View style={styles.professionGrid}>
              {PROFESSION_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.key}
                  style={[
                    styles.professionChip,
                    professionType === opt.key && styles.professionChipActive,
                  ]}
                  onPress={() => setProfessionType(opt.key)}>
                  <MaterialIcons
                    name={opt.icon as keyof typeof MaterialIcons.glyphMap}
                    size={20}
                    color={professionType === opt.key ? colors.primary : colors.iconMuted}
                  />
                  <Text
                    style={[
                      styles.professionText,
                      professionType === opt.key && styles.professionTextActive,
                    ]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>Show in professionals directory</Text>
                <Text style={styles.toggleSub}>
                  Others can discover and contact you. Turn off to stay private.
                </Text>
              </View>
              <Switch
                value={listed}
                onValueChange={setListed}
                trackColor={{ true: colors.secondary, false: colors.outlineVariant }}
                thumbColor={colors.surface}
              />
            </View>

            <Text style={styles.label}>SHORT BIO (OPTIONAL)</Text>
            <TextInput
              style={styles.bioInput}
              value={bio}
              onChangeText={setBio}
              placeholder="e.g. 12+ years residential projects in Gachibowli"
              multiline
              numberOfLines={3}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <PrimaryButton
              label="Continue to ARK"
              onPress={() => void finishAsPro()}
              loading={loading}
              style={styles.btn}
            />
            <PrimaryButton
              label="Back"
              variant="outline"
              onPress={() => setStep('ask')}
              style={styles.btn}
            />
          </>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.containerMargin },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.unit6,
  },
  heading: { ...typography.headlineLgMobile, color: colors.onSurface, marginBottom: spacing.unit2 },
  sub: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.unit8 },
  label: { ...typography.labelLg, color: colors.primary, marginBottom: spacing.unit3 },
  btn: { marginBottom: spacing.unit3 },
  professionGrid: { gap: spacing.unit2, marginBottom: spacing.unit6 },
  professionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit3,
    padding: spacing.unit3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  professionChipActive: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondaryContainer,
  },
  professionText: { ...typography.labelLg, color: colors.onSurfaceVariant, flex: 1 },
  professionTextActive: { color: colors.primary, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit3,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.unit4,
    marginBottom: spacing.unit6,
  },
  toggleText: { flex: 1 },
  toggleTitle: { ...typography.labelLg, color: colors.primary },
  toggleSub: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 4, fontSize: 12 },
  bioInput: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: spacing.unit3,
    backgroundColor: colors.surfaceContainerLowest,
    ...typography.bodyMd,
    color: colors.onSurface,
    minHeight: 88,
    textAlignVertical: 'top',
    marginBottom: spacing.unit4,
  },
  error: { color: colors.error, marginBottom: spacing.unit3 },
});
