import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { fetchProfessional } from '@/lib/api';
import { professionIcon, professionLabel } from '@/lib/professions';
import { colors, spacing, typography } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth';

export default function ProfessionalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const professionalId = Number(id);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['professional', professionalId],
    queryFn: () => fetchProfessional(professionalId),
    enabled: Number.isFinite(professionalId),
  });

  const pro = data?.data;
  const isOwnProfile = user?.id === pro?.id;

  if (!Number.isFinite(professionalId)) {
    return null;
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Professional" showBack showCart={false} showLocation={false} />
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.unit12 }} />
      ) : isError || !pro ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Professional not found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.hero}>
            <View style={styles.avatar}>
              <MaterialIcons
                name={professionIcon(pro.professionType) as keyof typeof MaterialIcons.glyphMap}
                size={36}
                color={colors.primary}
              />
            </View>
            <Text style={styles.name}>{pro.displayName}</Text>
            <Text style={styles.trade}>{professionLabel(pro.professionType)}</Text>
            {pro.contractorId ? <Text style={styles.meta}>ID: {pro.contractorId}</Text> : null}
          </View>

          {pro.professionalBio ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ABOUT</Text>
              <Text style={styles.bio}>{pro.professionalBio}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>WORK SHOWCASE</Text>
            {pro.professionalWorks?.length ? (
              <View style={styles.workGrid}>
                {pro.professionalWorks.map((work) => (
                  <View key={work.id} style={styles.workCard}>
                    {work.imageUrl ? (
                      <Image source={{ uri: work.imageUrl }} style={styles.workImage} contentFit="cover" />
                    ) : (
                      <View style={styles.workPlaceholder}>
                        <MaterialIcons name="image" size={28} color={colors.iconMuted} />
                      </View>
                    )}
                    <Text style={styles.workTitle}>{work.title}</Text>
                    {work.description ? (
                      <Text style={styles.workDescription}>{work.description}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyWorks}>No portfolio projects added yet.</Text>
            )}
          </View>

          <View style={styles.actions}>
            {isOwnProfile ? (
              <PrimaryButton
                label="Edit My Profile"
                variant="outline"
                onPress={() => router.push('/profile/professional')}
              />
            ) : null}
            {pro.phone ? (
              <PrimaryButton
                label="Call Professional"
                onPress={() => void Linking.openURL(`tel:+91${pro.phone}`)}
              />
            ) : null}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.containerMargin, paddingBottom: spacing.unit12, gap: spacing.unit6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.containerMargin },
  emptyTitle: { ...typography.headlineMd, color: colors.onSurfaceVariant },
  hero: { alignItems: 'center', gap: spacing.unit1 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.unit2,
  },
  name: { ...typography.headlineMd, color: colors.primary },
  trade: { ...typography.labelLg, color: colors.secondary },
  meta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  section: { gap: spacing.unit3 },
  sectionLabel: { ...typography.labelLg, color: colors.primary },
  bio: { ...typography.bodyMd, color: colors.onSurface },
  workGrid: { gap: spacing.unit3 },
  workCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  workImage: { width: '100%', height: 180, backgroundColor: colors.surfaceContainerLow },
  workPlaceholder: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLow,
  },
  workTitle: {
    ...typography.labelLg,
    color: colors.primary,
    paddingHorizontal: spacing.unit4,
    paddingTop: spacing.unit3,
  },
  workDescription: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    paddingHorizontal: spacing.unit4,
    paddingBottom: spacing.unit4,
    paddingTop: spacing.unit1,
  },
  emptyWorks: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  actions: { gap: spacing.unit3, marginTop: spacing.unit2 },
});
