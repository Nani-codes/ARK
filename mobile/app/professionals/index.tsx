import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { fetchProfessionals } from '@/lib/api';
import { professionIcon, professionLabel } from '@/lib/professions';
import { colors, spacing, typography } from '@/lib/theme';

export default function ProfessionalsScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['professionals'],
    queryFn: fetchProfessionals,
  });

  const professionals = data?.data ?? [];

  return (
    <View style={styles.container}>
      <AppHeader title="Find Professionals" showBack showLocation={false} showSearch />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          Verified contractors and tradespeople in Hyderabad who opted in to ARK's directory.
        </Text>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.unit8 }} />
        ) : professionals.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="groups" size={48} color={colors.iconMuted} />
            <Text style={styles.emptyTitle}>No professionals listed yet</Text>
            <Text style={styles.emptySub}>
              Pros can enable listing from Profile → Professional Profile.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {professionals.map((pro) => {
              const icon = professionIcon(pro.professionType) as keyof typeof MaterialIcons.glyphMap;
              return (
                <View key={pro.id} style={styles.card}>
                  <View style={styles.iconWrap}>
                    <MaterialIcons name={icon} size={28} color={colors.primary} />
                  </View>
                  <Text style={styles.name} numberOfLines={1}>{pro.displayName}</Text>
                  <Text style={styles.trade}>{professionLabel(pro.professionType)}</Text>
                  {pro.contractorId ? (
                    <Text style={styles.meta} numberOfLines={1}>ID: {pro.contractorId}</Text>
                  ) : null}
                  {pro.professionalBio ? (
                    <Text style={styles.bio} numberOfLines={2}>{pro.professionalBio}</Text>
                  ) : null}
                  {pro.phone ? (
                    <Pressable
                      style={styles.callBtn}
                      onPress={() => Linking.openURL(`tel:+91${pro.phone}`)}>
                      <MaterialIcons name="phone" size={18} color={colors.onSecondary} />
                      <Text style={styles.callText}>Call</Text>
                    </Pressable>
                  ) : null}
                </View>
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
  emptyTitle: { ...typography.headlineMd, color: colors.onSurfaceVariant },
  emptySub: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.unit3,
  },
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
