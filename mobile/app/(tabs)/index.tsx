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
import { FreeDeliveryBanner } from '@/components/FreeDeliveryBanner';
import { HomeBannerCarousel } from '@/components/HomeBannerCarousel';
import { ProductCarousel } from '@/components/ProductCarousel';
import { ScreenBackground } from '@/components/ScreenBackground';
import { ThubBrandingSection } from '@/components/ThubBrandingSection';
import { fetchCategories, fetchHomeBanners, fetchProducts } from '@/lib/api';
import { colors, shadows, spacing, typography } from '@/lib/theme';
import type { Category } from '@/lib/types';

export default function HomeScreen() {
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

  const homeBanners = bannersData?.data ?? [];
  const categories = categoriesData?.data ?? [];
  const deals = dealsData?.data ?? [];
  const bestSellers = bestData?.data ?? [];
  const featured = featuredData?.data ?? [];

  return (
    <ScreenBackground variant="hero" style={styles.container}>
      <AppHeader showLocation showSearch variant="home" />
      <FreeDeliveryBanner />
      <ThubBrandingSection />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <HomeBannerCarousel banners={homeBanners} loading={bannersLoading} />

        {/* Deals of the Week */}
        <ProductCarousel
          title="Deals of the Week"
          loading={dealsLoading}
          products={deals}
          emptyText="New deals coming soon"
          viewAllHref="/search"
        />

        <View style={styles.divider} />

        {/* Best Sellers */}
        <ProductCarousel
          title="Best Sellers"
          loading={bestLoading}
          products={bestSellers}
          emptyText="Browse categories for top picks"
          viewAllHref="/search"
        />

        <View style={styles.divider} />

        {/* Categories Section */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Pressable onPress={() => router.push('/(tabs)/categories')}>
            <Text style={styles.link}>View All →</Text>
          </Pressable>
        </View>

        {catLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.unit6 }} />
        ) : (
          <View style={styles.catGrid}>
            {categories.map((cat: Category) => (
              <CategoryTile key={cat.documentId} category={cat} />
            ))}
          </View>
        )}

        <View style={styles.divider} />

        {/* Find Professionals — moved below products */}
        <Pressable style={styles.prosCard} onPress={() => router.push('/(tabs)/professionals' as never)}>
          <View style={styles.prosIconWrap}>
            <MaterialIcons name="groups" size={28} color={colors.secondary} />
          </View>
          <View style={styles.prosText}>
            <Text style={styles.prosTitle}>Find Professionals</Text>
            <Text style={styles.prosSub}>Verified contractors & trades in Hyderabad</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.iconMuted} />
        </Pressable>

        <View style={styles.divider} />

        {/* Popular Products */}
        <ProductCarousel
          title="Popular Products"
          loading={featuredLoading}
          products={featured}
          viewAllHref="/search"
        />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: spacing.unit12 },
  divider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    marginHorizontal: spacing.containerMargin,
    marginBottom: spacing.unit6,
    opacity: 0.5,
  },
  prosCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit3,
    marginHorizontal: spacing.containerMargin,
    marginBottom: spacing.unit6,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
    padding: spacing.unit4,
    ...shadows.sm,
  },
  prosIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prosText: { flex: 1 },
  prosTitle: { ...typography.labelLg, color: colors.primary, fontWeight: '700' },
  prosSub: { ...typography.labelMd, color: colors.onSurfaceVariant, marginTop: 2 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.containerMargin,
    marginBottom: spacing.unit3,
  },
  sectionTitle: { ...typography.headlineMd, color: colors.primary },
  link: { ...typography.labelLg, color: colors.secondary, fontWeight: '700' },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.containerMargin,
    gap: spacing.unit3,
    marginBottom: spacing.unit6,
  },
});
