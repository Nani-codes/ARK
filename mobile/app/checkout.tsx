import { MaterialIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionHeader } from '@/components/SectionHeader';
import { createOrder } from '@/lib/api';
import { colors, spacing, typography } from '@/lib/theme';
import { useCartStore } from '@/stores/cart';
import { useLocationStore } from '@/stores/location';

type PaymentMethod = 'neft' | 'cod';

export default function CheckoutScreen() {
  const items = useCartStore((s) => s.items);
  const deliveryAddress = useLocationStore((s) => s.deliveryAddress);
  const subtotal = useCartStore((s) => s.subtotal());
  const taxes = useCartStore((s) => s.taxes());
  const total = useCartStore((s) => s.total());
  const clear = useCartStore((s) => s.clear);
  const [payment, setPayment] = useState<PaymentMethod>('neft');
  const queryClient = useQueryClient();

  const placeOrder = useMutation({
    mutationFn: () =>
      createOrder({
        orderStatus: 'pending',
        paymentMethod: payment,
        deliveryAddress,
        subtotal,
        taxes,
        total,
        items: items.map((i) => ({
          productName: i.name,
          productDocumentId: i.productDocumentId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineTotal: i.unitPrice * i.quantity,
        })),
      }),
    onSuccess: (res) => {
      clear();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      router.replace({
        pathname: '/order-success',
        params: { orderNumber: res.data.orderNumber },
      });
    },
  });

  return (
    <View style={styles.container}>
      <AppHeader showBack showCart={false} showLocation={false} />
      <SectionHeader title="Secure Checkout" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionLabel}>SELECT PAYMENT METHOD</Text>

        <Pressable
          style={[styles.payOption, payment === 'neft' && styles.payOptionActive]}
          onPress={() => setPayment('neft')}>
          <View style={styles.radio}>{payment === 'neft' ? <View style={styles.radioDot} /> : null}</View>
          <View style={styles.payText}>
            <Text style={styles.payTitle}>Bank Transfer (NEFT/RTGS)</Text>
            <Text style={styles.paySub}>Faster verification for bulk orders</Text>
          </View>
          <MaterialIcons name="account-balance" size={28} color={colors.icon} />
        </Pressable>

        <Pressable
          style={[styles.payOption, payment === 'cod' && styles.payOptionActive]}
          onPress={() => setPayment('cod')}>
          <View style={styles.radio}>{payment === 'cod' ? <View style={styles.radioDot} /> : null}</View>
          <View style={styles.payText}>
            <Text style={styles.payTitle}>Cash on Delivery (COD)</Text>
            <Text style={styles.paySub}>Available for orders below ₹50k</Text>
          </View>
          <MaterialIcons name="payments" size={28} color={colors.iconMuted} />
        </Pressable>

        <View style={styles.info}>
          <MaterialIcons name="info" size={22} color={colors.secondaryContainer} />
          <Text style={styles.infoText}>
            Price inclusive of 18% GST. Tax invoice will be shared post-delivery.
          </Text>
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>
            ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        <PrimaryButton
          label="Place Order"
          onPress={() => placeOrder.mutate()}
          loading={placeOrder.isPending}
        />
        {placeOrder.isError ? (
          <Text style={styles.error}>
            {placeOrder.error instanceof Error ? placeOrder.error.message : 'Order failed'}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.containerMargin, paddingBottom: spacing.unit12, gap: spacing.unit3 },
  sectionLabel: { ...typography.labelLg, color: colors.primary, marginBottom: spacing.unit2, textTransform: 'uppercase' },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit4,
    padding: spacing.unit4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  payOptionActive: { borderWidth: 2, borderColor: colors.secondary },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.secondary },
  payText: { flex: 1 },
  payTitle: { ...typography.labelLg, color: colors.primary },
  paySub: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  info: {
    flexDirection: 'row',
    gap: spacing.unit3,
    backgroundColor: colors.primaryContainer,
    padding: spacing.unit4,
    borderRadius: 8,
    marginTop: spacing.unit4,
  },
  infoText: { ...typography.bodyMd, color: colors.onPrimary, flex: 1 },
  totalBox: { marginVertical: spacing.unit6 },
  totalLabel: { ...typography.labelMd, color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  totalValue: { ...typography.priceDisplay, fontSize: 24, color: colors.primary },
  error: { color: colors.error, ...typography.bodyMd, textAlign: 'center', marginTop: spacing.unit2 },
});
