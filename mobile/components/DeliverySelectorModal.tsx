import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AddressCard } from '@/components/AddressCard';
import { formatFullAddress } from '@/lib/addressFormat';
import { colors, spacing, typography } from '@/lib/theme';
import { useAddressStore } from '@/stores/addresses';
import { useLocationStore } from '@/stores/location';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function DeliverySelectorModal({ visible, onClose }: Props) {
  const addresses = useAddressStore((s) => s.addresses);
  const selectedId =
    useAddressStore((s) => s.selectedId) ||
    addresses.find((a) => a.isDefault)?.id ||
    addresses[0]?.id ||
    null;
  const selectAddress = useAddressStore((s) => s.selectAddress);
  const setDeliveryAddress = useLocationStore((s) => s.setDeliveryAddress);

  const handleSelect = (id: string) => {
    const address = addresses.find((a) => a.id === id);
    if (address) {
      selectAddress(id);
      setDeliveryAddress(formatFullAddress(address));
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Deliver to</Text>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close selector">
              <MaterialIcons name="close" size={24} color={colors.onSurface} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {addresses.length === 0 ? (
              <View style={styles.empty}>
                <MaterialIcons name="location-off" size={48} color={colors.iconMuted} />
                <Text style={styles.emptyText}>No saved addresses found</Text>
              </View>
            ) : (
              addresses.map((addr) => (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  selected={addr.id === selectedId}
                  onPress={() => handleSelect(addr.id)}
                />
              ))
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={styles.actionBtn}
              onPress={() => {
                onClose();
                router.push('/address/select');
              }}
              accessibilityRole="button"
              accessibilityLabel="Manage addresses">
              <MaterialIcons name="settings" size={20} color={colors.primary} />
              <Text style={styles.actionText}>Manage</Text>
            </Pressable>

            <Pressable
              style={[styles.actionBtn, styles.actionBtnPrimary]}
              onPress={() => {
                onClose();
                router.push('/address/add');
              }}
              accessibilityRole="button"
              accessibilityLabel="Add new address">
              <MaterialIcons name="add" size={20} color={colors.onSecondary} />
              <Text style={[styles.actionText, styles.actionTextPrimary]}>Add Address</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.unit4,
    paddingBottom: spacing.unit8,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.containerMargin,
    paddingBottom: spacing.unit4,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  title: {
    ...typography.headlineMd,
    color: colors.primary,
  },
  closeBtn: {
    padding: spacing.unit1,
  },
  scroll: {
    maxHeight: 400,
  },
  scrollContent: {
    padding: spacing.containerMargin,
    gap: spacing.unit3,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.unit8,
    gap: spacing.unit2,
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.containerMargin,
    paddingTop: spacing.unit4,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    gap: spacing.unit3,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.unit2,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 10,
    paddingVertical: spacing.unit3,
    backgroundColor: colors.surface,
  },
  actionBtnPrimary: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  actionText: {
    ...typography.labelLg,
    color: colors.primary,
    fontWeight: '600',
  },
  actionTextPrimary: {
    color: colors.onSecondary,
  },
});
