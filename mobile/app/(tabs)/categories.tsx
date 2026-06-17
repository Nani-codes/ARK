import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { CategoryTile } from '@/components/CategoryTile';
import { fetchCategories } from '@/lib/api';
import { colors, spacing } from '@/lib/theme';
import type { Category } from '@/lib/types';

export default function CategoriesScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const categories = data?.data ?? [];

  return (
    <View style={styles.container}>
      <AppHeader title="Categories" showSearch />
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {categories.map((cat: Category) => (
            <CategoryTile key={cat.documentId} category={cat} variant="row" />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.containerMargin, gap: spacing.unit3 },
});
