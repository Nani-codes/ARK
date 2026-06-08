import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { fetchAppConfig } from '@/lib/api';
import { colors, spacing, typography } from '@/lib/theme';

export default function SupportScreen() {
  const { data } = useQuery({ queryKey: ['app-config'], queryFn: fetchAppConfig });
  const config = data?.data;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const openWhatsApp = () => {
    const num = config?.whatsappNumber ?? '919876543210';
    Linking.openURL(`https://wa.me/${num}?text=${encodeURIComponent('Hi ARK, I need help with my order.')}`);
  };

  const callSupport = () => {
    const phone = config?.supportPhone ?? '18001234567';
    Linking.openURL(`tel:${phone}`);
  };

  const faqs = config?.faqs ?? [];

  return (
    <View style={styles.container}>
      <AppHeader title="Help & Support" showBack showCart={false} showLocation={false} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={openWhatsApp}>
            <MaterialIcons name="chat" size={24} color="#25D366" />
            <Text style={styles.actionText}>WhatsApp Support</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={callSupport}>
            <MaterialIcons name="phone" size={24} color={colors.primary} />
            <Text style={styles.actionText}>Call {config?.supportPhone ?? '1800-123-4567'}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqs.map((faq, i) => (
          <Pressable
            key={faq.q}
            style={styles.faqItem}
            onPress={() => setOpenIndex(openIndex === i ? null : i)}>
            <View style={styles.faqHead}>
              <Text style={styles.faqQ}>{faq.q}</Text>
              <MaterialIcons
                name={openIndex === i ? 'expand-less' : 'expand-more'}
                size={22}
                color={colors.iconMuted}
              />
            </View>
            {openIndex === i ? <Text style={styles.faqA}>{faq.a}</Text> : null}
          </Pressable>
        ))}

        <Text style={styles.hours}>
          Operating hours: {config?.operatingHoursStart ?? 8} AM – {config?.operatingHoursEnd ?? 20 > 12 ? (config?.operatingHoursEnd ?? 20) - 12 : config?.operatingHoursEnd ?? 20} PM IST · Hyderabad
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.containerMargin, paddingBottom: spacing.unit12 },
  actions: { flexDirection: 'row', gap: spacing.unit3, marginBottom: spacing.unit6 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.unit4,
  },
  actionText: { ...typography.labelLg, color: colors.primary, flex: 1 },
  sectionTitle: { ...typography.headlineMd, color: colors.primary, marginBottom: spacing.unit4 },
  faqItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.unit4,
    marginBottom: spacing.unit3,
  },
  faqHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.unit2 },
  faqQ: { ...typography.labelLg, color: colors.primary, flex: 1 },
  faqA: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.unit3 },
  hours: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.unit6 },
});
