import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { GuestAuthPrompt } from '@/components/GuestAuthPrompt';
import { fetchOrders } from '@/lib/api';
import { ORDER_STATUS_STYLES, orderDisplayNumber, orderDisplayTitle } from '@/lib/orderDisplay';
import { colors, spacing, typography } from '@/lib/theme';
import type { Order } from '@/lib/types';
import { useAuthStore } from '@/stores/auth';

export default function OrdersScreen() {
  const token = useAuthStore((s) => s.token);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    enabled: isHydrated && !!token,
  });

  useFocusEffect(
    useCallback(() => {
      if (token) refetch();
    }, [token, refetch])
  );

  const orders = data?.data ?? [];

  if (isHydrated && !token) {
    return (
      <View style={styles.container}>
        <AppHeader title="Order History" showCart={false} showSearch />
        <GuestAuthPrompt
          icon="receipt-long"
          title="Sign in to view your orders"
          subtitle="Track deliveries, reorder materials, and manage returns after you sign in."
          returnTo="/(tabs)/orders"
          message="Sign in to view your orders"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Order History" showCart={false} showSearch />
      {!isHydrated || isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : isError ? (
        <View style={styles.empty}>
          <MaterialIcons name="error-outline" size={64} color={colors.error} />
          <Text style={styles.emptyTitle}>Could not load orders</Text>
          <Text style={styles.emptySub}>
            {error instanceof Error ? error.message : 'Please try again.'}
          </Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.empty}>
          <MaterialIcons name="receipt-long" size={64} color={colors.iconMuted} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySub}>Your orders will appear here after checkout.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
          {orders.map((order: Order) => {
            const status =
              ORDER_STATUS_STYLES[order.orderStatus] ?? ORDER_STATUS_STYLES.pending;
            const itemCount = order.items?.length ?? 0;
            const totalQty = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
            return (
              <Pressable
                key={order.documentId}
                style={styles.card}
                onPress={() => router.push(`/order/${order.documentId}`)}>
                <View style={styles.cardLeft}>
                  <View style={styles.thumb}>
                    <MaterialIcons name="inventory-2" size={28} color={colors.icon} />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.date}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }).toUpperCase()}
                    </Text>
                    <Text style={styles.orderNum} numberOfLines={1}>
                      {orderDisplayTitle(order)}
                    </Text>
                    <Text style={styles.meta}>
                      #{orderDisplayNumber(order.orderNumber)} • {itemCount} Items • {totalQty} units
                    </Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <View style={[styles.status, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                  </View>
                  <Text style={styles.total}>
                    ₹{Number(order.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                  <MaterialIcons name="chevron-right" size={22} color={colors.iconMuted} />
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.containerMargin, gap: spacing.unit4, paddingBottom: spacing.unit12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.unit8 },
  emptyTitle: { ...typography.headlineMd, color: colors.onSurface, marginTop: spacing.unit4 },
  emptySub: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.unit2 },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.unit4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardLeft: { flexDirection: 'row', gap: spacing.unit4, flex: 1, alignItems: 'center' },
  cardText: { flex: 1 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: { ...typography.labelMd, color: colors.onSurfaceVariant },
  orderNum: { ...typography.headlineMd, color: colors.primary },
  meta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  cardRight: { alignItems: 'flex-end', gap: spacing.unit2 },
  status: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  statusText: { ...typography.labelMd, fontWeight: '600' },
  total: { ...typography.priceDisplay, color: colors.primary },
});
