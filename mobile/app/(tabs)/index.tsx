import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { CategoryTile } from '@/components/CategoryTile';
import { ProductCard } from '@/components/ProductCard';
import { ScreenBackground } from '@/components/ScreenBackground';
import { fetchAppConfig, fetchCategories, fetchOrders, fetchProducts } from '@/lib/api';
import { colors, spacing, typography } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth';
import type { Category } from '@/lib/types';

export default function HomeScreen() {
  const token = useAuthStore((s) => s.token);

  const { data: configData } = useQuery({
    queryKey: ['app-config'],
    queryFn: () => fetchAppConfig(),
  });

  const { data: categoriesData, isLoading: catLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ['products', 'deals'],
    queryFn: () => fetchProducts({ onDeal: true, pageSize: 12 }),
  });

  const { data: bestData, isLoading: bestLoading } = useQuery({
    queryKey: ['products', 'best-sellers'],
    queryFn: () => fetchProducts({ bestSeller: true, pageSize: 12 }),
  });

  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => fetchProducts({ featured: true, pageSize: 8 }),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders', 'buy-again'],
    queryFn: fetchOrders,
    enabled: !!token,
  });

  const buyAgainIds = useMemo(() => {
    const ids = new Set<string>();
    for (const order of ordersData?.data ?? []) {
      for (const item of order.items ?? []) {
        if (item.productDocumentId) ids.add(item.productDocumentId);
      }
    }
    return [...ids].slice(0, 8);
  }, [ordersData]);

  const { data: buyAgainData } = useQuery({
    queryKey: ['products', 'buy-again', buyAgainIds],
    queryFn: async () => {
      const all = await fetchProducts({ pageSize: 100 });
      return { data: all.data.filter((p) => buyAgainIds.includes(p.documentId)) };
    },
    enabled: buyAgainIds.length > 0,
  });

  const config = configData?.data;
  const categories = categoriesData?.data ?? [];
  const deals = dealsData?.data ?? [];
  const bestSellers = bestData?.data ?? [];
  const featured = featuredData?.data ?? [];
  const buyAgain = buyAgainData?.data ?? [];

  const promoLink = config?.promoCtaLink?.startsWith('/')
    ? config.promoCtaLink
    : '/search';

  return (
    <ScreenBackground variant="hero" style={styles.container}>
      <AppHeader showLocation variant="home" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable
          style={styles.searchWrap}
          onPress={() => router.push('/search')}
          accessibilityRole="button"
          accessibilityLabel="Search catalog">
          <View style={styles.search}>
            <MaterialIcons name="search" size={22} color={colors.iconMuted} />
            <Text style={styles.searchText}>Search cement, steel, tiles...</Text>
          </View>
        </Pressable>

        {config ? (
          <Pressable
            style={styles.promoStrip}
            onPress={() => router.push(promoLink as never)}>
            <MaterialIcons name="local-shipping" size={18} color={colors.secondary} />
            <View style={styles.promoText}>
              <Text style={styles.promoTitle}>{config.promoTitle}</Text>
              <Text style={styles.promoSub}>{config.promoSubtitle}</Text>
            </View>
            <Text style={styles.promoCta}>{config.promoCtaLabel ?? 'Shop'}</Text>
          </Pressable>
        ) : null}

        <View style={styles.trustBar}>
          <TrustItem icon="local-shipping" title="Pay on Delivery" sub="After verifying" />
          <TrustItem icon="published-with-changes" title="7 Day Replacement" sub="Quality issues" />
          <TrustItem icon="savings" title="5 Crore+ Savings" sub="Unbeatable prices" />
        </View>

        <Pressable style={styles.prosCard} onPress={() => router.push('/professionals')}>
          <MaterialIcons name="groups" size={28} color={colors.secondary} />
          <View style={styles.prosText}>
            <Text style={styles.prosTitle}>Find Professionals</Text>
            <Text style={styles.prosSub}>Contractors & trades in Hyderabad</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.iconMuted} />
        </Pressable>

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

        <ProductSection
          title="Deals of the Week"
          loading={dealsLoading}
          products={deals}
          emptyText="New deals coming soon"
        />

        <ProductSection
          title="Best Sellers"
          loading={bestLoading}
          products={bestSellers}
          emptyText="Browse categories for top picks"
        />

        {buyAgain.length > 0 ? (
          <ProductSection title="Buy Again" products={buyAgain} />
        ) : null}

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

        <ProductSection
          title="Popular Products"
          loading={featuredLoading}
          products={featured}
        />
      </ScrollView>
    </ScreenBackground>
  );
}

function ProductSection({
  title,
  products,
  loading,
  emptyText,
}: {
  title: string;
  products: import('@/lib/types').Product[];
  loading?: boolean;
  emptyText?: string;
}) {
  if (loading) {
    return (
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.unit4 }} />
      </View>
    );
  }
  if (!products.length) {
    if (!emptyText) return null;
    return (
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.emptySection}>{emptyText}</Text>
      </View>
    );
  }
  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productRow}>
        {products.map((p) => (
          <View key={p.documentId} style={styles.productGap}>
            <ProductCard product={p} />
          </View>
        ))}
      </ScrollView>
    </View>
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
  promoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
    marginHorizontal: spacing.containerMargin,
    marginTop: spacing.unit2,
    backgroundColor: colors.secondaryContainer,
    borderRadius: 8,
    padding: spacing.unit3,
  },
  promoText: { flex: 1 },
  promoTitle: { ...typography.labelLg, color: colors.primary, fontWeight: '700' },
  promoSub: { ...typography.labelMd, color: colors.onSurfaceVariant, fontSize: 11 },
  promoCta: { ...typography.labelMd, color: colors.secondary, fontWeight: '700' },
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
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: spacing.containerMargin,
    marginTop: spacing.unit3,
    marginBottom: spacing.unit2,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit3,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  searchText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  prosCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit3,
    marginHorizontal: spacing.containerMargin,
    marginBottom: spacing.unit4,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.unit4,
  },
  prosText: { flex: 1 },
  prosTitle: { ...typography.labelLg, color: colors.primary, fontWeight: '700' },
  prosSub: { ...typography.labelMd, color: colors.onSurfaceVariant, marginTop: 2 },
  banner: {
    marginHorizontal: spacing.containerMargin,
    marginBottom: spacing.unit4,
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
  sectionBlock: { marginBottom: spacing.unit4 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.containerMargin,
    marginBottom: spacing.unit4,
  },
  sectionTitle: { ...typography.headlineMd, color: colors.primary, paddingHorizontal: spacing.containerMargin, marginBottom: spacing.unit2 },
  emptySection: { ...typography.bodyMd, color: colors.onSurfaceVariant, paddingHorizontal: spacing.containerMargin },
  link: { ...typography.labelLg, color: colors.secondary },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.containerMargin,
    gap: spacing.unit3,
    marginBottom: spacing.unit6,
  },
  productRow: { paddingLeft: spacing.containerMargin, marginBottom: spacing.unit4 },
  productGap: { marginRight: spacing.unit4 },
});
