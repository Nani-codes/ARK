import { MaterialIcons } from '@expo/vector-icons';
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

import { AppHeader } from '@/components/AppHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { updateMyProfile } from '@/lib/api';
import { PROFESSION_OPTIONS, professionLabel } from '@/lib/professions';
import { colors, spacing, typography } from '@/lib/theme';
import type { ProfessionType } from '@/lib/types';
import { useAuthStore } from '@/stores/auth';

export default function ProfessionalSettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [isProfessional, setIsProfessional] = useState(user?.isProfessional ?? false);
  const [listed, setListed] = useState(user?.listedAsProfessional ?? false);
  const [professionType, setProfessionType] = useState<ProfessionType>(
    user?.professionType ?? 'contractor'
  );
  const [bio, setBio] = useState(user?.professionalBio ?? '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const res = await updateMyProfile({
        isProfessional,
        listedAsProfessional: isProfessional ? listed : false,
        professionType: isProfessional ? professionType : null,
        professionalBio: isProfessional ? bio.trim() || null : null,
        onboardingComplete: true,
      });
      await setUser(res.user);
      setSaved(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Professional Profile" showBack showCart={false} showLocation={false} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text style={styles.toggleTitle}>I am a construction professional</Text>
            <Text style={styles.toggleSub}>
              {isProfessional ? professionLabel(professionType) : 'Enable to join the directory'}
            </Text>
          </View>
          <Switch
            value={isProfessional}
            onValueChange={(v) => {
              setIsProfessional(v);
              if (!v) setListed(false);
            }}
            trackColor={{ true: colors.secondary, false: colors.outlineVariant }}
            thumbColor={colors.surface}
          />
        </View>

        {isProfessional ? (
          <>
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
                    size={18}
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
                <Text style={styles.toggleTitle}>Visible in directory</Text>
                <Text style={styles.toggleSub}>
                  {listed
                    ? 'You appear in Find Professionals'
                    : 'Hidden — only you can see this profile'}
                </Text>
              </View>
              <Switch
                value={listed}
                onValueChange={setListed}
                trackColor={{ true: colors.secondary, false: colors.outlineVariant }}
                thumbColor={colors.surface}
              />
            </View>

            <Text style={styles.label}>BIO</Text>
            <TextInput
              style={styles.bioInput}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell customers about your experience"
              multiline
              numberOfLines={3}
            />
          </>
        ) : null}

        <PrimaryButton label="Save" onPress={() => void handleSave()} loading={loading} />
        {saved ? <Text style={styles.saved}>Profile updated</Text> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.containerMargin, paddingBottom: spacing.unit12, gap: spacing.unit3 },
  label: { ...typography.labelLg, color: colors.primary, marginTop: spacing.unit2 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit3,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.unit4,
  },
  toggleText: { flex: 1 },
  toggleTitle: { ...typography.labelLg, color: colors.primary },
  toggleSub: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 4, fontSize: 12 },
  professionGrid: { gap: spacing.unit2 },
  professionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
    padding: spacing.unit3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  professionChipActive: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondaryContainer,
  },
  professionText: { ...typography.labelMd, color: colors.onSurfaceVariant },
  professionTextActive: { color: colors.primary, fontWeight: '700' },
  bioInput: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: spacing.unit3,
    backgroundColor: colors.surfaceContainerLowest,
    ...typography.bodyMd,
    color: colors.onSurface,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saved: { ...typography.labelMd, color: colors.success, textAlign: 'center' },
});
