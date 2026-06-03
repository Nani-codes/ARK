import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { CategoryTile } from '@/components/CategoryTile';
import { ProductCard } from '@/components/ProductCard';
import { ScreenBackground } from '@/components/ScreenBackground';
import { fetchCategories, fetchProducts } from '@/lib/api';
import { colors, spacing, typography } from '@/lib/theme';
import type { Category } from '@/lib/types';

export default function HomeScreen() {
  const [search, setSearch] = useState('');

  const { data: categoriesData, isLoading: catLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { data: productsData, isLoading: prodLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => fetchProducts({ featured: true }),
  });

  const categories = categoriesData?.data ?? [];
  const products = useMemo(() => {
    const list = productsData?.data ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((p) => p.name.toLowerCase().includes(q));
  }, [productsData, search]);

  return (
    <ScreenBackground variant="hero" style={styles.container}>
      <AppHeader showLocation variant="home" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.trustBar}>
          <TrustItem icon="local-shipping" title="Pay on Delivery" sub="After verifying" />
          <TrustItem icon="published-with-changes" title="7 Day Replacement" sub="Quality issues" />
          <TrustItem icon="savings" title="5 Crore+ Savings" sub="Unbeatable prices" />
        </View>
        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={22} color={colors.iconMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.search}
            placeholder="Search cement, steel, tiles..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={colors.onSurfaceVariant}
          />
        </View>

        <Pressable style={styles.banner} onPress={() => router.push('/quote')}>
          <View style={styles.bannerContent}>
            <View style={styles.offerTag}>
              <Text style={styles.offerText}>OFFER</Text>
            </View>
            <Text style={styles.bannerTitle}>Bulk Quote Discounts</Text>
            <Text style={styles.bannerSub}>Save up to 15% on truckload orders.</Text>
            <View style={styles.bannerBtn}>
              <Text style={styles.bannerBtnText}>GET QUOTE</Text>
            </View>
          </View>
        </Pressable>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Pressable onPress={() => router.push('/(tabs)/categories')}>
            <Text style={styles.link}>View All</Text>
          </Pressable>
        </View>

        {catLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <View style={styles.catGrid}>
            {categories.map((cat: Category) => (
              <CategoryTile key={cat.documentId} category={cat} />
            ))}
          </View>
        )}

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Popular Products</Text>
        </View>

        {prodLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productRow}>
            {products.map((p) => (
              <View key={p.documentId} style={styles.productGap}>
                <ProductCard product={p} />
              </View>
            ))}
          </ScrollView>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

function TrustItem({
  icon,
  title,
  sub,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  sub: string;
}) {
  return (
    <View style={styles.trustItem}>
      <View style={styles.trustIcon}>
        <MaterialIcons name={icon} size={22} color={colors.primary} />
      </View>
      <View>
        <Text style={styles.trustTitle}>{title}</Text>
        <Text style={styles.trustSub}>{sub}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  trustBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.containerMargin,
    paddingVertical: spacing.unit4,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surface,
    gap: spacing.unit2,
  },
  trustItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.unit2 },
  trustIcon: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.unit2,
    borderRadius: 8,
  },
  trustTitle: { ...typography.labelLg, color: colors.primary, fontSize: 11, lineHeight: 14 },
  trustSub: { fontSize: 10, color: colors.onSurfaceVariant, lineHeight: 12 },
  scroll: { paddingBottom: spacing.unit12 },
  searchWrap: {
    marginHorizontal: spacing.containerMargin,
    marginVertical: spacing.unit3,
    position: 'relative',
  },
  searchIcon: { position: 'absolute', left: 16, top: 14, zIndex: 1 },
  search: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    paddingVertical: 12,
    paddingLeft: 44,
    paddingRight: 16,
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  banner: {
    marginHorizontal: spacing.containerMargin,
    marginBottom: spacing.unit6,
    backgroundColor: colors.primaryContainer,
    borderRadius: 12,
    padding: spacing.unit6,
    minHeight: 140,
  },
  bannerContent: { maxWidth: '80%' },
  offerTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginBottom: 8,
  },
  offerText: { ...typography.labelMd, color: colors.primary, fontWeight: '700' },
  bannerTitle: { ...typography.headlineMd, color: colors.onPrimary, marginBottom: 4 },
  bannerSub: { ...typography.bodyMd, color: 'rgba(255,255,255,0.75)', marginBottom: 12 },
  bannerBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bannerBtnText: { ...typography.labelMd, color: colors.onSecondary, fontWeight: '700' },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.containerMargin,
    marginBottom: spacing.unit4,
  },
  sectionTitle: { ...typography.headlineMd, color: colors.primary },
  link: { ...typography.labelLg, color: colors.secondary },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.containerMargin,
    gap: spacing.unit3,
    marginBottom: spacing.unit6,
  },
  productRow: { paddingLeft: spacing.containerMargin, marginBottom: spacing.unit8 },
  productGap: { marginRight: spacing.unit4 },
});
