import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, spacing, typography } from '@/lib/theme';
import { useGstStore } from '@/stores/gst';

export default function GstScreen() {
  const gstin = useGstStore((s) => s.gstin);
  const businessName = useGstStore((s) => s.businessName);
  const savedAt = useGstStore((s) => s.savedAt);
  const setGstin = useGstStore((s) => s.setGstin);
  const setBusinessName = useGstStore((s) => s.setBusinessName);
  const save = useGstStore((s) => s.save);

  const handleSave = () => {
    if (gstin && gstin.length !== 15) {
      Alert.alert('Invalid GSTIN', 'GSTIN must be exactly 15 characters.');
      return;
    }
    save();
    Alert.alert('Saved', 'GST details will be attached to your next order.');
  };

  return (
    <View style={styles.container}>
      <AppHeader title="GST Details" showBack showCart={false} showLocation={false} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sub}>
          Add your GSTIN to receive tax invoices on delivered orders. Applied at checkout.
        </Text>
        <Text style={styles.label}>Business / Contractor Name</Text>
        <TextInput
          style={styles.input}
          value={businessName}
          onChangeText={setBusinessName}
          placeholder="e.g. Sharma Constructions"
        />
        <Text style={styles.label}>GSTIN (15 characters)</Text>
        <TextInput
          style={styles.input}
          value={gstin}
          onChangeText={(t) => setGstin(t.toUpperCase())}
          placeholder="36AABCU9603R1ZM"
          autoCapitalize="characters"
          maxLength={15}
        />
        <PrimaryButton label="Save" onPress={handleSave} style={{ marginTop: spacing.unit6 }} />
        {savedAt ? (
          <Text style={styles.savedHint}>Last saved {new Date(savedAt).toLocaleString('en-IN')}</Text>
        ) : null}
        <Text style={styles.hint}>Tax invoice will be shared after delivery when GSTIN is saved.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.containerMargin, paddingBottom: spacing.unit12 },
  sub: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.unit6 },
  label: { ...typography.labelLg, color: colors.primary, marginBottom: spacing.unit1, marginTop: spacing.unit3 },
  input: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: spacing.unit3,
    backgroundColor: colors.surfaceContainerLowest,
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  savedHint: { ...typography.labelMd, color: colors.success, textAlign: 'center', marginTop: spacing.unit3 },
  hint: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.unit4, textAlign: 'center' },
});
