import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AddressCard } from '@/components/AddressCard';
import { AppHeader } from '@/components/AppHeader';
import { formatFullAddress } from '@/lib/addressFormat';
import { resolveCurrentLocation } from '@/lib/resolveLocation';
import { colors, spacing, typography } from '@/lib/theme';
import type { SavedAddress } from '@/lib/types';
import { useAddressStore } from '@/stores/addresses';
import { useAuthStore } from '@/stores/auth';
import { useLocationStore } from '@/stores/location';

export default function AddressSelectScreen() {
  const token = useAuthStore((s) => s.token);
  const syncFromCloud = useAddressStore((s) => s.syncFromCloud);
  const addresses = useAddressStore((s) => s.addresses);

  useEffect(() => {
    void syncFromCloud(!!token);
  }, [token, syncFromCloud]);
  const committedId = useAddressStore((s) => s.selectedId);
  const selectAddress = useAddressStore((s) => s.selectAddress);
  const removeAddress = useAddressStore((s) => s.removeAddress);
  const setDeliveryAddress = useLocationStore((s) => s.setDeliveryAddress);

  // Local pending selection — highlighted but not yet committed to store
  // Initialise to the already-committed address so the radio is pre-filled
  const defaultPending =
    committedId ??
    addresses.find((a) => a.isDefault)?.id ??
    addresses[0]?.id ??
    null;
  const [pendingId, setPendingId] = useState<string | null>(defaultPending);

  const [gpsLoading, setGpsLoading] = useState(false);

  // Sort: most recently used → default → rest
  const sorted = [...addresses].sort((a, b) => {
    if (a.lastUsedAt && b.lastUsedAt) return b.lastUsedAt.localeCompare(a.lastUsedAt);
    if (a.lastUsedAt) return -1;
    if (b.lastUsedAt) return 1;
    if (a.isDefault) return -1;
    if (b.isDefault) return 1;
    return 0;
  });

  const mostRecentId = sorted.find((a) => a.lastUsedAt)?.id ?? null;
  const pendingAddress = addresses.find((a) => a.id === pendingId) ?? null;

  // ── Confirm selection → commit to store → back to checkout ────────
  const handleDeliverHere = () => {
    if (!pendingId || !pendingAddress) return;
    selectAddress(pendingId);
    setDeliveryAddress(formatFullAddress(pendingAddress));
    router.back();
  };

  // ── Delete ────────────────────────────────────────────────────────
  const handleDelete = (address: SavedAddress) => {
    const label = address.label === 'home' ? 'Home' : address.label === 'work' ? 'Work' : 'Other';
    Alert.alert('Delete Address', `Remove "${label}" address?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeAddress(address.id);
          if (pendingId === address.id) {
            const next = addresses.find((a) => a.id !== address.id);
            setPendingId(next?.id ?? null);
          }
        },
      },
    ]);
  };

  // ── Use GPS → pre-fill Add screen ─────────────────────────────────
  const handleGPS = async () => {
    setGpsLoading(true);
    try {
      const resolved = await resolveCurrentLocation();
      if (resolved) {
        router.push({
          pathname: '/address/add',
          params: {
            prefillStreet: resolved.deliveryAddress,
            prefillCity: resolved.shortLabel.split(',')[1]?.trim() ?? '',
          },
        });
      } else {
        Alert.alert('Location unavailable', 'Could not fetch your location. Please check permissions and try again.');
      }
    } finally {
      setGpsLoading(false);
    }
  };

  const hasAddresses = addresses.length > 0;

  return (
    <View style={styles.container}>
      <AppHeader title="Select Delivery Address" showBack showCart={false} showLocation={false} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* ── Use Current Location ─────────────────────────────── */}
        <Pressable
          style={[styles.gpsBtn, gpsLoading && styles.disabled]}
          onPress={handleGPS}
          disabled={gpsLoading}>
          {gpsLoading
            ? <ActivityIndicator size="small" color={colors.secondary} />
            : <MaterialIcons name="my-location" size={20} color={colors.secondary} />}
          <Text style={styles.gpsBtnText}>
            {gpsLoading ? 'Fetching location…' : 'Use Current Location'}
          </Text>
          {!gpsLoading && (
            <MaterialIcons name="chevron-right" size={20} color={colors.secondary} />
          )}
        </Pressable>

        {/* ── Add New Address ──────────────────────────────────── */}
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push('/address/add')}>
          <View style={styles.addIconWrap}>
            <MaterialIcons name="add-location-alt" size={20} color={colors.primary} />
          </View>
          <Text style={styles.addBtnText}>Add New Address</Text>
          <MaterialIcons name="chevron-right" size={20} color={colors.iconMuted} />
        </Pressable>

        {/* ── Saved Addresses ──────────────────────────────────── */}
        {hasAddresses && (
          <>
            <Text style={styles.sectionLabel}>SAVED ADDRESSES</Text>
            <View style={styles.list}>
              {sorted.map((addr) => (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  selected={addr.id === pendingId}
                  recentlyUsed={addr.id === mostRecentId}
                  onPress={() => setPendingId(addr.id)}
                  onEdit={() =>
                    router.push({ pathname: '/address/add', params: { id: addr.id } })
                  }
                  onDelete={() => handleDelete(addr)}
                />
              ))}
            </View>
          </>
        )}

        {!hasAddresses && (
          <View style={styles.empty}>
            <MaterialIcons name="location-off" size={56} color={colors.iconMuted} />
            <Text style={styles.emptyTitle}>No saved addresses</Text>
            <Text style={styles.emptySub}>Add your first delivery address above</Text>
          </View>
        )}

        {/* Spacer for bottom bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Bottom CTA ───────────────────────────────────────────── */}
      <View style={styles.bottomBar}>
        {pendingAddress ? (
          <>
            {/* Preview of what will be delivered to */}
            <View style={styles.previewRow}>
              <MaterialIcons
                name={pendingAddress.label === 'home' ? 'home' : pendingAddress.label === 'work' ? 'business' : 'location-on'}
                size={16}
                color={colors.secondary}
              />
              <Text style={styles.previewText} numberOfLines={1}>
                Delivering to: {pendingAddress.flat}, {pendingAddress.city}
              </Text>
            </View>
            <Pressable style={styles.deliverBtn} onPress={handleDeliverHere}>
              <MaterialIcons name="check-circle-outline" size={20} color={colors.onSecondary} />
              <Text style={styles.deliverBtnText}>Deliver Here</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={styles.deliverBtn}
            onPress={() => router.push('/address/add')}>
            <MaterialIcons name="add" size={20} color={colors.onSecondary} />
            <Text style={styles.deliverBtnText}>Add New Address</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.containerMargin,
    gap: spacing.unit3,
    paddingBottom: spacing.unit4,
  },

  // GPS button
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit3,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    padding: spacing.unit4,
  },
  gpsBtnText: { ...typography.labelLg, color: colors.secondary, flex: 1 },
  disabled: { opacity: 0.5 },

  // Add address row
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit3,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.unit4,
  },
  addIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { ...typography.labelLg, color: colors.onSurface, flex: 1 },

  sectionLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    paddingHorizontal: 2,
    marginTop: spacing.unit2,
  },
  list: { gap: spacing.unit3 },

  empty: {
    alignItems: 'center',
    paddingVertical: spacing.unit8,
    gap: spacing.unit2,
  },
  emptyTitle: { ...typography.headlineMd, color: colors.onSurface },
  emptySub: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingHorizontal: spacing.containerMargin,
    paddingTop: spacing.unit3,
    paddingBottom: spacing.unit6,
    gap: spacing.unit2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
  },
  previewText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  deliverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.unit2,
    backgroundColor: colors.secondary,
    borderRadius: 10,
    paddingVertical: spacing.unit4,
  },
  deliverBtnText: {
    ...typography.labelLg,
    color: colors.onSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
});
