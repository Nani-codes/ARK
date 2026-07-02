import { MaterialIcons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { ProfessionalCard } from '@/components/ProfessionalCard';
import { ProfessionalFilterSheet } from '@/components/ProfessionalFilterSheet';
import { fetchProfessionals } from '@/lib/api';
import { colors, spacing, typography } from '@/lib/theme';
import type { ProfessionalFilters } from '@/lib/types';

type ProfessionalsDirectoryProps = {
  showBack?: boolean;
};

const DEFAULT_FILTERS: ProfessionalFilters = {
  sort: 'recent',
  trade: '',
  city: '',
  pincode: '',
  minRating: 0,
  minExperience: 0,
  pageSize: 20,
};

export function ProfessionalsDirectory({ showBack = false }: ProfessionalsDirectoryProps) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ProfessionalFilters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<ProfessionalFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const activeFilters = useMemo(
    () => ({ ...filters, q: search.trim() || undefined }),
    [filters, search]
  );

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, refetch, isRefetching } =
    useInfiniteQuery({
      queryKey: ['professionals', activeFilters],
      queryFn: ({ pageParam = 1 }) =>
        fetchProfessionals({ ...activeFilters, page: pageParam }),
      getNextPageParam: (lastPage) => {
        const page = lastPage.meta?.pagination?.page ?? 1;
        const pageCount = lastPage.meta?.pagination?.pageCount ?? 1;
        return page < pageCount ? page + 1 : undefined;
      },
      initialPageParam: 1,
    });

  const professionals = data?.pages.flatMap((page) => page.data) ?? [];
  const totalProfessionals = data?.pages[0]?.meta?.pagination?.total ?? professionals.length;
  const activeFilterCount = [
    filters.trade,
    filters.city,
    filters.pincode,
    filters.minRating,
    filters.minExperience,
    filters.sort !== 'recent' ? filters.sort : '',
  ].filter(Boolean).length;

  const locationLabel = filters.city || filters.pincode || 'your area';

  return (
    <View style={styles.container}>
      <AppHeader
        title="Professionals"
        showBack={showBack}
        showLocation={false}
        showSearch={false}
        variant="navy"
      />

      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={20} color={colors.iconMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, specialty..."
            placeholderTextColor={colors.onSurfaceVariant}
            returnKeyType="search"
          />
        </View>
        <Pressable style={styles.filterBtn} onPress={() => setShowFilters(true)}>
          <MaterialIcons name="tune" size={22} color={colors.primary} />
          {activeFilterCount > 0 ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {totalProfessionals} professional{totalProfessionals === 1 ? '' : 's'}
          {locationLabel !== 'your area' ? ` in ${locationLabel}` : ''}
        </Text>
      </View>

      <Text style={styles.intro}>
        Verified contractors and tradespeople in {locationLabel}. Filter by trade, rating, and
        experience.
      </Text>

      <FlatList
        data={professionals}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshing={isRefetching}
        onRefresh={() => void refetch()}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.unit8 }} />
          ) : (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <MaterialIcons name="groups" size={40} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No professionals found</Text>
              <Text style={styles.emptySub}>Try adjusting your filters or search terms.</Text>
              <Pressable
                style={styles.becomeProBtn}
                onPress={() => router.push('/profile/professional' as never)}>
                <MaterialIcons name="engineering" size={18} color={colors.onSecondary} />
                <Text style={styles.becomeProText}>Become a Professional</Text>
              </Pressable>
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.unit4 }} />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <ProfessionalCard
              pro={item}
              compact
              onPress={() => router.push(`/professionals/${item.id}` as never)}
            />
          </View>
        )}
      />

      <ProfessionalFilterSheet
        visible={showFilters}
        filters={draftFilters}
        onChange={setDraftFilters}
        onClose={() => setShowFilters(false)}
        onApply={() => {
          setFilters(draftFilters);
          setShowFilters(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
    paddingHorizontal: spacing.containerMargin,
    paddingTop: spacing.unit3,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.unit3,
    paddingVertical: spacing.unit2,
  },
  searchInput: { flex: 1, ...typography.bodyMd, color: colors.onSurface, paddingVertical: 4 },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: { ...typography.labelMd, color: colors.onSecondary, fontSize: 10, fontWeight: '700' },
  countRow: {
    paddingHorizontal: spacing.containerMargin,
    paddingTop: spacing.unit3,
  },
  countText: { ...typography.labelLg, color: colors.primary, fontWeight: '700' },
  intro: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    paddingHorizontal: spacing.containerMargin,
    paddingTop: spacing.unit1,
    paddingBottom: spacing.unit2,
  },
  list: { paddingHorizontal: spacing.containerMargin, paddingBottom: spacing.unit12, gap: spacing.unit3 },
  row: { gap: spacing.unit3 },
  cardWrap: { flex: 1 },
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
});
