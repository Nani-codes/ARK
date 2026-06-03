import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
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
import { createQuoteRequest } from '@/lib/api';
import { colors, spacing, typography } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth';

const PRODUCT_OPTIONS = [
  'Ready Mix Concrete (M25)',
  'TMT Steel Bars (500D)',
  'Portland Cement (OPC 53)',
  'River Sand (Grade A)',
];

export default function QuoteScreen() {
  const user = useAuthStore((s) => s.user);
  const [productName, setProductName] = useState(PRODUCT_OPTIONS[0]);
  const [quantityTons, setQuantityTons] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [instructions, setInstructions] = useState('');

  const submit = useMutation({
    mutationFn: () =>
      createQuoteRequest({
        productName,
        quantityTons: parseFloat(quantityTons),
        siteAddress,
        instructions,
        phone: user?.phone,
      }),
    onSuccess: () => {
      Alert.alert('Request Sent', 'Our team will contact you within 2 hours.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (e) => {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to submit');
    },
  });

  const handleSubmit = () => {
    if (!quantityTons || !siteAddress.trim()) {
      Alert.alert('Missing fields', 'Please enter quantity and site address.');
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
          {PRODUCT_OPTIONS.map((opt) => (
            <Pressable
              key={opt}
              style={[styles.pickerOpt, productName === opt && styles.pickerOptActive]}
              onPress={() => setProductName(opt)}>
              <Text style={styles.pickerOptText}>{opt}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Quantity (Metric Tons)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 250"
          keyboardType="decimal-pad"
          value={quantityTons}
          onChangeText={setQuantityTons}
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
  label: { ...typography.labelLg, color: colors.primary, marginBottom: spacing.unit1, marginTop: spacing.unit3 },
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
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  pickerOptActive: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondaryContainer,
  },
  pickerOptText: { ...typography.bodyMd, color: colors.onSurface },
});
