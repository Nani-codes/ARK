import { MaterialIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AddressCard } from '@/components/AddressCard';
import { AppHeader } from '@/components/AppHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionHeader } from '@/components/SectionHeader';
import { createOrder } from '@/lib/api';
import { formatFullAddress } from '@/lib/addressFormat';
import { NEFT_BANK_DETAILS } from '@/lib/orderDisplay';
import { processOnlinePayment } from '@/lib/razorpay';
import { COD_MAX_TOTAL, deliveryFeeLabel, GST_LABEL } from '@/lib/pricing';
import { isPincodeServiceable, loadServiceablePincodes } from '@/lib/serviceability';
import { colors, spacing, typography } from '@/lib/theme';
import type { DeliverySlot } from '@/lib/types';
import { useAddressStore } from '@/stores/addresses';
import { useCartStore } from '@/stores/cart';
import { useGstStore } from '@/stores/gst';
import { usePaymentsStore } from '@/stores/payments';

type PaymentMethod = 'neft' | 'cod' | 'online';

const SLOT_OPTIONS: { key: DeliverySlot; label: string; sub: string }[] = [
  { key: 'asap', label: 'ASAP', sub: '60–90 min target' },
  { key: 'two_hour', label: '2-Hour Slot', sub: 'Scheduled window' },
  { key: 'next_day', label: 'Next Day', sub: 'Morning delivery' },
];

export default function CheckoutScreen() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const taxes = useCartStore((s) => s.taxes());
  const deliveryFee = useCartStore((s) => s.deliveryFee());
  const total = useCartStore((s) => s.total());
  const clear = useCartStore((s) => s.clear);

  const selectedAddress = useAddressStore((s) => {
    if (s.selectedId) return s.addresses.find((a) => a.id === s.selectedId) ?? null;
    return s.addresses.find((a) => a.isDefault) ?? s.addresses[0] ?? null;
  });

  const gstin = useGstStore((s) => s.gstin);
  const businessName = useGstStore((s) => s.businessName);
  const neftReference = usePaymentsStore((s) => s.neftReference);
  const setNeftReference = usePaymentsStore((s) => s.setNeftReference);

  const [payment, setPayment] = useState<PaymentMethod>('online');
  const [deliverySlot, setDeliverySlot] = useState<DeliverySlot>('asap');
  const queryClient = useQueryClient();

  useEffect(() => {
    void loadServiceablePincodes();
  }, []);

  const codDisabled = total > COD_MAX_TOTAL;

  const placeOrder = useMutation({
    mutationFn: async () => {
      let razorpayOrderId: string | undefined;
      let razorpayPaymentId: string | undefined;

      if (payment === 'online') {
        const result = await processOnlinePayment(total);
        razorpayOrderId = result.razorpayOrderId;
        razorpayPaymentId = result.razorpayPaymentId;
      }

      return createOrder({
        orderStatus: 'pending',
        paymentMethod: payment,
        deliveryAddress: selectedAddress ? formatFullAddress(selectedAddress) : '',
        deliverySlot,
        deliveryFee,
        pincode: selectedAddress?.pincode,
        gstin: gstin || undefined,
        businessName: businessName || undefined,
        neftProofUrl: payment === 'neft' && neftReference ? neftReference : undefined,
        razorpayOrderId,
        razorpayPaymentId,
        subtotal,
        taxes,
        total,
        items: items.map((i) => ({
          productName: i.name,
          productDocumentId: i.productDocumentId,
          variantId: i.variantId,
          variantLabel: i.variantLabel,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineTotal: i.unitPrice * i.quantity,
        })),
      });
    },
    onSuccess: (res) => {
      clear();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      router.replace({ pathname: '/order-success', params: { orderNumber: res.data.orderNumber } });
    },
  });

  const handlePlaceOrder = async () => {
    if (!selectedAddress) return;

    const serviceable = await isPincodeServiceable(selectedAddress.pincode);
    if (!serviceable) {
      Alert.alert('Not serviceable', `We do not deliver to pincode ${selectedAddress.pincode} yet.`);
      return;
    }

    if (payment === 'cod' && codDisabled) {
      Alert.alert(
        'COD unavailable',
        `Cash on Delivery is only available for orders up to ₹${COD_MAX_TOTAL.toLocaleString('en-IN')}.`
      );
      return;
    }

    placeOrder.mutate();
  };

  if (items.length === 0) {
    router.replace('/cart');
    return null;
  }

  return (
    <View style={styles.container}>
      <AppHeader showBack showCart={false} showLocation={false} />
      <SectionHeader title="Secure Checkout" />
      <ScrollView contentContainerStyle={styles.scroll}>

        <Text style={styles.sectionLabel}>DELIVERY ADDRESS</Text>
        {selectedAddress ? (
          <View>
            <AddressCard address={selectedAddress} />
            <Pressable style={styles.changeBtn} onPress={() => router.push('/address/select')}>
              <MaterialIcons name="edit-location-alt" size={16} color={colors.secondary} />
              <Text style={styles.changeBtnText}>Change Address</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.emptyAddress} onPress={() => router.push('/address/select')}>
            <MaterialIcons name="add-location-alt" size={28} color={colors.secondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.emptyAddressTitle}>Select Delivery Address</Text>
              <Text style={styles.emptyAddressSub}>Tap to add or choose a saved address</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.secondary} />
          </Pressable>
        )}

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>DELIVERY SLOT</Text>
        {SLOT_OPTIONS.map((slot) => (
          <Pressable
            key={slot.key}
            style={[styles.payOption, deliverySlot === slot.key && styles.payOptionActive]}
            onPress={() => setDeliverySlot(slot.key)}>
            <View style={styles.radio}>
              {deliverySlot === slot.key ? <View style={styles.radioDot} /> : null}
            </View>
            <View style={styles.payText}>
              <Text style={styles.payTitle}>{slot.label}</Text>
              <Text style={styles.paySub}>{slot.sub}</Text>
            </View>
          </Pressable>
        ))}

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>SELECT PAYMENT METHOD</Text>

        <Pressable
          style={[styles.payOption, payment === 'online' && styles.payOptionActive]}
          onPress={() => setPayment('online')}>
          <View style={styles.radio}>{payment === 'online' ? <View style={styles.radioDot} /> : null}</View>
          <View style={styles.payText}>
            <Text style={styles.payTitle}>Pay Online (UPI / Cards)</Text>
            <Text style={styles.paySub}>Secure Razorpay checkout</Text>
          </View>
          <MaterialIcons name="credit-card" size={28} color={colors.icon} />
        </Pressable>

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

        {payment === 'neft' ? (
          <View style={styles.neftBox}>
            <Text style={styles.neftTitle}>Transfer to:</Text>
            <Text style={styles.neftLine}>{NEFT_BANK_DETAILS.accountName}</Text>
            <Text style={styles.neftLine}>
              A/C {NEFT_BANK_DETAILS.accountNumber} · {NEFT_BANK_DETAILS.ifsc}
            </Text>
            <Text style={styles.neftLabel}>UTR / Reference (optional)</Text>
            <TextInput
              style={styles.neftInput}
              value={neftReference}
              onChangeText={setNeftReference}
              placeholder="Enter UTR after transfer"
            />
          </View>
        ) : null}

        <Pressable
          style={[
            styles.payOption,
            payment === 'cod' && styles.payOptionActive,
            codDisabled && styles.payOptionDisabled,
          ]}
          onPress={() => !codDisabled && setPayment('cod')}
          disabled={codDisabled}>
          <View style={styles.radio}>{payment === 'cod' ? <View style={styles.radioDot} /> : null}</View>
          <View style={styles.payText}>
            <Text style={[styles.payTitle, codDisabled && styles.payTitleDisabled]}>
              Cash on Delivery (COD)
            </Text>
            <Text style={styles.paySub}>
              {codDisabled
                ? `Not available above ₹${COD_MAX_TOTAL.toLocaleString('en-IN')}`
                : 'Pay after verifying materials'}
            </Text>
          </View>
          <MaterialIcons name="payments" size={28} color={codDisabled ? colors.iconMuted : colors.icon} />
        </Pressable>

        {gstin ? (
          <View style={styles.gstBox}>
            <MaterialIcons name="receipt" size={20} color={colors.primary} />
            <Text style={styles.gstText}>
              GST invoice: {businessName || 'Your business'} · {gstin}
            </Text>
          </View>
        ) : null}

        <View style={styles.info}>
          <MaterialIcons name="info" size={22} color={colors.secondaryContainer} />
          <Text style={styles.infoText}>
            Price inclusive of {GST_LABEL}. {deliveryFeeLabel(subtotal)}. Cancel within 10 minutes.
          </Text>
        </View>

        <View style={styles.totalBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLineLabel}>Subtotal</Text>
            <Text>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLineLabel}>Delivery</Text>
            <Text style={deliveryFee === 0 ? styles.free : undefined}>
              {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLineLabel}>{GST_LABEL}</Text>
            <Text>₹{taxes.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          </View>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>
            ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        <PrimaryButton
          label="Place Order"
          onPress={handlePlaceOrder}
          loading={placeOrder.isPending}
          disabled={!selectedAddress}
        />
        {!selectedAddress ? (
          <Text style={styles.addressHint}>Please select a delivery address to continue</Text>
        ) : null}
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
  sectionLabel: { ...typography.labelLg, color: colors.primary, textTransform: 'uppercase', marginBottom: spacing.unit2 },
  sectionLabelSpaced: { marginTop: spacing.unit4 },
  emptyAddress: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.unit3,
    backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1.5,
    borderColor: colors.secondary, borderStyle: 'dashed', padding: spacing.unit4,
  },
  emptyAddressTitle: { ...typography.labelLg, color: colors.secondary },
  emptyAddressSub: { ...typography.bodyMd, color: colors.onSurfaceVariant, fontSize: 12, marginTop: 2 },
  changeBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.unit1, alignSelf: 'flex-end', marginTop: spacing.unit2 },
  changeBtnText: { ...typography.labelLg, color: colors.secondary },
  payOption: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.unit4,
    padding: spacing.unit4, borderRadius: 12, borderWidth: 1,
    borderColor: colors.outlineVariant, backgroundColor: colors.surface,
  },
  payOptionActive: { borderWidth: 2, borderColor: colors.secondary },
  payOptionDisabled: { opacity: 0.5 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.secondary },
  payText: { flex: 1 },
  payTitle: { ...typography.labelLg, color: colors.primary },
  payTitleDisabled: { color: colors.onSurfaceVariant },
  paySub: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  neftBox: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    padding: spacing.unit4,
    gap: spacing.unit1,
    marginTop: -spacing.unit1,
  },
  neftTitle: { ...typography.labelMd, color: colors.onSurfaceVariant },
  neftLine: { ...typography.bodyMd, color: colors.primary, fontWeight: '600' },
  neftLabel: { ...typography.labelMd, color: colors.onSurfaceVariant, marginTop: spacing.unit2 },
  neftInput: {
    borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: 8,
    padding: spacing.unit3, backgroundColor: colors.surface, ...typography.bodyMd, color: colors.onSurface,
  },
  gstBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.unit2,
    backgroundColor: colors.surfaceContainerLow, padding: spacing.unit3, borderRadius: 8,
  },
  gstText: { ...typography.labelMd, color: colors.primary, flex: 1 },
  info: { flexDirection: 'row', gap: spacing.unit3, backgroundColor: colors.primaryContainer, padding: spacing.unit4, borderRadius: 8, marginTop: spacing.unit4 },
  infoText: { ...typography.bodyMd, color: colors.onPrimary, flex: 1 },
  totalBox: { marginVertical: spacing.unit6, gap: spacing.unit1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLineLabel: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  free: { color: colors.success, fontWeight: '700' },
  totalLabel: { ...typography.labelMd, color: colors.onSurfaceVariant, textTransform: 'uppercase', marginTop: spacing.unit2 },
  totalValue: { ...typography.priceDisplay, fontSize: 24, color: colors.primary },
  addressHint: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.unit1 },
  error: { color: colors.error, ...typography.bodyMd, textAlign: 'center', marginTop: spacing.unit2 },
});
