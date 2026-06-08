import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
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
import { ProductCard } from '@/components/ProductCard';
import { fetchProducts, type ProductSearchParams } from '@/lib/api';
import { colors, spacing, typography } from '@/lib/theme';

type SortKey = ProductSearchParams['sort'];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'name:asc', label: 'Name A–Z' },
  { key: 'price:asc', label: 'Price ↑' },
  { key: 'price:desc', label: 'Price ↓' },
];

export default function SearchScreen() {
  const { q: initialQ } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(initialQ ?? '');
  const [submitted, setSubmitted] = useState(initialQ ?? '');
  const [sort, setSort] = useState<SortKey>('name:asc');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [brand, setBrand] = useState<string | null>(null);

  const { data: brandSource } = useQuery({
    queryKey: ['brands'],
    queryFn: () => fetchProducts({ pageSize: 100 }),
  });

  const brands = useMemo(() => {
    const set = new Set<string>();
    for (const p of brandSource?.data ?? []) {
      if (p.brand) set.add(p.brand);
    }
    return [...set].sort();
  }, [brandSource]);

  const { data, isLoading } = useQuery({
    queryKey: ['search', submitted, sort, inStockOnly, brand],
    queryFn: () =>
      fetchProducts({
        q: submitted || undefined,
        sort,
        inStock: inStockOnly || undefined,
        brand: brand ?? undefined,
        pageSize: 50,
      }),
    enabled: submitted.length > 0 || !!brand,
  });

  const products = data?.data ?? [];
  const pagination = data?.meta?.pagination;

  const runSearch = () => {
    setSubmitted(query.trim());
  };

  return (
    <View style={styles.container}>
      <AppHeader showBack showLocation={false} />
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={22} color={colors.iconMuted} />
        <TextInput
          style={styles.input}
          placeholder="Search cement, steel, tiles..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runSearch}
          returnKeyType="search"
          autoFocus={!initialQ}
        />
        {query.length > 0 ? (
          <Pressable onPress={() => { setQuery(''); setSubmitted(''); }}>
            <MaterialIcons name="close" size={20} color={colors.iconMuted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.filters}>
        {SORT_OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            style={[styles.chip, sort === opt.key && styles.chipActive]}
            onPress={() => setSort(opt.key)}>
            <Text style={[styles.chipText, sort === opt.key && styles.chipTextActive]}>{opt.label}</Text>
          </Pressable>
        ))}
        <Pressable
          style={[styles.chip, inStockOnly && styles.chipActive]}
          onPress={() => setInStockOnly((v) => !v)}>
          <Text style={[styles.chipText, inStockOnly && styles.chipTextActive]}>In stock</Text>
        </Pressable>
      </View>

      {brands.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.brandRow}>
          <Pressable
            style={[styles.chip, !brand && styles.chipActive]}
            onPress={() => setBrand(null)}>
            <Text style={[styles.chipText, !brand && styles.chipTextActive]}>All brands</Text>
          </Pressable>
          {brands.map((b) => (
            <Pressable
              key={b}
              style={[styles.chip, brand === b && styles.chipActive]}
              onPress={() => { setBrand(b); if (!submitted) setSubmitted(' '); }}>
              <Text style={[styles.chipText, brand === b && styles.chipTextActive]}>{b}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {!submitted && !brand ? (
        <View style={styles.hint}>
          <MaterialIcons name="search" size={48} color={colors.iconMuted} />
          <Text style={styles.hintText}>Search across the full catalog</Text>
        </View>
      ) : isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : products.length === 0 ? (
        <Text style={styles.empty}>No products found{submitted ? ` for "${submitted.trim()}"` : ''}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.resultCount}>
            {pagination?.total ?? products.length} result{(pagination?.total ?? 0) !== 1 ? 's' : ''}
          </Text>
          {products.map((p) => (
            <View key={p.documentId} style={styles.item}>
              <ProductCard product={p} compact />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
    marginHorizontal: spacing.containerMargin,
    marginBottom: spacing.unit3,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.unit3,
    paddingVertical: spacing.unit2,
  },
  input: { flex: 1, ...typography.bodyMd, color: colors.onSurface, padding: 0 },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.unit2,
    paddingHorizontal: spacing.containerMargin,
    marginBottom: spacing.unit3,
  },
  brandRow: { paddingLeft: spacing.containerMargin, marginBottom: spacing.unit3 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
    marginRight: spacing.unit2,
  },
  chipActive: { borderColor: colors.secondary, backgroundColor: colors.secondaryContainer },
  chipText: { ...typography.labelMd, color: colors.onSurfaceVariant },
  chipTextActive: { color: colors.primary, fontWeight: '700' },
  hint: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.unit3 },
  hintText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  empty: { ...typography.bodyLg, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 40 },
  list: { padding: spacing.containerMargin, paddingBottom: spacing.unit12, gap: spacing.unit4 },
  resultCount: { ...typography.labelMd, color: colors.onSurfaceVariant, marginBottom: spacing.unit2 },
  item: { width: '100%' },
});
