import { MaterialIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AddressCard } from '@/components/AddressCard';
import { AppHeader } from '@/components/AppHeader';
import { DeliverySelectorModal } from '@/components/DeliverySelectorModal';
import { GuestAuthPrompt } from '@/components/GuestAuthPrompt';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionHeader } from '@/components/SectionHeader';
import { TemperatureBadge } from '@/components/TemperatureBadge';
import { createOrder } from '@/lib/api';
import { isSignedIn, promptAuth } from '@/lib/authGate';
import { formatFullAddress } from '@/lib/addressFormat';
import { NEFT_BANK_DETAILS } from '@/lib/orderDisplay';
import {
  calcDeliveryFee,
  calcSubtotal,
  calcTaxes,
  calcTotal,
  COD_MAX_TOTAL,
  deliveryFeeLabel,
  GST_LABEL,
} from '@/lib/pricing';
import { estimateDeliveryAt, formatDeliveryEta } from '@/lib/deliveryEstimate';
import { processOnlinePayment } from '@/lib/razorpay';
import { isPincodeServiceable, loadServiceablePincodes } from '@/lib/serviceability';
import { colors, spacing, typography } from '@/lib/theme';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAddressStore } from '@/stores/addresses';
import { useAuthStore } from '@/stores/auth';
import type { CartLine } from '@/stores/cart';
import { useCartStore } from '@/stores/cart';
import { useGstStore } from '@/stores/gst';
import { usePaymentsStore } from '@/stores/payments';

type PaymentMethod = 'neft' | 'cod' | 'online';

export default function CheckoutScreen() {
  const { buyNow, buyNowItems: buyNowItemsRaw } = useLocalSearchParams<{
    buyNow?: string;
    buyNowItems?: string;
  }>();

  const buyNowItems = useMemo(() => {
    if (buyNow === 'true' && buyNowItemsRaw) {
      try {
        return JSON.parse(decodeURIComponent(buyNowItemsRaw)) as CartLine[];
      } catch {
        return [];
      }
    }
    return null;
  }, [buyNow, buyNowItemsRaw]);

  const checkoutReturnTo = useMemo(
    () =>
      buyNow === 'true' && buyNowItemsRaw
        ? `/checkout?buyNow=true&buyNowItems=${encodeURIComponent(buyNowItemsRaw)}`
        : '/checkout',
    [buyNow, buyNowItemsRaw]
  );

  const { isHydrated, isSignedIn: signedIn, token } = useRequireAuth();

  const cartItems = useCartStore((s) => s.items);
  const cartSubtotal = useCartStore((s) => s.subtotal());
  const cartTaxes = useCartStore((s) => s.taxes());
  const cartDeliveryFee = useCartStore((s) => s.deliveryFee());
  const cartTotal = useCartStore((s) => s.total());
  const clear = useCartStore((s) => s.clear);

  const items = buyNowItems ?? cartItems;
  const subtotal = buyNowItems ? calcSubtotal(buyNowItems) : cartSubtotal;
  const taxes = buyNowItems ? calcTaxes(subtotal) : cartTaxes;
  const deliveryFee = buyNowItems ? calcDeliveryFee(subtotal) : cartDeliveryFee;
  const total = buyNowItems ? calcTotal(subtotal, taxes, deliveryFee) : cartTotal;

  const selectedAddress = useAddressStore((s) => {
    if (s.selectedId) return s.addresses.find((a) => a.id === s.selectedId) ?? null;
    return s.addresses.find((a) => a.isDefault) ?? s.addresses[0] ?? null;
  });

  const gstin = useGstStore((s) => s.gstin);
  const businessName = useGstStore((s) => s.businessName);
  const user = useAuthStore((s) => s.user);
  const neftReference = usePaymentsStore((s) => s.neftReference);
  const setNeftReference = usePaymentsStore((s) => s.setNeftReference);

  const [payment, setPayment] = useState<PaymentMethod>('online');
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [isServiceable, setIsServiceable] = useState<boolean | null>(null);
  const [useAlternateNotify, setUseAlternateNotify] = useState(false);
  const [notifyPhone, setNotifyPhone] = useState('');
  const [installationRequired, setInstallationRequired] = useState(false);
  const queryClient = useQueryClient();

  const etaPreview = useMemo(() => formatDeliveryEta(estimateDeliveryAt()), []);
  const hasTemperatureItems = items.some((item) => item.temperatureSensitive);

  const slotsDisabled = isServiceable === false;

  useEffect(() => {
    void loadServiceablePincodes();
  }, []);

  useEffect(() => {
    let active = true;
    const checkServiceability = async () => {
      if (!selectedAddress) {
        setIsServiceable(null);
        return;
      }
      const ok = await isPincodeServiceable(selectedAddress.pincode);
      if (active) {
        setIsServiceable(ok);
      }
    };
    void checkServiceability();
    return () => {
      active = false;
    };
  }, [selectedAddress]);

  useEffect(() => {
    if (buyNow === 'true') {
      if (!buyNowItems || buyNowItems.length === 0) {
        router.replace('/cart');
      }
    } else if (cartItems.length === 0) {
      router.replace('/cart');
    }
  }, [cartItems.length, buyNow, buyNowItems]);

  const codDisabled = total > COD_MAX_TOTAL;

  const placeOrder = useMutation({
    mutationFn: async () => {
      let razorpayOrderId: string | undefined;
      let razorpayPaymentId: string | undefined;

      if (payment === 'online') {
        const result = await processOnlinePayment(total, {
          contact: user?.phone,
          email: user?.email,
        });
        razorpayOrderId = result.razorpayOrderId;
        razorpayPaymentId = result.razorpayPaymentId;
      }

      return createOrder({
        orderStatus: 'pending',
        paymentMethod: payment,
        deliveryAddress: selectedAddress ? formatFullAddress(selectedAddress) : '',
        deliveryFee,
        pincode: selectedAddress?.pincode,
        gstin: gstin || undefined,
        businessName: businessName || undefined,
        notifyPhone:
          useAlternateNotify && notifyPhone.length === 10 ? notifyPhone : undefined,
        installationRequired,
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
      if (buyNow !== 'true') {
        clear();
      }
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      router.replace({
        pathname: '/order-success',
        params: {
          orderNumber: res.data.orderNumber,
          estimatedDeliveryAt:
            res.data.estimatedDeliveryAt ?? estimateDeliveryAt().toISOString(),
        },
      });
    },
  });

  const handlePlaceOrder = async () => {
    if (!isSignedIn()) {
      promptAuth({
        returnTo: checkoutReturnTo,
        message: 'Sign in to place your order',
      });
      return;
    }

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

    if (useAlternateNotify && notifyPhone.length !== 10) {
      Alert.alert('Invalid number', 'Enter a valid 10-digit WhatsApp number for order updates.');
      return;
    }

    placeOrder.mutate();
  };

  const isEmpty =
    buyNow === 'true' ? !buyNowItems || buyNowItems.length === 0 : cartItems.length === 0;
  if (isEmpty) {
    return null;
  }

  if (!isHydrated) {
    return (
      <View style={styles.container}>
        <AppHeader showBack showCart={false} showLocation={false} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.unit12 }} />
      </View>
    );
  }

  if (!token) {
    return (
      <View style={styles.container}>
        <AppHeader showBack showCart={false} showLocation={false} />
        <GuestAuthPrompt
          icon="shopping-cart"
          title="Sign in to checkout"
          subtitle="Your cart is saved. Sign in to choose delivery, payment, and place your order."
          returnTo={checkoutReturnTo}
          message="Sign in to complete checkout"
        />
      </View>
    );
  }

  const placeOrderLabel =
    slotsDisabled
      ? 'Area Not Serviceable'
      : payment === 'online'
        ? 'Pay & Place Order'
        : 'Place Order';

  return (
    <View style={styles.container}>
      <AppHeader showBack showCart={false} showLocation={false} />
      <SectionHeader title="Secure Checkout" />
      <ScrollView contentContainerStyle={styles.scroll}>

        <Text style={styles.sectionLabel}>DELIVERY ADDRESS</Text>
        {selectedAddress ? (
          <View>
            <AddressCard address={selectedAddress} />
            {slotsDisabled ? (
              <View style={styles.unserviceableWarning}>
                <MaterialIcons name="error" size={20} color={colors.onError} />
                <Text style={styles.unserviceableText}>
                  We do not deliver to pincode {selectedAddress.pincode} yet. Please choose another address.
                </Text>
              </View>
            ) : null}
            <Pressable style={styles.changeBtn} onPress={() => setSelectorVisible(true)}>
              <MaterialIcons name="edit-location-alt" size={16} color={colors.secondary} />
              <Text style={styles.changeBtnText}>Change Address</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.emptyAddress} onPress={() => setSelectorVisible(true)}>
            <MaterialIcons name="add-location-alt" size={28} color={colors.secondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.emptyAddressTitle}>Select Delivery Address</Text>
              <Text style={styles.emptyAddressSub}>Tap to add or choose a saved address</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.secondary} />
          </Pressable>
        )}

        {hasTemperatureItems ? (
          <View style={{ marginBottom: spacing.unit4 }}>
            <TemperatureBadge
              note={
                items.find((i) => i.temperatureNote)?.temperatureNote ??
                'Your cart includes temperature-sensitive materials. We schedule these for priority morning slots when possible.'
              }
            />
          </View>
        ) : null}

        {!slotsDisabled ? (
          <View style={styles.etaBanner}>
            <MaterialIcons name="schedule" size={18} color={colors.primary} />
            <Text style={styles.etaBannerText}>Estimated arrival: {etaPreview}</Text>
          </View>
        ) : null}

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>INSTALLATION</Text>
        <Text style={styles.installHint}>Do you need on-site installation for this order?</Text>
        <View style={styles.installRow}>
          <Pressable
            style={[
              styles.installOption,
              !installationRequired && styles.installOptionActive,
              slotsDisabled && styles.payOptionDisabled,
            ]}
            onPress={() => !slotsDisabled && setInstallationRequired(false)}
            disabled={slotsDisabled}>
            <View style={styles.radio}>
              {!installationRequired && !slotsDisabled ? <View style={styles.radioDot} /> : null}
            </View>
            <Text style={[styles.installOptionText, slotsDisabled && styles.payTitleDisabled]}>
              No, delivery only
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.installOption,
              installationRequired && styles.installOptionActive,
              slotsDisabled && styles.payOptionDisabled,
            ]}
            onPress={() => !slotsDisabled && setInstallationRequired(true)}
            disabled={slotsDisabled}>
            <View style={styles.radio}>
              {installationRequired && !slotsDisabled ? <View style={styles.radioDot} /> : null}
            </View>
            <Text style={[styles.installOptionText, slotsDisabled && styles.payTitleDisabled]}>
              Yes, installation required
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>ORDER UPDATES (WHATSAPP)</Text>
        <View style={styles.notifyCard}>
          <Text style={styles.notifyDefault}>
            {user?.phone
              ? `Default: +91 ${user.phone} (your account)`
              : 'Default: your account WhatsApp number'}
          </Text>
          <Pressable
            style={styles.notifyToggle}
            onPress={() => {
              setUseAlternateNotify((v) => !v);
              if (useAlternateNotify) setNotifyPhone('');
            }}>
            <View style={[styles.checkbox, useAlternateNotify && styles.checkboxChecked]}>
              {useAlternateNotify ? (
                <MaterialIcons name="check" size={16} color={colors.onSecondary} />
              ) : null}
            </View>
            <Text style={styles.notifyToggleText}>Send updates to someone else</Text>
          </Pressable>
          {useAlternateNotify ? (
            <View style={styles.notifyPhoneRow}>
              <View style={styles.notifyPrefix}>
                <Text style={styles.notifyPrefixText}>+91</Text>
              </View>
              <TextInput
                style={styles.notifyInput}
                placeholder="Site supervisor / recipient mobile"
                keyboardType="number-pad"
                maxLength={10}
                value={notifyPhone}
                onChangeText={(t) => setNotifyPhone(t.replace(/\D/g, ''))}
              />
            </View>
          ) : null}
          <Text style={styles.notifyHint}>
            Order placed, delivery, and status WhatsApp messages go to this number when set.
          </Text>
        </View>

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>SELECT PAYMENT METHOD</Text>

        <Pressable
          style={[
            styles.payOption,
            payment === 'online' && !slotsDisabled ? styles.payOptionActive : null,
            slotsDisabled ? styles.payOptionDisabled : null,
          ]}
          onPress={() => !slotsDisabled && setPayment('online')}
          disabled={slotsDisabled}>
          <View style={styles.radio}>
            {payment === 'online' && !slotsDisabled ? <View style={styles.radioDot} /> : null}
          </View>
          <View style={styles.payText}>
            <Text style={[styles.payTitle, slotsDisabled && styles.payTitleDisabled]}>
              Pay Online (UPI / Cards)
            </Text>
            <Text style={styles.paySub}>
              {slotsDisabled ? 'Payment options unavailable' : 'Secure Razorpay checkout'}
            </Text>
          </View>
          <MaterialIcons
            name="credit-card"
            size={28}
            color={slotsDisabled ? colors.iconMuted : colors.icon}
          />
        </Pressable>

        <Pressable
          style={[
            styles.payOption,
            payment === 'neft' && !slotsDisabled ? styles.payOptionActive : null,
            slotsDisabled ? styles.payOptionDisabled : null,
          ]}
          onPress={() => !slotsDisabled && setPayment('neft')}
          disabled={slotsDisabled}>
          <View style={styles.radio}>
            {payment === 'neft' && !slotsDisabled ? <View style={styles.radioDot} /> : null}
          </View>
          <View style={styles.payText}>
            <Text style={[styles.payTitle, slotsDisabled && styles.payTitleDisabled]}>
              Bank Transfer (NEFT/RTGS)
            </Text>
            <Text style={styles.paySub}>
              {slotsDisabled ? 'Payment options unavailable' : 'Faster verification for bulk orders'}
            </Text>
          </View>
          <MaterialIcons
            name="account-balance"
            size={28}
            color={slotsDisabled ? colors.iconMuted : colors.icon}
          />
        </Pressable>

        {payment === 'neft' && !slotsDisabled ? (
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
            payment === 'cod' && !slotsDisabled ? styles.payOptionActive : null,
            (codDisabled || slotsDisabled) ? styles.payOptionDisabled : null,
          ]}
          onPress={() => !codDisabled && !slotsDisabled && setPayment('cod')}
          disabled={codDisabled || slotsDisabled}>
          <View style={styles.radio}>
            {payment === 'cod' && !slotsDisabled ? <View style={styles.radioDot} /> : null}
          </View>
          <View style={styles.payText}>
            <Text style={[styles.payTitle, (codDisabled || slotsDisabled) && styles.payTitleDisabled]}>
              Cash on Delivery (COD)
            </Text>
            <Text style={styles.paySub}>
              {slotsDisabled
                ? 'Payment options unavailable'
                : codDisabled
                  ? `Not available above ₹${COD_MAX_TOTAL.toLocaleString('en-IN')}`
                  : 'Pay after verifying materials'}
            </Text>
          </View>
          <MaterialIcons
            name="payments"
            size={28}
            color={codDisabled || slotsDisabled ? colors.iconMuted : colors.icon}
          />
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
            <Text
              style={
                slotsDisabled
                  ? styles.unserviceablePrice
                  : deliveryFee === 0
                    ? styles.free
                    : undefined
              }>
              {slotsDisabled ? 'Unavailable' : deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLineLabel}>{GST_LABEL}</Text>
            <Text>₹{taxes.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          </View>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>
            {slotsDisabled
              ? 'Unavailable'
              : `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          </Text>
        </View>

        <PrimaryButton
          label={placeOrderLabel}
          onPress={handlePlaceOrder}
          loading={placeOrder.isPending}
          disabled={!signedIn || !selectedAddress || slotsDisabled}
        />
        {!selectedAddress ? (
          <Text style={styles.addressHint}>Please select a delivery address to continue</Text>
        ) : slotsDisabled ? (
          <Text style={styles.addressHint}>Cannot place order to an unserviceable pincode</Text>
        ) : null}
        {placeOrder.isError ? (
          <Text style={styles.error}>
            {placeOrder.error instanceof Error ? placeOrder.error.message : 'Order failed'}
          </Text>
        ) : null}
      </ScrollView>

      <DeliverySelectorModal
        visible={selectorVisible}
        onClose={() => setSelectorVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.containerMargin, paddingBottom: spacing.unit12, gap: spacing.unit3 },
  sectionLabel: { ...typography.labelLg, color: colors.primary, textTransform: 'uppercase', marginBottom: spacing.unit2 },
  sectionLabelSpaced: { marginTop: spacing.unit4 },
  etaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    padding: spacing.unit3,
    marginBottom: spacing.unit2,
  },
  etaBannerText: { ...typography.bodyMd, color: colors.onSurface, flex: 1 },
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
  unserviceableWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
    backgroundColor: colors.error,
    padding: spacing.unit3,
    borderRadius: 8,
    marginTop: spacing.unit2,
  },
  unserviceableText: {
    ...typography.bodyMd,
    color: colors.onError,
    flex: 1,
    fontWeight: '600',
  },
  unserviceablePrice: {
    color: colors.error,
    fontWeight: '700',
  },
  notifyCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.unit4,
    gap: spacing.unit3,
  },
  notifyDefault: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  notifyToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.unit3 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.secondary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.secondary,
  },
  notifyToggleText: { ...typography.labelLg, color: colors.primary, flex: 1 },
  notifyPhoneRow: { flexDirection: 'row', gap: spacing.unit2 },
  notifyPrefix: {
    height: 48,
    width: 64,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLow,
  },
  notifyPrefixText: { ...typography.bodyMd, color: colors.onSurface },
  notifyInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: spacing.unit3,
    backgroundColor: colors.surfaceContainerLow,
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  notifyHint: { ...typography.bodyMd, color: colors.onSurfaceVariant, fontSize: 12 },
  installHint: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.unit3,
  },
  installRow: { gap: spacing.unit2 },
  installOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit3,
    padding: spacing.unit4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  installOptionActive: { borderWidth: 2, borderColor: colors.secondary },
  installOptionText: { ...typography.labelLg, color: colors.primary, flex: 1 },
});
