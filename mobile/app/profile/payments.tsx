import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { NEFT_BANK_DETAILS } from '@/lib/orderDisplay';
import { colors, spacing, typography } from '@/lib/theme';
import { usePaymentsStore } from '@/stores/payments';

export default function PaymentsScreen() {
  const upiId = usePaymentsStore((s) => s.upiId);
  const setUpiId = usePaymentsStore((s) => s.setUpiId);

  return (
    <View style={styles.container}>
      <AppHeader title="Payment Methods" showBack showCart={false} showLocation={false} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.section}>Saved UPI ID</Text>
        <TextInput
          style={styles.input}
          value={upiId}
          onChangeText={setUpiId}
          placeholder="yourname@upi"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Text style={styles.hint}>
          Your UPI ID is saved for reference. Online checkout is coming soon — use COD or NEFT at checkout for now.
        </Text>

        <Text style={[styles.section, { marginTop: spacing.unit8 }]}>NEFT / RTGS Bank Details</Text>
        <View style={styles.bankCard}>
          <BankRow label="Bank" value={NEFT_BANK_DETAILS.bankName} />
          <BankRow label="Account Name" value={NEFT_BANK_DETAILS.accountName} />
          <BankRow label="Account No." value={NEFT_BANK_DETAILS.accountNumber} />
          <BankRow label="IFSC" value={NEFT_BANK_DETAILS.ifsc} />
          <BankRow label="Branch" value={NEFT_BANK_DETAILS.branch} />
        </View>
        <Text style={styles.hint}>
          Transfer order total via NEFT/RTGS and share the UTR reference at checkout.
        </Text>
      </ScrollView>
    </View>
  );
}

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.bankRow}>
      <Text style={styles.bankLabel}>{label}</Text>
      <Text style={styles.bankValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.containerMargin, paddingBottom: spacing.unit12 },
  section: { ...typography.labelLg, color: colors.primary, marginBottom: spacing.unit2 },
  input: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: spacing.unit3,
    backgroundColor: colors.surfaceContainerLowest,
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  hint: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.unit2 },
  bankCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.unit4,
    gap: spacing.unit3,
  },
  bankRow: { gap: 2 },
  bankLabel: { ...typography.labelMd, color: colors.onSurfaceVariant },
  bankValue: { ...typography.labelLg, color: colors.primary, fontWeight: '600' },
});
