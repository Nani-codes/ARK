import { useMutation, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { createQuoteRequest, fetchProducts } from '@/lib/api';
import { formatFullAddress } from '@/lib/addressFormat';
import { isSignedIn, promptAuth } from '@/lib/authGate';
import { colors, spacing, typography } from '@/lib/theme';
import type { Product } from '@/lib/types';
import { useAddressStore } from '@/stores/addresses';
import { useAuthStore } from '@/stores/auth';

export default function QuoteScreen() {
  const { product: productParam } = useLocalSearchParams<{ product?: string }>();
  const user = useAuthStore((s) => s.user);
  const selectedAddress = useAddressStore((s) => s.getSelected());

  const { data: bulkProducts } = useQuery({
    queryKey: ['products', 'bulk'],
    queryFn: () => fetchProducts({ pageSize: 50 }),
    select: (res) => res.data.filter((p) => p.bulkPricingEnabled),
  });

  const products = bulkProducts ?? [];
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variantLabel, setVariantLabel] = useState('');
  const [quantity, setQuantity] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [gstin, setGstin] = useState('');
  const [preferredDeliveryDate, setPreferredDeliveryDate] = useState('');

  useEffect(() => {
    if (!products.length) return;
    const byName = productParam
      ? products.find((p) => p.name === decodeURIComponent(productParam))
      : null;
    setSelectedProduct(byName ?? products[0]);
  }, [products, productParam]);

  const quantityUnit = useMemo(() => {
    if (!selectedProduct) return 'Metric Ton';
    const unit = selectedProduct.unit.toLowerCase();
    if (unit.includes('bag') || unit.includes('piece') || unit.includes('sq')) {
      return selectedProduct.unit;
    }
    return 'Metric Ton';
  }, [selectedProduct]);

  useEffect(() => {
    if (!siteAddress && selectedAddress) {
      setSiteAddress(formatFullAddress(selectedAddress));
    }
  }, [selectedAddress, siteAddress]);

  const submit = useMutation({
    mutationFn: () => {
      if (!selectedProduct) throw new Error('Select a product');
      return createQuoteRequest({
        productDocumentId: selectedProduct.documentId,
        productName: selectedProduct.name,
        variantLabel: variantLabel.trim() || undefined,
        quantity: parseFloat(quantity),
        quantityUnit,
        siteAddress,
        instructions,
        gstin: gstin.trim() || undefined,
        preferredDeliveryDate: preferredDeliveryDate.trim() || undefined,
        phone: user?.phone,
      });
    },
    onSuccess: () => {
      Alert.alert('Request Sent', 'Our team will contact you within 2 hours.', [
        { text: 'View Requests', onPress: () => router.replace('/quotes' as never) },
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (e) => {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to submit');
    },
  });

  const handleSubmit = () => {
    if (!isSignedIn()) {
      promptAuth({
        returnTo: '/quote',
        message: 'Sign in to submit a bulk quote request',
      });
      return;
    }

    if (!selectedProduct) {
      Alert.alert('Select product', 'Choose a product for your bulk quote.');
      return;
    }
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0 || !siteAddress.trim()) {
      Alert.alert('Missing fields', 'Please enter quantity and site address.');
      return;
    }
    if (selectedProduct.bulkMinQuantity && qty < selectedProduct.bulkMinQuantity) {
      Alert.alert(
        'Minimum quantity',
        `Minimum bulk order for this product is ${selectedProduct.bulkMinQuantity} ${quantityUnit}.`
      );
      return;
    }
    submit.mutate();
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Bulk Quote Request" showBack showCart={false} showLocation={false} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Bulk Quote Request</Text>
        <Text style={styles.sub}>
          Ordering for a large-scale project? Submit a request and our procurement specialists will
          provide a custom competitive quote within 2 hours.
        </Text>

        <Text style={styles.label}>Product</Text>
        <View style={styles.picker}>
          {products.map((product) => (
            <Pressable
              key={product.documentId}
              style={[
                styles.pickerOpt,
                selectedProduct?.documentId === product.documentId && styles.pickerOptActive,
              ]}
              onPress={() => setSelectedProduct(product)}>
              <Text style={styles.pickerOptText}>{product.name}</Text>
              {product.bulkMinQuantity ? (
                <Text style={styles.pickerHint}>Min {product.bulkMinQuantity} {product.unit}</Text>
              ) : null}
            </Pressable>
          ))}
        </View>

        {selectedProduct?.variants && selectedProduct.variants.length > 1 ? (
          <>
            <Text style={styles.label}>Variant / Size (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 10 Bags, 50mm thickness"
              value={variantLabel}
              onChangeText={setVariantLabel}
            />
          </>
        ) : null}

        <Text style={styles.label}>Quantity ({quantityUnit})</Text>
        <TextInput
          style={styles.input}
          placeholder={quantityUnit.toLowerCase().includes('ton') ? 'e.g. 250' : 'e.g. 500'}
          keyboardType="decimal-pad"
          value={quantity}
          onChangeText={setQuantity}
        />

        <Text style={styles.label}>Site Address</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Full site delivery address including landmarks..."
          multiline
          numberOfLines={3}
          value={siteAddress}
          onChangeText={setSiteAddress}
        />

        <Text style={styles.label}>GSTIN (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="22AAAAA0000A1Z5"
          autoCapitalize="characters"
          value={gstin}
          onChangeText={setGstin}
        />

        <Text style={styles.label}>Preferred Delivery Date (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={preferredDeliveryDate}
          onChangeText={setPreferredDeliveryDate}
        />

        <Text style={styles.label}>Special Instructions</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Crane required for unloading, site access restricted after 6PM, etc."
          multiline
          numberOfLines={2}
          value={instructions}
          onChangeText={setInstructions}
        />

        <PrimaryButton
          label="Submit Quote Request"
          onPress={handleSubmit}
          loading={submit.isPending}
          style={{ marginTop: spacing.unit4 }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.containerMargin, paddingBottom: spacing.unit12 },
  heading: { ...typography.headlineLgMobile, color: colors.primary, marginBottom: spacing.unit2 },
  sub: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.unit8 },
  label: {
    ...typography.labelLg,
    color: colors.primary,
    marginBottom: spacing.unit1,
    marginTop: spacing.unit3,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.primaryContainer,
    borderRadius: 8,
    padding: spacing.unit3,
    backgroundColor: colors.surfaceContainerLowest,
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  picker: { gap: spacing.unit2 },
  pickerOpt: {
    padding: spacing.unit3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  pickerOptActive: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondaryContainer,
  },
  pickerOptText: { ...typography.bodyMd, color: colors.onSurface },
  pickerHint: { ...typography.labelMd, color: colors.onSurfaceVariant, marginTop: 4 },
});
