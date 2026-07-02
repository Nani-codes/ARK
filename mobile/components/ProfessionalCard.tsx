import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';

import { StarRating } from '@/components/StarRating';
import { professionIcon, professionLabel } from '@/lib/professions';
import { colors, shadows, spacing, typography } from '@/lib/theme';
import type { ProfessionalProfile } from '@/lib/types';

type ProfessionalCardProps = {
  pro: ProfessionalProfile;
  onPress: () => void;
  compact?: boolean;
};

export function ProfessionalCard({ pro, onPress, compact = false }: ProfessionalCardProps) {
  const icon = professionIcon(pro.professionType) as keyof typeof MaterialIcons.glyphMap;
  const location = pro.city ?? pro.serviceAreas[0]?.city ?? 'Hyderabad';

  return (
    <Pressable style={[styles.card, compact && styles.cardCompact]} onPress={onPress}>
      <View style={styles.coverWrap}>
        {pro.coverImageUrl || pro.avatarUrl ? (
          <Image
            source={{ uri: pro.coverImageUrl ?? pro.avatarUrl }}
            style={styles.cover}
            contentFit="cover"
          />
        ) : (
          <View style={styles.iconWrap}>
            <MaterialIcons name={icon} size={28} color={colors.primary} />
          </View>
        )}
        {pro.verified ? (
          <View style={styles.verifiedBadge}>
            <MaterialIcons name="verified" size={14} color={colors.onSecondary} />
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {pro.displayName}
        </Text>
        <Text style={styles.trade}>{professionLabel(pro.professionType, pro.otherProfession)}</Text>
        <StarRating rating={pro.ratingAverage} size={14} showValue count={pro.ratingCount} />
        <Text style={styles.meta}>
          {pro.yearsExperience > 0 ? `${pro.yearsExperience}+ yrs · ` : ''}
          {location}
          {pro.workCount ? ` · ${pro.workCount} projects` : ''}
        </Text>
        {pro.specialties.length ? (
          <View style={styles.chips}>
            {pro.specialties.slice(0, 2).map((s) => (
              <View key={s.id} style={styles.chip}>
                <Text style={styles.chipText}>{s.name}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {pro.headline || pro.bio ? (
          <Text style={styles.bio} numberOfLines={2}>
            {pro.headline ?? pro.bio}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <Pressable style={styles.viewBtn} onPress={onPress}>
            <MaterialIcons name="person" size={16} color={colors.onPrimary} />
            <Text style={styles.viewText}>View Profile</Text>
          </Pressable>
          {pro.phone ? (
            <Pressable
              style={styles.callBtn}
              onPress={(e) => {
                e.stopPropagation?.();
                void Linking.openURL(`tel:+91${pro.phone}`);
              }}>
              <MaterialIcons name="phone" size={16} color={colors.onSecondary} />
              <Text style={styles.callText}>Call</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 160,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardCompact: { minWidth: '47%' },
  coverWrap: { position: 'relative' },
  cover: { width: '100%', height: 110, backgroundColor: colors.surfaceContainerLow },
  iconWrap: {
    width: '100%',
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondaryContainer,
  },
  verifiedBadge: {
    position: 'absolute',
    top: spacing.unit2,
    right: spacing.unit2,
    backgroundColor: colors.secondary,
    borderRadius: 999,
    padding: 4,
  },
  body: { padding: spacing.unit3, gap: 4 },
  name: { ...typography.labelLg, color: colors.primary, fontWeight: '700' },
  trade: { ...typography.labelMd, color: colors.secondary },
  meta: { ...typography.labelMd, color: colors.onSurfaceVariant, fontSize: 11 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.unit1, marginTop: 2 },
  chip: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: 999,
    paddingHorizontal: spacing.unit2,
    paddingVertical: 2,
  },
  chipText: { ...typography.labelMd, color: colors.onSecondaryContainer, fontSize: 10 },
  bio: { ...typography.bodyMd, color: colors.onSurfaceVariant, fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.unit2, marginTop: spacing.unit2 },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit1,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: spacing.unit3,
    paddingVertical: spacing.unit1,
  },
  viewText: { ...typography.labelMd, color: colors.onPrimary, fontWeight: '700' },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit1,
    backgroundColor: colors.secondary,
    borderRadius: 999,
    paddingHorizontal: spacing.unit3,
    paddingVertical: spacing.unit1,
  },
  callText: { ...typography.labelMd, color: colors.onSecondary, fontWeight: '700' },
});
