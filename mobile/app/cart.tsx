import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { CartQuantityControl } from '@/components/CartQuantityControl';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionHeader } from '@/components/SectionHeader';
import { GST_LABEL } from '@/lib/pricing';
import { colors, spacing, typography } from '@/lib/theme';
import { useCartStore } from '@/stores/cart';

export default function CartScreen() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const taxes = useCartStore((s) => s.taxes());
  const deliveryFee = useCartStore((s) => s.deliveryFee());
  const total = useCartStore((s) => s.total());

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <AppHeader showBack showLocation={false} />
        <SectionHeader title="Your Cart" icon="shopping-basket" />
        <View style={styles.empty}>
          <MaterialIcons name="shopping-basket" size={64} color={colors.iconMuted} />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <PrimaryButton label="Continue Shopping" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader showBack showLocation={false} />
      <SectionHeader title="Your Cart" icon="shopping-basket" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {items.map((item) => (
          <View key={item.lineId} style={styles.line}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.thumb} contentFit="cover" />
            ) : (
              <View style={styles.thumbPlaceholder}>
                <MaterialIcons name="inventory-2" size={24} color={colors.icon} />
              </View>
            )}
            <View style={styles.lineBody}>
              <Text style={styles.lineName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.lineMeta}>
                ₹{item.unitPrice.toLocaleString('en-IN')}
                {item.variantLabel ? ` · ${item.variantLabel}` : ` / ${item.unit}`}
              </Text>
              <Text style={styles.lineTotal}>
                ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
              <CartQuantityControl lineId={item.lineId} quantity={item.quantity} />
            </View>
          </View>
        ))}

        <View style={styles.summary}>
          <Row label="Items Total" value={`₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} />
          <Row
            label="Delivery Fee"
            value={deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
            valueStyle={deliveryFee === 0 ? styles.free : undefined}
          />
          <Row label={GST_LABEL} value={`₹${taxes.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} />
          <View style={styles.divider} />
          <Row
            label="To Pay"
            value={`₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            bold
          />
        </View>

        <PrimaryButton
          label="Proceed to Checkout"
          onPress={() => router.push('/checkout')}
          style={{ marginTop: spacing.unit4 }}
        />
      </ScrollView>
    </View>
  );
}

function Row({
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
    <View style={styles.row}>
      <Text style={bold ? styles.rowLabelBold : styles.rowLabel}>{label}</Text>
      <Text style={[bold ? styles.rowValueBold : styles.rowValue, valueStyle]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.containerMargin, paddingBottom: spacing.unit12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.unit4, padding: spacing.unit8 },
  emptyText: { ...typography.headlineMd, color: colors.onSurfaceVariant },
  line: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.unit4,
    marginBottom: spacing.unit4,
    gap: spacing.unit3,
  },
  thumb: { width: 72, height: 72, borderRadius: 8, backgroundColor: colors.surfaceContainer },
  thumbPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineBody: { flex: 1, gap: spacing.unit1 },
  lineName: { ...typography.labelLg, color: colors.primary },
  lineMeta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  lineTotal: { ...typography.labelLg, color: colors.primary, fontWeight: '700' },
  summary: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    padding: spacing.unit4,
    gap: spacing.unit2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { ...typography.bodyMd, color: colors.onSurface },
  rowValue: { ...typography.bodyMd, color: colors.onSurface },
  rowLabelBold: { ...typography.headlineMd, color: colors.primary },
  rowValueBold: { ...typography.headlineMd, color: colors.primary },
  free: { color: colors.success, fontWeight: '700', fontSize: 12 },
  divider: { height: 1, backgroundColor: colors.outlineVariant, marginVertical: spacing.unit2 },
});
