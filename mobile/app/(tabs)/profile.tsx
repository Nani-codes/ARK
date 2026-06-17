import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { fetchAppConfig } from '@/lib/api';
import { professionLabel } from '@/lib/professions';
import { brand, colors, spacing, typography } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth';

const MENU_ITEMS = [
  { icon: 'receipt-long' as const, label: 'My Orders', href: '/(tabs)/orders' },
  { icon: 'description' as const, label: 'My Quote Requests', href: '/quotes' },
  { icon: 'add-circle-outline' as const, label: 'Request Bulk Quote', href: '/quote' },
  { icon: 'location-on' as const, label: 'Saved Addresses', href: '/address/select' },
  { icon: 'business' as const, label: 'Manage GST Details', href: '/profile/gst' },
  { icon: 'payments' as const, label: 'Payment Methods', href: '/profile/payments' },
  { icon: 'help-outline' as const, label: 'Help & Support', href: '/profile/support' },
  { icon: 'groups' as const, label: 'Find Professionals', href: '/professionals' },
  { icon: 'engineering' as const, label: 'Professional Profile', href: '/profile/professional' },
];

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data: configData } = useQuery({ queryKey: ['app-config'], queryFn: fetchAppConfig });
  const whatsapp = configData?.data?.whatsappNumber ?? '919876543210';

  const openWhatsApp = () => {
    Linking.openURL(
      `https://wa.me/${whatsapp}?text=${encodeURIComponent('Hi ARK, I need assistance.')}`
    );
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Profile" showLocation={false} variant="navy" showSearch />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={40} color={colors.secondaryContainer} />
            <View style={styles.verified}>
              <MaterialIcons name="verified" size={14} color={colors.onSecondary} />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.displayName ?? 'Contractor'}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {user?.isProfessional
                  ? user.listedAsProfessional
                    ? 'LISTED PRO'
                    : 'PROFESSIONAL'
                  : 'PREMIUM MEMBER'}
              </Text>
            </View>
            {user?.isProfessional && user.professionType ? (
              <Text style={styles.trade}>{professionLabel(user.professionType)}</Text>
            ) : null}
            <Text style={styles.contractorId}>
              Contractor ID: {user?.contractorId ?? '—'}
            </Text>
            {user?.phone ? (
              <Text style={styles.phone}>+91 {user.phone}</Text>
            ) : null}
          </View>
        </View>

        <Text style={styles.sectionLabel}>ACCOUNT MANAGEMENT</Text>
        <View style={styles.menu}>
          {MENU_ITEMS.map((item, i) => (
            <Pressable
              key={item.label}
              style={[styles.menuItem, i > 0 && styles.menuBorder]}
              onPress={() => item.href && router.push(item.href as never)}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIcon}>
                  <MaterialIcons name={item.icon} size={22} color={colors.primaryContainer} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={colors.outline} />
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.whatsappBtn} onPress={openWhatsApp}>
          <MaterialIcons name="chat" size={22} color="#25D366" />
          <Text style={styles.whatsappText}>Chat on WhatsApp</Text>
        </Pressable>

        <PrimaryButton
          label="Logout"
          variant="outline"
          onPress={handleLogout}
          style={styles.logout}
        />
        <Text style={styles.version}>App Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.containerMargin, paddingBottom: spacing.unit12 },
  profileCard: {
    flexDirection: 'row',
    gap: spacing.unit6,
    backgroundColor: colors.primaryContainer,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(119, 90, 25, 0.5)',
    padding: spacing.unit6,
    marginBottom: spacing.unit6,
    overflow: 'hidden',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verified: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: brand.gold,
    borderRadius: 12,
    padding: 2,
    borderWidth: 2,
    borderColor: colors.primaryContainer,
  },
  profileInfo: { flex: 1, justifyContent: 'center' },
  name: { ...typography.headlineMd, color: colors.onPrimary, fontWeight: '700' },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: brand.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: spacing.unit1,
  },
  badgeText: { ...typography.labelMd, color: colors.onSecondary, fontWeight: '700' },
  trade: { ...typography.labelMd, color: brand.gold, marginTop: spacing.unit1 },
  contractorId: { ...typography.bodyMd, color: 'rgba(255,255,255,0.7)', marginTop: spacing.unit1 },
  phone: { ...typography.bodyMd, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  sectionLabel: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.unit3,
    paddingHorizontal: 4,
  },
  menu: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
    marginBottom: spacing.unit6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.unit4,
    borderLeftWidth: 4,
    borderLeftColor: brand.gold,
  },
  menuBorder: { borderTopWidth: 1, borderTopColor: colors.outlineVariant },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.unit4, flex: 1 },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { ...typography.labelLg, color: colors.onSurface },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.unit2,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#25D366',
    padding: spacing.unit4,
    marginBottom: spacing.unit3,
  },
  whatsappText: { ...typography.labelLg, color: '#128C7E', fontWeight: '700' },
  logout: { marginTop: spacing.unit4 },
  version: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.unit4,
    opacity: 0.5,
  },
});
