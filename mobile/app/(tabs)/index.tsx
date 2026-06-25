import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
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
import { HomeBannerCarousel } from '@/components/HomeBannerCarousel';
import { ProductCarousel } from '@/components/ProductCarousel';
import { ScreenBackground } from '@/components/ScreenBackground';
import { fetchAppConfig, fetchCategories, fetchHomeBanners, fetchProducts } from '@/lib/api';
import { colors, spacing, typography } from '@/lib/theme';
import type { Category } from '@/lib/types';

export default function HomeScreen() {
  const { data: configData } = useQuery({
    queryKey: ['app-config'],
    queryFn: () => fetchAppConfig(),
  });

  const { data: bannersData, isLoading: bannersLoading } = useQuery({
    queryKey: ['home-banners'],
    queryFn: fetchHomeBanners,
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

  const config = configData?.data;
  const homeBanners = bannersData?.data ?? [];
  const categories = categoriesData?.data ?? [];
  const deals = dealsData?.data ?? [];
  const bestSellers = bestData?.data ?? [];
  const featured = featuredData?.data ?? [];

  const promoLink = config?.promoCtaLink?.startsWith('/')
    ? config.promoCtaLink
    : '/search';

  return (
    <ScreenBackground variant="hero" style={styles.container}>
      <AppHeader showLocation showSearch variant="home" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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

        <HomeBannerCarousel banners={homeBanners} loading={bannersLoading} />

        <Pressable style={styles.prosCard} onPress={() => router.push('/(tabs)/professionals' as never)}>
          <MaterialIcons name="groups" size={28} color={colors.secondary} />
          <View style={styles.prosText}>
            <Text style={styles.prosTitle}>Find Professionals</Text>
            <Text style={styles.prosSub}>Contractors & trades in Hyderabad</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.iconMuted} />
        </Pressable>

        <ProductCarousel
          title="Deals of the Week"
          loading={dealsLoading}
          products={deals}
          emptyText="New deals coming soon"
        />

        <ProductCarousel
          title="Best Sellers"
          loading={bestLoading}
          products={bestSellers}
          emptyText="Browse categories for top picks"
        />

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

        <ProductCarousel
          title="Popular Products"
          loading={featuredLoading}
          products={featured}
        />
      </ScrollView>
    </ScreenBackground>
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
  scroll: { paddingBottom: spacing.unit12 },
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
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.containerMargin,
    marginBottom: spacing.unit4,
  },
  sectionTitle: { ...typography.headlineMd, color: colors.primary, paddingHorizontal: spacing.containerMargin, marginBottom: spacing.unit2 },
  link: { ...typography.labelLg, color: colors.secondary },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.containerMargin,
    gap: spacing.unit3,
    marginBottom: spacing.unit6,
  },
});
