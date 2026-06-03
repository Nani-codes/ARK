import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '@/lib/theme';
import { useCartStore } from '@/stores/cart';
import { useLocationStore } from '@/stores/location';

type AppHeaderProps = {
  title?: string;
  subtitle?: string;
  showLocation?: boolean;
  showCart?: boolean;
  showBack?: boolean;
  variant?: 'default' | 'navy' | 'home';
};

export function AppHeader({
  title,
  subtitle,
  showLocation = false,
  showCart = true,
  showBack = false,
  variant = 'default',
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const itemCount = useCartStore((s) => s.itemCount());
  const shortLabel = useLocationStore((s) => s.shortLabel);
  const isResolving = useLocationStore((s) => s.isResolving);
  const resolveFromDevice = useLocationStore((s) => s.resolveFromDevice);
  const isNavy = variant === 'navy';
  const isHome = variant === 'home';

  const fg = isNavy || isHome ? colors.onPrimary : colors.onSurface;
  const iconColor = isNavy || isHome ? colors.secondaryContainer : colors.primary;
  const cartIconColor = isNavy || isHome ? colors.secondaryContainer : colors.secondary;

  return (
    <View
      style={[
        styles.wrap,
        isNavy && styles.wrapNavy,
        isHome && styles.wrapHome,
        { paddingTop: insets.top + spacing.unit2 },
      ]}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={24} color={fg} />
          </Pressable>
        ) : null}
        {showLocation ? (
          <Pressable
            style={styles.location}
            onPress={() => void resolveFromDevice(true)}
            accessibilityRole="button"
            accessibilityLabel="Update delivery location">
            <MaterialIcons name="location-on" size={22} color={iconColor} />
            <View style={styles.locationText}>
              {!isNavy ? (
                <Text style={[styles.locationLabel, { color: colors.onSurfaceVariant }]}>
                  Delivering to
                </Text>
              ) : null}
              <Text style={[styles.locationValue, { color: fg }]} numberOfLines={1}>
                {isResolving ? 'Locating…' : shortLabel}
              </Text>
            </View>
          </Pressable>
        ) : title ? (
          <Text style={[styles.title, { color: fg }]}>{title}</Text>
        ) : (
          <View />
        )}
        <View style={styles.actions}>
          {showCart ? (
            <Pressable onPress={() => router.push('/cart')} style={styles.iconBtn}>
              <MaterialIcons name="shopping-cart" size={24} color={cartIconColor} />
              {itemCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{itemCount > 9 ? '9+' : itemCount}</Text>
                </View>
              ) : null}
            </Pressable>
          ) : null}
        </View>
      </View>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: isNavy ? 'rgba(255,255,255,0.7)' : colors.onSurfaceVariant }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    paddingHorizontal: spacing.containerMargin,
    paddingBottom: spacing.unit2,
  },
  wrapNavy: {
    backgroundColor: colors.primaryContainer,
    borderBottomColor: 'rgba(255, 222, 165, 0.3)',
  },
  wrapHome: {
    backgroundColor: colors.primary,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.unit2,
  },
  location: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.unit2, minWidth: 0 },
  locationText: { flex: 1, minWidth: 0 },
  locationLabel: { ...typography.labelMd },
  locationValue: { ...typography.labelLg, fontWeight: '600' },
  title: { ...typography.headlineMd, flex: 1 },
  subtitle: { ...typography.bodyMd, marginTop: spacing.unit1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.unit2 },
  iconBtn: { padding: spacing.unit1, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.onSecondary, fontSize: 10, fontWeight: '700' },
});
