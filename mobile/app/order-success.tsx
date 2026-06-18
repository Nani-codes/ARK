import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { orderSuccessEtaMessage } from '@/lib/deliveryEstimate';
import { brand, colors, spacing, typography } from '@/lib/theme';

export default function OrderSuccessScreen() {
  const { orderNumber, estimatedDeliveryAt } = useLocalSearchParams<{
    orderNumber: string;
    estimatedDeliveryAt?: string;
  }>();
  const displayNum = orderNumber?.replace('ORD-', '') ?? '—';

  return (
    <View style={styles.container}>
      <AppHeader showBack showCart={false} showLocation={false} />
      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="check-circle" size={64} color={brand.goldBright} />
        </View>
        <Text style={styles.title}>Order #{displayNum} Placed Successfully!</Text>
        <Text style={styles.sub}>{orderSuccessEtaMessage(estimatedDeliveryAt)}</Text>
        <View style={styles.actions}>
          <PrimaryButton label="Track Order" onPress={() => router.replace('/(tabs)/orders')} />
          <PrimaryButton
            label="Continue Shopping"
            variant="outline"
            onPress={() => router.replace('/(tabs)')}
            style={{ marginTop: spacing.unit3 }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.containerMargin,
  },
  iconCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderWidth: 6,
    borderColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.unit6,
  },
  title: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.unit2,
  },
  sub: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 360,
    marginBottom: spacing.unit8,
  },
  actions: { width: '100%', maxWidth: 320 },
});
