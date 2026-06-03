import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, spacing, typography } from '@/lib/theme';
import { useCartStore } from '@/stores/cart';
import { useLocationStore } from '@/stores/location';

export default function CartScreen() {
  const items = useCartStore((s) => s.items);
  const deliveryAddress = useLocationStore((s) => s.deliveryAddress);
  const setDeliveryAddress = useLocationStore((s) => s.setDeliveryAddress);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal());
  const taxes = useCartStore((s) => s.taxes());
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
            <View style={styles.lineBody}>
              <Text style={styles.lineName}>{item.name}</Text>
              <Text style={styles.lineMeta}>
                {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}
                {item.variantLabel ? ` · ${item.variantLabel}` : ` / ${item.unit}`}
              </Text>
              <Text style={styles.lineTotal}>
                ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <Pressable onPress={() => removeItem(item.lineId)}>
              <MaterialIcons name="close" size={22} color={colors.iconMuted} />
            </Pressable>
          </View>
        ))}

        <View style={styles.addressCard}>
          <MaterialIcons name="local-shipping" size={24} color={colors.icon} />
          <View style={styles.addressBody}>
            <Text style={styles.addressLabel}>DELIVERY TO</Text>
            <TextInput
              style={styles.addressInput}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              multiline
            />
          </View>
        </View>

        <View style={styles.summary}>
          <Row label="Items Total" value={`₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} />
          <Row label="Delivery Fee" value="Free" valueStyle={styles.free} />
          <Row label="Taxes & Cess" value={`₹${taxes.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} />
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
    gap: spacing.unit4,
  },
  lineBody: { flex: 1 },
  lineName: { ...typography.labelLg, color: colors.primary },
  lineMeta: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 4 },
  lineTotal: { ...typography.labelLg, color: colors.primary, marginTop: 4, fontWeight: '700' },
  addressCard: {
    flexDirection: 'row',
    gap: spacing.unit3,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(119, 90, 25, 0.3)',
    padding: spacing.unit4,
    marginVertical: spacing.unit4,
  },
  addressBody: { flex: 1 },
  addressLabel: { ...typography.labelMd, color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  addressInput: { ...typography.labelLg, color: colors.onSurface, marginTop: 4, padding: 0 },
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
