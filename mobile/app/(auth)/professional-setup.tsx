import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
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
import {
  createPortfolioProject,
  fetchServiceablePincodes,
  fetchSpecialties,
  updateMyProfile,
  updateMyProfessionalProfile,
} from '@/lib/api';
import { routeAfterAuth } from '@/lib/authGate';
import { PROFESSION_OPTIONS } from '@/lib/professions';
import { colors, spacing, typography } from '@/lib/theme';
import type { ProfessionType } from '@/lib/types';
import { uploadImageFromUri } from '@/lib/upload';
import { useAuthStore } from '@/stores/auth';

type Step = 'ask' | 'trade' | 'details' | 'profile' | 'portfolio';

export default function ProfessionalSetupScreen() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const insets = useSafeAreaInsets();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState<Step>('ask');
  const [professionType, setProfessionType] = useState<ProfessionType>('contractor');
  const [otherProfession, setOtherProfession] = useState('');
  const [listed, setListed] = useState(true);
  const [yearsExperience, setYearsExperience] = useState('5');
  const [city, setCity] = useState('Hyderabad');
  const [selectedPincodes, setSelectedPincodes] = useState<number[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<number[]>([]);
  const [fullName, setFullName] = useState(user?.displayName ?? '');
  const [email, setEmail] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectImageUri, setProjectImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: specialtiesData } = useQuery({
    queryKey: ['specialties', professionType],
    queryFn: () => fetchSpecialties(professionType),
    enabled: step === 'details' || step === 'profile' || step === 'portfolio',
  });

  const { data: pincodesData } = useQuery({
    queryKey: ['serviceable-pincodes'],
    queryFn: fetchServiceablePincodes,
    enabled: step === 'details',
  });

  const specialties = specialtiesData?.data ?? [];
  const pincodes = pincodesData?.data?.slice(0, 12) ?? [];

  const pickImage = async (setter: (uri: string) => void) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Allow photo access to upload images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) setter(result.assets[0].uri);
  };

  const toggleSpecialty = (id: number) => {
    setSelectedSpecialties((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id].slice(0, 6)
    );
  };

  const togglePincode = (id: number) => {
    setSelectedPincodes((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id].slice(0, 8)
    );
  };

  const finishAsNonPro = async () => {
    if (!fullName.trim()) {
      setError('Please enter your name');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await updateMyProfile({
        isProfessional: false,
        listedAsProfessional: false,
        professionType: null,
        displayName: fullName.trim(),
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
    if (professionType === 'other' && !otherProfession.trim()) {
      setError('Please specify your profession');
      setStep('trade');
      return;
    }
    if (!fullName.trim()) {
      setError('Please enter your full name');
      setStep('profile');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const resolvedName = fullName.trim();
      const userRes = await updateMyProfile({
        isProfessional: true,
        listedAsProfessional: listed,
        professionType,
        displayName: resolvedName,
        onboardingComplete: true,
      });
      await setUser(userRes.user);

      let avatarId: number | undefined;
      if (avatarUri) {
        const uploaded = await uploadImageFromUri(avatarUri, 'avatar.jpg');
        avatarId = uploaded.id;
      }

      await updateMyProfessionalProfile({
        isProfessional: true,
        displayName: resolvedName,
        professionType,
        otherProfession: professionType === 'other' ? otherProfession.trim() : null,
        listed,
        yearsExperience: Number(yearsExperience) || 0,
        city: city.trim() || 'Hyderabad',
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        email: email.trim() || null,
        specialtyIds: selectedSpecialties,
        serviceAreaIds: selectedPincodes,
        avatarId: avatarId ?? null,
        phone: user?.phone ?? null,
      });

      if (projectTitle.trim()) {
        let imageIds: number[] | undefined;
        if (projectImageUri) {
          const uploaded = await uploadImageFromUri(projectImageUri, 'project.jpg');
          imageIds = [uploaded.id];
        }
        await createPortfolioProject({
          title: projectTitle.trim(),
          description: projectDescription.trim() || null,
          imageIds,
        });
      }

      routeAfterAuth(userRes.user, returnTo);
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
              Showcase your work, get discovered by customers, and build your reputation on ARK.
            </Text>
            <Text style={styles.label}>YOUR NAME</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="e.g. Rajesh Kumar"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton
              label="Yes, I'm a professional"
              onPress={() => {
                if (!fullName.trim()) {
                  setError('Please enter your name');
                  return;
                }
                setError('');
                setStep('trade');
              }}
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
        ) : null}

        {step === 'trade' ? (
          <>
            <Text style={styles.heading}>Your trade</Text>
            <Text style={styles.sub}>Choose your profession and directory visibility.</Text>
            <Text style={styles.label}>PROFESSION</Text>
            <View style={styles.grid}>
              {PROFESSION_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.key}
                  style={[styles.chip, professionType === opt.key && styles.chipActive]}
                  onPress={() => {
                    setProfessionType(opt.key);
                    setSelectedSpecialties([]);
                  }}>
                  <MaterialIcons
                    name={opt.icon as keyof typeof MaterialIcons.glyphMap}
                    size={20}
                    color={professionType === opt.key ? colors.primary : colors.iconMuted}
                  />
                  <Text style={[styles.chipText, professionType === opt.key && styles.chipTextActive]}>
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
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>Show in directory</Text>
                <Text style={styles.toggleSub}>Let customers discover your profile.</Text>
              </View>
              <Switch
                value={listed}
                onValueChange={setListed}
                trackColor={{ true: colors.secondary, false: colors.outlineVariant }}
                thumbColor={colors.surface}
              />
            </View>
            <PrimaryButton
              label="Continue"
              onPress={() => {
                if (professionType === 'other' && !otherProfession.trim()) {
                  setError('Please specify your profession');
                  return;
                }
                setError('');
                setStep('details');
              }}
              style={styles.btn}
            />
            <PrimaryButton label="Back" variant="outline" onPress={() => setStep('ask')} style={styles.btn} />
          </>
        ) : null}

        {step === 'details' ? (
          <>
            <Text style={styles.heading}>Experience & areas</Text>
            <Text style={styles.sub}>Help customers find the right professional.</Text>
            <Text style={styles.label}>YEARS OF EXPERIENCE</Text>
            <TextInput
              style={styles.input}
              value={yearsExperience}
              onChangeText={setYearsExperience}
              keyboardType="number-pad"
              placeholder="e.g. 8"
            />
            <Text style={styles.label}>CITY</Text>
            <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Hyderabad" />
            <Text style={styles.label}>SERVICE AREAS</Text>
            <View style={styles.wrapChips}>
              {pincodes.map((pin) => (
                <Pressable
                  key={pin.id}
                  style={[styles.miniChip, selectedPincodes.includes(pin.id) && styles.chipActive]}
                  onPress={() => togglePincode(pin.id)}>
                  <Text
                    style={[
                      styles.miniChipText,
                      selectedPincodes.includes(pin.id) && styles.chipTextActive,
                    ]}>
                    {pin.pincode}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>SPECIALTIES</Text>
            <View style={styles.wrapChips}>
              {specialties.map((spec) => (
                <Pressable
                  key={spec.id}
                  style={[styles.miniChip, selectedSpecialties.includes(spec.id) && styles.chipActive]}
                  onPress={() => toggleSpecialty(spec.id)}>
                  <Text
                    style={[
                      styles.miniChipText,
                      selectedSpecialties.includes(spec.id) && styles.chipTextActive,
                    ]}>
                    {spec.name}
                  </Text>
                </Pressable>
              ))}
            </View>
            <PrimaryButton label="Continue" onPress={() => setStep('profile')} style={styles.btn} />
            <PrimaryButton label="Back" variant="outline" onPress={() => setStep('trade')} style={styles.btn} />
          </>
        ) : null}

        {step === 'profile' ? (
          <>
            <Text style={styles.heading}>Your profile</Text>
            <Text style={styles.sub}>Add a photo and tell customers about yourself.</Text>
            <Pressable style={styles.avatarBtn} onPress={() => void pickImage(setAvatarUri)}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialIcons name="add-a-photo" size={28} color={colors.secondary} />
                  <Text style={styles.avatarLabel}>Add photo</Text>
                </View>
              )}
            </Pressable>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="e.g. Rajesh Kumar"
            />
            <Text style={styles.label}>EMAIL (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.label}>HEADLINE</Text>
            <TextInput
              style={styles.input}
              value={headline}
              onChangeText={setHeadline}
              placeholder="e.g. Residential tiling specialist"
            />
            <Text style={styles.label}>BIO</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Describe your experience and the projects you take on"
              multiline
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton
              label="Continue"
              onPress={() => {
                if (!fullName.trim()) {
                  setError('Please enter your full name');
                  return;
                }
                setError('');
                setStep('portfolio');
              }}
              style={styles.btn}
            />
            <PrimaryButton label="Skip portfolio" variant="outline" onPress={() => void finishAsPro()} loading={loading} style={styles.btn} />
            <PrimaryButton label="Back" variant="outline" onPress={() => setStep('details')} style={styles.btn} />
          </>
        ) : null}

        {step === 'portfolio' ? (
          <>
            <Text style={styles.heading}>Showcase your work</Text>
            <Text style={styles.sub}>Add your best project. You can add more later.</Text>
            <Text style={styles.label}>PROJECT TITLE</Text>
            <TextInput
              style={styles.input}
              value={projectTitle}
              onChangeText={setProjectTitle}
              placeholder="e.g. 3BHK tiling — Gachibowli"
            />
            <Text style={styles.label}>DESCRIPTION</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={projectDescription}
              onChangeText={setProjectDescription}
              placeholder="What did you deliver?"
              multiline
            />
            <Pressable style={styles.photoBtn} onPress={() => void pickImage(setProjectImageUri)}>
              <MaterialIcons name="photo-library" size={20} color={colors.secondary} />
              <Text style={styles.photoBtnText}>
                {projectImageUri ? 'Change project photos' : 'Add project photo'}
              </Text>
            </Pressable>
            {projectImageUri ? (
              <Image source={{ uri: projectImageUri }} style={styles.projectPreview} contentFit="cover" />
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton label="Finish & enter ARK" onPress={() => void finishAsPro()} loading={loading} style={styles.btn} />
            <PrimaryButton label="Skip for now" variant="outline" onPress={() => void finishAsPro()} loading={loading} style={styles.btn} />
            <PrimaryButton label="Back" variant="outline" onPress={() => setStep('profile')} style={styles.btn} />
          </>
        ) : null}
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
  sub: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.unit6 },
  label: { ...typography.labelLg, color: colors.primary, marginBottom: spacing.unit2 },
  btn: { marginBottom: spacing.unit3 },
  grid: { gap: spacing.unit2, marginBottom: spacing.unit4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
    padding: spacing.unit3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.secondary, backgroundColor: colors.secondaryContainer },
  chipText: { ...typography.labelLg, color: colors.onSurfaceVariant, flex: 1 },
  chipTextActive: { color: colors.primary, fontWeight: '700' },
  wrapChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.unit2, marginBottom: spacing.unit4 },
  miniChip: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 999,
    paddingHorizontal: spacing.unit3,
    paddingVertical: spacing.unit2,
    backgroundColor: colors.surface,
  },
  miniChipText: { ...typography.labelMd, color: colors.onSurfaceVariant },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit3,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.unit4,
    marginBottom: spacing.unit4,
  },
  toggleText: { flex: 1 },
  toggleTitle: { ...typography.labelLg, color: colors.primary },
  toggleSub: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 4, fontSize: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: spacing.unit3,
    backgroundColor: colors.surfaceContainerLowest,
    ...typography.bodyMd,
    color: colors.onSurface,
    marginBottom: spacing.unit4,
  },
  bioInput: { minHeight: 88, textAlignVertical: 'top' },
  avatarBtn: { alignSelf: 'center', marginBottom: spacing.unit4 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  avatarLabel: { ...typography.labelMd, color: colors.secondary },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.unit2, marginBottom: spacing.unit3 },
  photoBtnText: { ...typography.labelMd, color: colors.secondary },
  projectPreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
    marginBottom: spacing.unit4,
  },
  error: { color: colors.error, marginBottom: spacing.unit3 },
});
