import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { fetchProfessionals } from '@/lib/api';
import { professionIcon, professionLabel } from '@/lib/professions';
import { colors, shadows, spacing, typography } from '@/lib/theme';

type ProfessionalsDirectoryProps = {
  showBack?: boolean;
};

export function ProfessionalsDirectory({ showBack = false }: ProfessionalsDirectoryProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['professionals'],
    queryFn: fetchProfessionals,
  });

  const professionals = data?.data ?? [];

  return (
    <View style={styles.container}>
      <AppHeader
        title="Professionals"
        showBack={showBack}
        showLocation={false}
        showSearch={false}
        variant="navy"
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          Verified contractors and tradespeople in Hyderabad. Tap a profile to view their work.
        </Text>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.unit8 }} />
        ) : professionals.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <MaterialIcons name="groups" size={40} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No professionals listed yet</Text>
            <Text style={styles.emptySub}>
              Verified contractors will appear here once listed.
            </Text>
            <Pressable style={styles.becomeProBtn} onPress={() => router.push('/profile/professional' as never)}>
              <MaterialIcons name="engineering" size={18} color={colors.onSecondary} />
              <Text style={styles.becomeProText}>Become a Professional</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.grid}>
            {professionals.map((pro) => {
              const icon = professionIcon(pro.professionType) as keyof typeof MaterialIcons.glyphMap;
              return (
                <Pressable
                  key={pro.id}
                  style={styles.card}
                  onPress={() => router.push(`/professionals/${pro.id}` as never)}>
                  {pro.coverImageUrl ? (
                    <Image source={{ uri: pro.coverImageUrl }} style={styles.cover} contentFit="cover" />
                  ) : (
                    <View style={styles.iconWrap}>
                      <MaterialIcons name={icon} size={28} color={colors.primary} />
                    </View>
                  )}
                  <Text style={styles.name} numberOfLines={1}>
                    {pro.displayName}
                  </Text>
                  <Text style={styles.trade}>{professionLabel(pro.professionType)}</Text>
                  {pro.workCount ? (
                    <Text style={styles.meta}>{pro.workCount} project{pro.workCount === 1 ? '' : 's'}</Text>
                  ) : null}
                  {pro.professionalBio ? (
                    <Text style={styles.bio} numberOfLines={2}>
                      {pro.professionalBio}
                    </Text>
                  ) : null}
                  {pro.phone ? (
                    <Pressable
                      style={styles.callBtn}
                      onPress={() => void Linking.openURL(`tel:+91${pro.phone}`)}>
                      <MaterialIcons name="phone" size={18} color={colors.onSecondary} />
                      <Text style={styles.callText}>Call</Text>
                    </Pressable>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.containerMargin, paddingBottom: spacing.unit12 },
  intro: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.unit6 },
  empty: { alignItems: 'center', gap: spacing.unit3, paddingVertical: spacing.unit12 },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.unit2,
  },
  emptyTitle: { ...typography.headlineMd, color: colors.primary, textAlign: 'center' },
  emptySub: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
  becomeProBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
    marginTop: spacing.unit2,
    backgroundColor: colors.secondary,
    borderRadius: 999,
    paddingHorizontal: spacing.unit6,
    paddingVertical: spacing.unit3,
  },
  becomeProText: { ...typography.labelLg, color: colors.onSecondary, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.unit3 },
  card: {
    width: '47%',
    flexGrow: 1,
    minWidth: 148,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.unit4,
    alignItems: 'center',
    ...shadows.sm,
  },
  cover: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: spacing.unit2,
    backgroundColor: colors.surfaceContainerLow,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.unit2,
  },
  name: { ...typography.labelLg, color: colors.primary, fontWeight: '700', textAlign: 'center' },
  trade: { ...typography.labelMd, color: colors.secondary, marginTop: 2, textAlign: 'center' },
  meta: { ...typography.labelMd, color: colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' },
  bio: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.unit2,
    textAlign: 'center',
    fontSize: 12,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit1,
    backgroundColor: colors.secondary,
    borderRadius: 999,
    paddingHorizontal: spacing.unit4,
    paddingVertical: spacing.unit2,
    marginTop: spacing.unit3,
  },
  callText: { ...typography.labelMd, color: colors.onSecondary, fontWeight: '700' },
});
