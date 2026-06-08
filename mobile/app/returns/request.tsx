import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { createReturnRequest } from '@/lib/api';
import { colors, spacing, typography } from '@/lib/theme';

export default function ReturnRequestScreen() {
  const { orderNumber, productName } = useLocalSearchParams<{
    orderNumber?: string;
    productName?: string;
  }>();

  const [reason, setReason] = useState('');
  const [product, setProduct] = useState(productName ?? '');

  const submit = useMutation({
    mutationFn: () =>
      createReturnRequest({
        orderNumber: orderNumber ?? '',
        productName: product.trim(),
        reason: reason.trim(),
      }),
    onSuccess: () => {
      Alert.alert('Submitted', 'Our team will contact you within 24 hours.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
  });

  const handleSubmit = () => {
    if (!orderNumber || !product.trim() || reason.trim().length < 10) {
      Alert.alert('Missing details', 'Please describe the issue (min 10 characters).');
      return;
    }
    submit.mutate();
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Return Request" showBack showCart={false} showLocation={false} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sub}>
          Returns accepted within 24 hours of delivery for quality issues. Replacement or exchange per policy.
        </Text>
        <Text style={styles.label}>Order Number</Text>
        <Text style={styles.readonly}>{orderNumber ?? '—'}</Text>
        <Text style={styles.label}>Product</Text>
        <TextInput style={styles.input} value={product} onChangeText={setProduct} />
        <Text style={styles.label}>Reason for return</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={reason}
          onChangeText={setReason}
          placeholder="Describe the defect or issue..."
          multiline
          numberOfLines={4}
        />
        <PrimaryButton
          label="Submit Return Request"
          onPress={handleSubmit}
          loading={submit.isPending}
          style={{ marginTop: spacing.unit6 }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.containerMargin, paddingBottom: spacing.unit12 },
  sub: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.unit6 },
  label: { ...typography.labelLg, color: colors.primary, marginBottom: spacing.unit1, marginTop: spacing.unit3 },
  readonly: {
    ...typography.bodyMd,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.unit3,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: spacing.unit3,
    backgroundColor: colors.surfaceContainerLowest,
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
});
