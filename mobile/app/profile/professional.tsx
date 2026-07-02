import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from '@tanstack/react-query';
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
import {
  createPortfolioProject,
  deletePortfolioProject,
  fetchMyProfessionalProfile,
  fetchServiceablePincodes,
  fetchSpecialties,
  updateMyProfile,
  updateMyProfessionalProfile,
  updatePortfolioProject,
} from '@/lib/api';
import { promptAuth } from '@/lib/authGate';
import { PROFESSION_OPTIONS, professionLabel } from '@/lib/professions';
import { colors, spacing, typography } from '@/lib/theme';
import type { PortfolioProject, ProfessionType } from '@/lib/types';
import { mediaUrl } from '@/lib/strapi';
import { uploadImageFromUri, uploadImagesFromUris } from '@/lib/upload';
import { useAuthStore } from '@/stores/auth';

type DraftProject = PortfolioProject & {
  localImageUris?: string[];
  pendingImageIds?: number[];
};

export default function ProfessionalSettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);

  const { data: profileData, refetch } = useQuery({
    queryKey: ['my-professional-profile'],
    queryFn: fetchMyProfessionalProfile,
    enabled: Boolean(token),
  });

  const profile = profileData?.data;

  const [isProfessional, setIsProfessional] = useState(user?.isProfessional ?? false);
  const [listed, setListed] = useState(profile?.listed ?? false);
  const [professionType, setProfessionType] = useState<ProfessionType>(
    profile?.professionType ?? user?.professionType ?? 'contractor'
  );
  const [otherProfession, setOtherProfession] = useState(profile?.otherProfession ?? '');
  const [displayName, setDisplayName] = useState(profile?.displayName ?? user?.displayName ?? '');
  const [headline, setHeadline] = useState(profile?.headline ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [yearsExperience, setYearsExperience] = useState(String(profile?.yearsExperience ?? 0));
  const [city, setCity] = useState(profile?.city ?? 'Hyderabad');
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp ?? user?.phone ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [selectedSpecialties, setSelectedSpecialties] = useState<number[]>([]);
  const [selectedPincodes, setSelectedPincodes] = useState<number[]>([]);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [projects, setProjects] = useState<DraftProject[]>([]);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [projectImageUris, setProjectImageUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (!token) {
      promptAuth({
        returnTo: '/profile/professional',
        message: 'Sign in to manage your professional profile',
      });
    }
  }, [isHydrated, token]);

  useEffect(() => {
    if (!profile) return;
    setListed(profile.listed);
    setProfessionType(profile.professionType);
    setOtherProfession(profile.otherProfession ?? '');
    setDisplayName(profile.displayName);
    setHeadline(profile.headline ?? '');
    setBio(profile.bio ?? '');
    setYearsExperience(String(profile.yearsExperience ?? 0));
    setCity(profile.city ?? 'Hyderabad');
    setWhatsapp(profile.whatsapp ?? profile.phone ?? '');
    setEmail(profile.email ?? '');
    setSelectedSpecialties(profile.specialties.map((s) => s.id));
    setSelectedPincodes(profile.serviceAreas.map((s) => s.id));
    setProjects(profile.portfolioProjects ?? []);
  }, [profile]);

  const { data: specialtiesData } = useQuery({
    queryKey: ['specialties', professionType],
    queryFn: () => fetchSpecialties(professionType),
    enabled: isProfessional,
  });

  const { data: pincodesData } = useQuery({
    queryKey: ['serviceable-pincodes'],
    queryFn: fetchServiceablePincodes,
    enabled: isProfessional,
  });

  const specialties = specialtiesData?.data ?? [];
  const pincodes = pincodesData?.data?.slice(0, 20) ?? [];

  const pickImage = async (setter: (uri: string) => void) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to upload images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) setter(result.assets[0].uri);
  };

  const pickProjectImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to add project images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 0.8,
    });
    if (!result.canceled) {
      setProjectImageUris(result.assets.map((asset) => asset.uri).filter(Boolean));
    }
  };

  const toggleSpecialty = (id: number) => {
    setSelectedSpecialties((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id].slice(0, 8)
    );
  };

  const togglePincode = (id: number) => {
    setSelectedPincodes((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id].slice(0, 10)
    );
  };

  const addProject = async () => {
    const title = projectTitle.trim();
    if (!title) {
      Alert.alert('Title required', 'Add a project title before saving.');
      return;
    }
    if (projects.length >= 12) {
      Alert.alert('Limit reached', 'You can showcase up to 12 projects.');
      return;
    }

    setLoading(true);
    try {
      let imageIds: number[] = [];
      if (projectImageUris.length) {
        const uploads = await uploadImagesFromUris(projectImageUris);
        imageIds = uploads.map((u) => u.id);
      }
      const res = await createPortfolioProject({
        title,
        description: projectDescription.trim() || null,
        location: projectLocation.trim() || null,
        imageIds,
      });
      setProjects((current) => [...current, { ...res.data, imageUrls: res.data.imageUrls.map((u) => mediaUrl(u) ?? u) }]);
      setProjectTitle('');
      setProjectDescription('');
      setProjectLocation('');
      setProjectImageUris([]);
      await refetch();
    } catch (e) {
      Alert.alert('Could not add project', e instanceof Error ? e.message : 'Try again');
    } finally {
      setLoading(false);
    }
  };

  const removeProject = async (projectId: number) => {
    try {
      await deletePortfolioProject(projectId);
      setProjects((current) => current.filter((p) => p.id !== projectId));
      await refetch();
    } catch (e) {
      Alert.alert('Delete failed', e instanceof Error ? e.message : 'Try again');
    }
  };

  const handleSave = async () => {
    if (isProfessional && professionType === 'other' && !otherProfession.trim()) {
      Alert.alert('Profession required', 'Please specify your profession.');
      return;
    }
    setLoading(true);
    setSaved(false);
    try {
      const userRes = await updateMyProfile({
        isProfessional,
        listedAsProfessional: isProfessional ? listed : false,
        professionType: isProfessional ? professionType : null,
        displayName: displayName.trim() || user?.displayName,
        onboardingComplete: true,
      });
      await setUser(userRes.user);

      if (isProfessional) {
        let avatarId: number | null | undefined;
        let coverImageId: number | null | undefined;
        if (avatarUri) avatarId = (await uploadImageFromUri(avatarUri, 'avatar.jpg')).id;
        if (coverUri) coverImageId = (await uploadImageFromUri(coverUri, 'cover.jpg')).id;

        await updateMyProfessionalProfile({
          isProfessional: true,
          displayName: displayName.trim(),
          headline: headline.trim() || null,
          bio: bio.trim() || null,
          professionType,
          otherProfession: professionType === 'other' ? otherProfession.trim() : null,
          yearsExperience: Number(yearsExperience) || 0,
          city: city.trim() || null,
          whatsapp: whatsapp.trim() || null,
          email: email.trim() || null,
          listed,
          specialtyIds: selectedSpecialties,
          serviceAreaIds: selectedPincodes,
          avatarId,
          coverImageId,
          phone: user?.phone ?? null,
        });
      }

      await refetch();
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

  const avatarPreview = avatarUri ?? profile?.avatarUrl;
  const coverPreview = coverUri ?? profile?.coverImageUrl;

  return (
    <View style={styles.container}>
      <AppHeader title="Professional Profile" showBack showCart={false} showLocation={false} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text style={styles.toggleTitle}>I am a construction professional</Text>
            <Text style={styles.toggleSub}>
              {isProfessional
                ? professionLabel(professionType, otherProfession)
                : 'Enable to create your portfolio'}
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
            <Text style={styles.sectionTitle}>Basic info</Text>
            <Pressable style={styles.coverBtn} onPress={() => void pickImage(setCoverUri)}>
              {coverPreview ? (
                <Image source={{ uri: coverPreview }} style={styles.coverImage} contentFit="cover" />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <MaterialIcons name="panorama" size={28} color={colors.secondary} />
                  <Text style={styles.coverLabel}>Add cover image</Text>
                </View>
              )}
            </Pressable>
            <Pressable style={styles.avatarBtn} onPress={() => void pickImage(setAvatarUri)}>
              {avatarPreview ? (
                <Image source={{ uri: avatarPreview }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialIcons name="person" size={28} color={colors.secondary} />
                </View>
              )}
            </Pressable>

            <Text style={styles.label}>DISPLAY NAME</Text>
            <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />

            <Text style={styles.label}>HEADLINE</Text>
            <TextInput
              style={styles.input}
              value={headline}
              onChangeText={setHeadline}
              placeholder="Short tagline for your profile"
            />

            <Text style={styles.label}>PROFESSION</Text>
            <View style={styles.professionGrid}>
              {PROFESSION_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.key}
                  style={[styles.professionChip, professionType === opt.key && styles.professionChipActive]}
                  onPress={() => {
                    setProfessionType(opt.key);
                    setSelectedSpecialties([]);
                  }}>
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

            {professionType === 'other' ? (
              <>
                <Text style={styles.label}>YOUR PROFESSION</Text>
                <TextInput
                  style={styles.input}
                  value={otherProfession}
                  onChangeText={setOtherProfession}
                  placeholder="e.g. Carpenter, Welder, Surveyor"
                />
              </>
            ) : null}

            <View style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>Visible in directory</Text>
                <Text style={styles.toggleSub}>
                  {listed ? 'Customers can find and view your profile' : 'Hidden while you build your portfolio'}
                </Text>
              </View>
              <Switch
                value={listed}
                onValueChange={setListed}
                trackColor={{ true: colors.secondary, false: colors.outlineVariant }}
                thumbColor={colors.surface}
              />
            </View>

            <Text style={styles.sectionTitle}>Location & contact</Text>
            <Text style={styles.label}>CITY</Text>
            <TextInput style={styles.input} value={city} onChangeText={setCity} />
            <Text style={styles.label}>WHATSAPP</Text>
            <TextInput
              style={styles.input}
              value={whatsapp}
              onChangeText={setWhatsapp}
              keyboardType="phone-pad"
              placeholder="10-digit number"
            />
            <Text style={styles.label}>EMAIL (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
            />
            <Text style={styles.label}>SERVICE AREAS</Text>
            <View style={styles.wrapChips}>
              {pincodes.map((pin) => (
                <Pressable
                  key={pin.id}
                  style={[styles.miniChip, selectedPincodes.includes(pin.id) && styles.miniChipActive]}
                  onPress={() => togglePincode(pin.id)}>
                  <Text
                    style={[
                      styles.miniChipText,
                      selectedPincodes.includes(pin.id) && styles.miniChipTextActive,
                    ]}>
                    {pin.pincode}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Experience & specialties</Text>
            <Text style={styles.label}>YEARS OF EXPERIENCE</Text>
            <TextInput
              style={styles.input}
              value={yearsExperience}
              onChangeText={setYearsExperience}
              keyboardType="number-pad"
            />
            <Text style={styles.label}>SPECIALTIES</Text>
            <View style={styles.wrapChips}>
              {specialties.map((spec) => (
                <Pressable
                  key={spec.id}
                  style={[styles.miniChip, selectedSpecialties.includes(spec.id) && styles.miniChipActive]}
                  onPress={() => toggleSpecialty(spec.id)}>
                  <Text
                    style={[
                      styles.miniChipText,
                      selectedSpecialties.includes(spec.id) && styles.miniChipTextActive,
                    ]}>
                    {spec.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>BIO</Text>
            <TextInput
              style={styles.bioInput}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell customers about your experience"
              multiline
              numberOfLines={4}
            />

            <Text style={styles.sectionTitle}>Portfolio</Text>
            <Text style={styles.hint}>Add photos and descriptions of completed projects (up to 12).</Text>

            {projects.map((work) => (
              <View key={work.id} style={styles.workCard}>
                {work.imageUrls[0] ? (
                  <Image source={{ uri: work.imageUrls[0] }} style={styles.workThumb} contentFit="cover" />
                ) : null}
                <View style={styles.workBody}>
                  <Text style={styles.workTitle}>{work.title}</Text>
                  {work.location ? <Text style={styles.workMeta}>{work.location}</Text> : null}
                  {work.description ? <Text style={styles.workDescription}>{work.description}</Text> : null}
                  {work.imageUrls.length > 1 ? (
                    <Text style={styles.workMeta}>{work.imageUrls.length} photos</Text>
                  ) : null}
                </View>
                <Pressable onPress={() => void removeProject(work.id)} style={styles.removeBtn}>
                  <MaterialIcons name="delete-outline" size={22} color={colors.error} />
                </Pressable>
              </View>
            ))}

            <View style={styles.addWorkBox}>
              <TextInput
                style={styles.workInput}
                value={projectTitle}
                onChangeText={setProjectTitle}
                placeholder="Project title"
              />
              <TextInput
                style={styles.workInput}
                value={projectLocation}
                onChangeText={setProjectLocation}
                placeholder="Location (optional)"
              />
              <TextInput
                style={[styles.workInput, styles.workDescriptionInput]}
                value={projectDescription}
                onChangeText={setProjectDescription}
                placeholder="Description (optional)"
                multiline
              />
              <Pressable style={styles.photoBtn} onPress={() => void pickProjectImages()}>
                <MaterialIcons name="photo-camera" size={20} color={colors.secondary} />
                <Text style={styles.photoBtnText}>
                  {projectImageUris.length
                    ? `${projectImageUris.length} photo(s) selected`
                    : 'Add project photos'}
                </Text>
              </Pressable>
              {projectImageUris.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewRow}>
                  {projectImageUris.map((uri) => (
                    <Image key={uri} source={{ uri }} style={styles.previewThumb} contentFit="cover" />
                  ))}
                </ScrollView>
              ) : null}
              <PrimaryButton label="Add to Portfolio" variant="outline" onPress={() => void addProject()} loading={loading} />
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
  sectionTitle: { ...typography.headlineMd, color: colors.primary, marginTop: spacing.unit2 },
  label: { ...typography.labelLg, color: colors.primary },
  hint: { ...typography.bodyMd, color: colors.onSurfaceVariant },
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
  coverBtn: { borderRadius: 12, overflow: 'hidden', marginBottom: -28 },
  coverImage: { width: '100%', height: 140, backgroundColor: colors.surfaceContainerLow },
  coverPlaceholder: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondaryContainer,
    gap: 4,
  },
  coverLabel: { ...typography.labelMd, color: colors.secondary },
  avatarBtn: { alignSelf: 'center', marginBottom: spacing.unit2 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: colors.surface },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: spacing.unit3,
    backgroundColor: colors.surfaceContainerLowest,
    ...typography.bodyMd,
    color: colors.onSurface,
  },
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
  professionChipActive: { borderColor: colors.secondary, backgroundColor: colors.secondaryContainer },
  professionText: { ...typography.labelMd, color: colors.onSurfaceVariant },
  professionTextActive: { color: colors.primary, fontWeight: '700' },
  wrapChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.unit2 },
  miniChip: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 999,
    paddingHorizontal: spacing.unit3,
    paddingVertical: spacing.unit2,
    backgroundColor: colors.surface,
  },
  miniChipActive: { borderColor: colors.secondary, backgroundColor: colors.secondaryContainer },
  miniChipText: { ...typography.labelMd, color: colors.onSurfaceVariant },
  miniChipTextActive: { color: colors.primary, fontWeight: '700' },
  bioInput: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: spacing.unit3,
    backgroundColor: colors.surfaceContainerLowest,
    ...typography.bodyMd,
    color: colors.onSurface,
    minHeight: 100,
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
  workThumb: { width: 72, height: 72, borderRadius: 8, backgroundColor: colors.surfaceContainerLow },
  workBody: { flex: 1 },
  workTitle: { ...typography.labelLg, color: colors.primary },
  workMeta: { ...typography.labelMd, color: colors.onSurfaceVariant, fontSize: 11 },
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
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.unit2, paddingVertical: spacing.unit2 },
  photoBtnText: { ...typography.labelMd, color: colors.secondary },
  previewRow: { marginBottom: spacing.unit2 },
  previewThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginRight: spacing.unit2,
    backgroundColor: colors.surfaceContainerLow,
  },
  saved: { ...typography.labelMd, color: colors.success, textAlign: 'center' },
});
