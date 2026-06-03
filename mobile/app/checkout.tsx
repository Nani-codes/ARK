import { MaterialIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AddressCard } from '@/components/AddressCard';
import { AppHeader } from '@/components/AppHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionHeader } from '@/components/SectionHeader';
import { createOrder } from '@/lib/api';
import { formatFullAddress } from '@/lib/addressFormat';
import { colors, spacing, typography } from '@/lib/theme';
import { useAddressStore } from '@/stores/addresses';
import { useCartStore } from '@/stores/cart';

type PaymentMethod = 'neft' | 'cod';

export default function CheckoutScreen() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const taxes = useCartStore((s) => s.taxes());
  const total = useCartStore((s) => s.total());
  const clear = useCartStore((s) => s.clear);

  // Reactive selector — re-renders whenever selectedId or addresses change
  const selectedAddress = useAddressStore((s) => {
    if (s.selectedId) return s.addresses.find((a) => a.id === s.selectedId) ?? null;
    return s.addresses.find((a) => a.isDefault) ?? s.addresses[0] ?? null;
  });

  const [payment, setPayment] = useState<PaymentMethod>('neft');
  const queryClient = useQueryClient();

  const placeOrder = useMutation({
    mutationFn: () =>
      createOrder({
        orderStatus: 'pending',
        paymentMethod: payment,
        deliveryAddress: selectedAddress ? formatFullAddress(selectedAddress) : '',
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
      router.replace({ pathname: '/order-success', params: { orderNumber: res.data.orderNumber } });
    },
  });

  return (
    <View style={styles.container}>
      <AppHeader showBack showCart={false} showLocation={false} />
      <SectionHeader title="Secure Checkout" />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Delivery Address ─────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>DELIVERY ADDRESS</Text>

        {selectedAddress ? (
          <View>
            <AddressCard address={selectedAddress} />
            <Pressable
              style={styles.changeBtn}
              onPress={() => router.push('/address/select')}>
              <MaterialIcons name="edit-location-alt" size={16} color={colors.secondary} />
              <Text style={styles.changeBtnText}>Change Address</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.emptyAddress}
            onPress={() => router.push('/address/select')}>
            <MaterialIcons name="add-location-alt" size={28} color={colors.secondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.emptyAddressTitle}>Select Delivery Address</Text>
              <Text style={styles.emptyAddressSub}>Tap to add or choose a saved address</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.secondary} />
          </Pressable>
        )}

        {/* ── Payment Method ────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>SELECT PAYMENT METHOD</Text>

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
          disabled={!selectedAddress}
        />
        {!selectedAddress && (
          <Text style={styles.addressHint}>Please select a delivery address to continue</Text>
        )}
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

  sectionLabel: {
    ...typography.labelLg,
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: spacing.unit2,
  },
  sectionLabelSpaced: { marginTop: spacing.unit4 },

  // Address
  emptyAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit3,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    borderStyle: 'dashed',
    padding: spacing.unit4,
  },
  emptyAddressTitle: { ...typography.labelLg, color: colors.secondary },
  emptyAddressSub: { ...typography.bodyMd, color: colors.onSurfaceVariant, fontSize: 12, marginTop: 2 },

  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit1,
    alignSelf: 'flex-end',
    marginTop: spacing.unit2,
    paddingHorizontal: spacing.unit3,
    paddingVertical: spacing.unit1,
  },
  changeBtnText: { ...typography.labelLg, color: colors.secondary },

  // Payment
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
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
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
  addressHint: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.unit1 },
  error: { color: colors.error, ...typography.bodyMd, textAlign: 'center', marginTop: spacing.unit2 },
});
