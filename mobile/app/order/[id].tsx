import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { fetchOrder } from '@/lib/api';
import { formatInr } from '@/lib/productPricing';
import {
  formatOrderDate,
  orderDisplayNumber,
  ORDER_STATUS_STYLES,
  PAYMENT_METHOD_LABELS,
} from '@/lib/orderDisplay';
import { colors, spacing, typography } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useAuthStore((s) => s.token);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrder(id!),
    enabled: isHydrated && !!token && !!id,
  });

  const order = data?.data;

  if (!isHydrated || isLoading || !order) {
    return (
      <View style={styles.container}>
        <AppHeader showBack showCart={false} showLocation={false} />
        {isError ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>
              {error instanceof Error ? error.message : 'Order not found'}
            </Text>
          </View>
        ) : (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
        )}
      </View>
    );
  }

  const status = ORDER_STATUS_STYLES[order.orderStatus] ?? ORDER_STATUS_STYLES.pending;
  const items = order.items ?? [];

  return (
    <View style={styles.container}>
      <AppHeader showBack showCart={false} showLocation={false} />
      <SectionHeader
        title={`Order #${orderDisplayNumber(order.orderNumber)}`}
        icon="receipt-long"
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
          </View>
          <Text style={styles.placedAt}>Placed {formatOrderDate(order.createdAt, true)}</Text>
        </View>

        <Text style={styles.sectionLabel}>ITEMS ({items.length})</Text>
        {items.map((item, index) => (
          <View key={`${item.productName}-${index}`} style={styles.line}>
            <View style={styles.lineIcon}>
              <MaterialIcons name="inventory-2" size={24} color={colors.icon} />
            </View>
            <View style={styles.lineBody}>
              <Text style={styles.lineName}>{item.productName}</Text>
              <Text style={styles.lineMeta}>
                Qty {item.quantity} × {formatInr(Number(item.unitPrice))}
              </Text>
            </View>
            <Text style={styles.lineTotal}>{formatInr(Number(item.lineTotal))}</Text>
          </View>
        ))}

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="local-shipping" size={22} color={colors.primary} />
            <View style={styles.infoBody}>
              <Text style={styles.infoLabel}>DELIVERY ADDRESS</Text>
              <Text style={styles.infoValue}>{order.deliveryAddress}</Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <MaterialIcons name="payments" size={22} color={colors.primary} />
            <View style={styles.infoBody}>
              <Text style={styles.infoLabel}>PAYMENT METHOD</Text>
              <Text style={styles.infoValue}>
                {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.summary}>
          <SummaryRow label="Items Total" value={formatInr(Number(order.subtotal))} />
          <SummaryRow label="Delivery Fee" value="Free" valueStyle={styles.free} />
          <SummaryRow label="Taxes & Cess" value={formatInr(Number(order.taxes))} />
          <View style={styles.divider} />
          <SummaryRow label="Total Paid" value={formatInr(Number(order.total))} bold />
        </View>

        <View style={styles.gstNote}>
          <MaterialIcons name="info" size={20} color={colors.secondaryContainer} />
          <Text style={styles.gstNoteText}>
            Price inclusive of 18% GST. Tax invoice shared post-delivery.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  valueStyle,
}: {
  label: string;
  value: string;
  bold?: boolean;
  valueStyle?: object;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={bold ? styles.summaryLabelBold : styles.summaryLabel}>{label}</Text>
      <Text style={[bold ? styles.summaryValueBold : styles.summaryValue, valueStyle]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.containerMargin, paddingBottom: spacing.unit12, gap: spacing.unit2 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.unit8 },
  errorText: { ...typography.bodyMd, color: colors.error, textAlign: 'center' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.unit2,
    marginBottom: spacing.unit4,
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  statusText: { ...typography.labelMd, fontWeight: '700' },
  placedAt: { ...typography.labelMd, color: colors.onSurfaceVariant },
  sectionLabel: {
    ...typography.labelLg,
    color: colors.primary,
    marginTop: spacing.unit2,
    marginBottom: spacing.unit2,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit3,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.unit4,
    marginBottom: spacing.unit3,
  },
  lineIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineBody: { flex: 1 },
  lineName: { ...typography.labelLg, color: colors.primary },
  lineMeta: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 4 },
  lineTotal: { ...typography.labelLg, color: colors.primary, fontWeight: '700' },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.unit4,
    marginTop: spacing.unit4,
    marginBottom: spacing.unit4,
  },
  infoRow: { flexDirection: 'row', gap: spacing.unit3, alignItems: 'flex-start' },
  infoBody: { flex: 1 },
  infoLabel: { ...typography.labelMd, color: colors.onSurfaceVariant },
  infoValue: { ...typography.bodyMd, color: colors.onSurface, marginTop: 4 },
  infoDivider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    marginVertical: spacing.unit4,
  },
  summary: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    padding: spacing.unit4,
    gap: spacing.unit2,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { ...typography.bodyMd, color: colors.onSurface },
  summaryValue: { ...typography.bodyMd, color: colors.onSurface },
  summaryLabelBold: { ...typography.headlineMd, color: colors.primary },
  summaryValueBold: { ...typography.headlineMd, color: colors.primary },
  free: { color: colors.success, fontWeight: '700', fontSize: 12 },
  divider: { height: 1, backgroundColor: colors.outlineVariant, marginVertical: spacing.unit2 },
  gstNote: {
    flexDirection: 'row',
    gap: spacing.unit3,
    backgroundColor: colors.primaryContainer,
    padding: spacing.unit4,
    borderRadius: 8,
    marginTop: spacing.unit4,
  },
  gstNoteText: { ...typography.bodyMd, color: colors.onPrimary, flex: 1 },
});
