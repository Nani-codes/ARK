import { Image } from 'expo-image';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { getCategoryImage } from '@/lib/categoryImages';
import { colors, spacing, typography } from '@/lib/theme';
import type { Category } from '@/lib/types';

type CategoryTileProps = {
  category: Category;
  variant?: 'grid' | 'row';
  style?: ViewStyle;
};

export function CategoryTile({ category, variant = 'grid', style }: CategoryTileProps) {
  const image = getCategoryImage(category.slug);

  if (variant === 'row') {
    return (
      <Pressable
        style={[styles.row, style]}
        onPress={() => router.push(`/category/${category.slug}`)}>
        <View style={styles.rowImageWrap}>
          {image ? (
            <Image source={image} style={styles.rowImage} contentFit="contain" />
          ) : (
            <MaterialIcons name="category" size={28} color={colors.icon} />
          )}
        </View>
        <Text style={styles.rowName}>{category.name}</Text>
        <MaterialIcons name="chevron-right" size={24} color={colors.iconMuted} />
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[styles.tile, style]}
      onPress={() => router.push(`/category/${category.slug}`)}>
      <View style={styles.imageBox}>
        {image ? (
          <Image source={image} style={styles.image} contentFit="contain" />
        ) : (
          <MaterialIcons name="category" size={28} color={colors.icon} />
        )}
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {category.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { width: '22%', alignItems: 'center', marginBottom: spacing.unit2 },
  imageBox: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.unit2,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  label: {
    ...typography.labelMd,
    color: colors.primary,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.unit4,
    gap: spacing.unit4,
  },
  rowImageWrap: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.unit1,
    overflow: 'hidden',
  },
  rowImage: { width: '100%', height: '100%' },
  rowName: { ...typography.labelLg, color: colors.primary, flex: 1 },
});
