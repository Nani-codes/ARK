import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { fetchQuoteRequests } from '@/lib/api';
import { formatOrderDate, QUOTE_STATUS_STYLES } from '@/lib/orderDisplay';
import { colors, spacing, typography } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth';

export default function QuoteHistoryScreen() {
  const token = useAuthStore((s) => s.token);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['quotes'],
    queryFn: fetchQuoteRequests,
    enabled: isHydrated && !!token,
  });

  const quotes = data?.data ?? [];

  return (
    <View style={styles.container}>
      <AppHeader title="Quote Requests" showBack showCart={false} showLocation={false} />
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : isError ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Could not load quotes</Text>
          <PrimaryButton label="Retry" onPress={() => refetch()} />
        </View>
      ) : quotes.length === 0 ? (
        <View style={styles.empty}>
          <MaterialIcons name="description" size={64} color={colors.iconMuted} />
          <Text style={styles.emptyText}>No quote requests yet</Text>
          <PrimaryButton label="Request a Bulk Quote" onPress={() => router.push('/quote')} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
          {quotes.map((q) => {
            const status = QUOTE_STATUS_STYLES[q.quoteStatus] ?? QUOTE_STATUS_STYLES.new;
            return (
              <View key={q.documentId} style={styles.card}>
                <View style={styles.cardHead}>
                  <Text style={styles.productName}>{q.productName}</Text>
                  <View style={[styles.badge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.badgeText, { color: status.text }]}>{status.label}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>
                  {q.quantityTons} tons · {formatOrderDate(q.createdAt)}
                </Text>
                <Text style={styles.address} numberOfLines={2}>{q.siteAddress}</Text>
              </View>
            );
          })}
          <Pressable style={styles.newBtn} onPress={() => router.push('/quote')}>
            <MaterialIcons name="add" size={20} color={colors.secondary} />
            <Text style={styles.newBtnText}>New Quote Request</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.containerMargin, paddingBottom: spacing.unit12, gap: spacing.unit4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.unit4, padding: spacing.unit8 },
  emptyText: { ...typography.headlineMd, color: colors.onSurfaceVariant },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.unit4,
    gap: spacing.unit2,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.unit2 },
  productName: { ...typography.labelLg, color: colors.primary, flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { ...typography.labelMd, fontWeight: '600' },
  meta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  address: { ...typography.bodyMd, color: colors.onSurface },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.unit2,
    padding: spacing.unit4,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  newBtnText: { ...typography.labelLg, color: colors.secondary },
});
