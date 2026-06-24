import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  Alert,
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
import { isSignedIn, promptAuth } from '@/lib/authGate';
import { PROFESSION_OPTIONS, professionLabel } from '@/lib/professions';
import { colors, spacing, typography } from '@/lib/theme';
import type { ProfessionType, ProfessionalWork } from '@/lib/types';
import { newWorkId, uploadImageFromUri } from '@/lib/upload';
import { useAuthStore } from '@/stores/auth';

type DraftWork = ProfessionalWork & { localUri?: string };

export default function ProfessionalSettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!isHydrated) return;
    if (!token) {
      promptAuth({
        returnTo: '/profile/professional',
        message: 'Sign in to manage your professional profile',
      });
    }
  }, [isHydrated, token]);

  const [isProfessional, setIsProfessional] = useState(user?.isProfessional ?? false);
  const [listed, setListed] = useState(user?.listedAsProfessional ?? false);
  const [professionType, setProfessionType] = useState<ProfessionType>(
    user?.professionType ?? 'contractor'
  );
  const [bio, setBio] = useState(user?.professionalBio ?? '');
  const [works, setWorks] = useState<DraftWork[]>(user?.professionalWorks ?? []);
  const [workTitle, setWorkTitle] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [workImageUri, setWorkImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const pickWorkImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to add project images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setWorkImageUri(result.assets[0].uri);
    }
  };

  const addWork = () => {
    const title = workTitle.trim();
    if (!title) {
      Alert.alert('Title required', 'Add a project title before saving the work item.');
      return;
    }
    if (works.length >= 12) {
      Alert.alert('Limit reached', 'You can showcase up to 12 projects.');
      return;
    }

    setWorks((current) => [
      ...current,
      {
        id: newWorkId(),
        title,
        description: workDescription.trim() || undefined,
        imageUrl: undefined,
        localUri: workImageUri ?? undefined,
      },
    ]);
    setWorkTitle('');
    setWorkDescription('');
    setWorkImageUri(null);
  };

  const removeWork = (id: string) => {
    setWorks((current) => current.filter((work) => work.id !== id));
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const uploadedWorks: ProfessionalWork[] = [];
      for (const work of works) {
        let imageUrl = work.imageUrl;
        if (work.localUri) {
          imageUrl = await uploadImageFromUri(work.localUri, `${work.id}.jpg`);
        }
        uploadedWorks.push({
          id: work.id,
          title: work.title,
          description: work.description,
          imageUrl,
        });
      }

      const res = await updateMyProfile({
        isProfessional,
        listedAsProfessional: isProfessional ? listed : false,
        professionType: isProfessional ? professionType : null,
        professionalBio: isProfessional ? bio.trim() || null : null,
        professionalWorks: isProfessional ? uploadedWorks : [],
        onboardingComplete: true,
      });
      await setUser(res.user);
      setWorks(res.user.professionalWorks ?? []);
      setSaved(true);
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Could not update profile');
    } finally {
      setLoading(false);
    }
  };

  if (isHydrated && !token) {
    return (
      <View style={styles.container}>
        <AppHeader title="Professional Profile" showBack showCart={false} showLocation={false} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Professional Profile" showBack showCart={false} showLocation={false} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text style={styles.toggleTitle}>I am a construction professional</Text>
            <Text style={styles.toggleSub}>
              {isProfessional ? professionLabel(professionType) : 'Enable to create your portfolio'}
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
                    ? 'Customers can find and view your profile'
                    : 'Hidden — build your portfolio first'}
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

            <Text style={styles.label}>WORK SHOWCASE</Text>
            <Text style={styles.hint}>Add photos and descriptions of completed projects.</Text>

            {works.map((work) => (
              <View key={work.id} style={styles.workCard}>
                {work.localUri || work.imageUrl ? (
                  <Image
                    source={{ uri: work.localUri ?? work.imageUrl }}
                    style={styles.workThumb}
                    contentFit="cover"
                  />
                ) : null}
                <View style={styles.workBody}>
                  <Text style={styles.workTitle}>{work.title}</Text>
                  {work.description ? (
                    <Text style={styles.workDescription}>{work.description}</Text>
                  ) : null}
                </View>
                <Pressable onPress={() => removeWork(work.id)} style={styles.removeBtn}>
                  <MaterialIcons name="delete-outline" size={22} color={colors.error} />
                </Pressable>
              </View>
            ))}

            <View style={styles.addWorkBox}>
              <TextInput
                style={styles.workInput}
                value={workTitle}
                onChangeText={setWorkTitle}
                placeholder="Project title (e.g. Villa tiling — Gachibowli)"
              />
              <TextInput
                style={[styles.workInput, styles.workDescriptionInput]}
                value={workDescription}
                onChangeText={setWorkDescription}
                placeholder="Short description (optional)"
                multiline
              />
              <Pressable style={styles.photoBtn} onPress={() => void pickWorkImage()}>
                <MaterialIcons name="photo-camera" size={20} color={colors.secondary} />
                <Text style={styles.photoBtnText}>
                  {workImageUri ? 'Change project photo' : 'Add project photo'}
                </Text>
              </Pressable>
              {workImageUri ? (
                <Image source={{ uri: workImageUri }} style={styles.workPreview} contentFit="cover" />
              ) : null}
              <PrimaryButton label="Add to Portfolio" variant="outline" onPress={addWork} />
            </View>
          </>
        ) : null}

        <PrimaryButton label="Save Profile" onPress={() => void handleSave()} loading={loading} />
        {saved ? <Text style={styles.saved}>Profile updated</Text> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.containerMargin, paddingBottom: spacing.unit12, gap: spacing.unit3 },
  label: { ...typography.labelLg, color: colors.primary, marginTop: spacing.unit2 },
  hint: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.unit2 },
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
  workCard: {
    flexDirection: 'row',
    gap: spacing.unit3,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.unit3,
  },
  workThumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: colors.surfaceContainerLow },
  workBody: { flex: 1 },
  workTitle: { ...typography.labelLg, color: colors.primary },
  workDescription: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 2 },
  removeBtn: { padding: spacing.unit1 },
  addWorkBox: {
    gap: spacing.unit2,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: spacing.unit4,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  workInput: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: spacing.unit3,
    backgroundColor: colors.surface,
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  workDescriptionInput: { minHeight: 72, textAlignVertical: 'top' },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
    paddingVertical: spacing.unit2,
  },
  photoBtnText: { ...typography.labelMd, color: colors.secondary },
  workPreview: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerLow,
  },
  saved: { ...typography.labelMd, color: colors.success, textAlign: 'center' },
});
