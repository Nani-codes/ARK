import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { AddToCartControl } from '@/components/AddToCartControl';
import { AppHeader } from '@/components/AppHeader';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { PricingTierTable } from '@/components/PricingTierTable';
import { ProductPriceBlock } from '@/components/ProductPriceBlock';
import { TemperatureBadge } from '@/components/TemperatureBadge';
import { VariantPicker } from '@/components/VariantPicker';
import { fetchProduct } from '@/lib/api';
import { slotEtaSummary } from '@/lib/deliveryEstimate';
import {
  formatInr,
  getEffectivePricingTiers,
  getProductDisplayPricing,
  getProductVariants,
  resolveProductImageUrl,
} from '@/lib/productPricing';
import {
  findVariantByOptions,
  getInitialSelection,
  productHasSelectableVariants,
  selectOption,
} from '@/lib/productVariants';
import { colors, spacing, typography } from '@/lib/theme';
import { buildCartLine, cartLineId, useCartStore } from '@/stores/cart';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id!),
    enabled: !!id,
  });

  const product = data?.data;
  const variants = useMemo(
    () => (product ? getProductVariants(product) : []),
    [product]
  );

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) setSelectedOptions(getInitialSelection(product));
  }, [product?.documentId, product]);

  const selectedVariant = useMemo(
    () => (product ? findVariantByOptions(product, selectedOptions) : null),
    [product, selectedOptions]
  );

  const cartQty =
    useCartStore((s) =>
      s.items.find((i) => i.lineId === cartLineId(product?.documentId ?? '', selectedVariant?.id))?.quantity
    ) ?? 1;

  if (isLoading || !product || !selectedVariant) {
    return (
      <View style={styles.loading}>
        <AppHeader showBack showLocation={false} showSearch />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const uri = resolveProductImageUrl(product, selectedVariant);
  const specs = product.specs ?? [];
  const pricingTiers = getEffectivePricingTiers(product, selectedVariant);
  const { price, compareAtPrice, percent } = getProductDisplayPricing(
    product,
    selectedVariant,
    cartQty
  );
  const replacementDays = product.replacementDays ?? 7;
  const minVariantPrice = Math.min(...variants.map((v) => v.price));
  const unitLabel = product.priceUnitLabel ?? (product.unit === 'Sq Ft' ? '₹/ft²' : `/${product.unit}`);

  const handleSelectOption = (dimension: string, value: string) => {
    setSelectedOptions((current) => selectOption(product, current, dimension, value));
  };

  const handleBuyNow = () => {
    if (!product.inStock || !selectedVariant) return;

    const lineId = cartLineId(product.documentId, selectedVariant.id);
    const cartQty =
      useCartStore.getState().items.find((i) => i.lineId === lineId)?.quantity ?? 0;
    const checkoutQty = cartQty > 0 ? cartQty : 1;
    const item = buildCartLine(product, selectedVariant, checkoutQty);
    const itemsParam = encodeURIComponent(JSON.stringify([item]));
    router.push(`/checkout?buyNow=true&buyNowItems=${itemsParam}`);
  };

  return (
    <View style={styles.container}>
      <AppHeader showBack showSearch />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.content}>
          <View style={styles.imageWrap}>
            {percent != null && percent > 0 ? (
              <View style={styles.imageBadge}>
                <Text style={styles.imageBadgeText}>{percent}% OFF</Text>
              </View>
            ) : null}
            {uri ? (
              <Image
                source={{ uri }}
                style={styles.image}
                contentFit="contain"
                contentPosition="center"
              />
            ) : (
              <View style={styles.placeholder}>
                <MaterialIcons name="inventory-2" size={64} color={colors.icon} />
              </View>
            )}
          </View>

          {product.inStock ? (
            <View style={styles.stockTag}>
              <Text style={styles.stockText}>IN-STOCK</Text>
            </View>
          ) : null}

          <Text style={styles.name}>{product.name}</Text>

          <ProductPriceBlock
            price={price}
            compareAtPrice={compareAtPrice}
            percent={percent}
            size="lg"
          />
          {pricingTiers?.length ? (
            <PricingTierTable tiers={pricingTiers} unit={product.unit} currentQty={cartQty} />
          ) : null}
          <View style={styles.deliveryEtaRow}>
            <MaterialIcons name="local-shipping" size={16} color={colors.primary} />
            <Text style={styles.deliveryEtaText}>Standard delivery: {slotEtaSummary('asap')}</Text>
          </View>
          {product.temperatureSensitive ? (
            <TemperatureBadge note={product.temperatureNote} compact />
          ) : null}
          {productHasSelectableVariants(product) ? (
            <Text style={styles.startsAt}>
              Starts at {formatInr(minVariantPrice)}
              {unitLabel}
            </Text>
          ) : null}

          <VariantPicker
            product={product}
            selectedOptions={selectedOptions}
            selectedVariant={selectedVariant}
            onSelectOption={handleSelectOption}
          />

          <View style={styles.trustRow}>
            <View style={styles.trustChip}>
              <MaterialIcons name="payments" size={18} color={colors.primary} />
              <Text style={styles.trustText}>Pay After Verification</Text>
            </View>
            {product.authenticityVerified ? (
              <View style={styles.trustChip}>
                <MaterialIcons name="qr-code-2" size={18} color={colors.primary} />
                <Text style={styles.trustText}>Original Checked</Text>
              </View>
            ) : null}
            <View style={styles.trustChip}>
              <MaterialIcons name="published-with-changes" size={18} color={colors.primary} />
              <Text style={styles.trustText}>{replacementDays} Day Replacement</Text>
            </View>
            <View style={styles.trustChip}>
              <MaterialIcons name="verified-user" size={18} color={colors.primary} />
              <Text style={styles.trustText}>Quality Assured</Text>
            </View>
          </View>

          {product.bulkPricingEnabled ? (
            <Pressable
              style={styles.bulkCard}
              onPress={() =>
                router.push(`/quote?product=${encodeURIComponent(product.name)}`)
              }>
              <MaterialIcons name="savings" size={22} color={colors.secondary} />
              <View style={styles.bulkText}>
                <Text style={styles.bulkTitle}>Unlock Bulk Prices</Text>
                <Text style={styles.bulkSub}>Bulk prices launched — request a truckload quote</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={colors.iconMuted} />
            </Pressable>
          ) : null}

          {specs.length > 0 ? (
            <CollapsibleSection title="Additional Details" defaultOpen={false}>
              <View style={styles.specGrid}>
                {specs.map((row) => (
                  <SpecBox
                    key={row.label}
                    label={row.label.toUpperCase()}
                    value={row.value}
                  />
                ))}
              </View>
              {product.description ? (
                <Text style={styles.desc}>{product.description}</Text>
              ) : null}
            </CollapsibleSection>
          ) : product.description ? (
            <CollapsibleSection title="Additional Details" defaultOpen={false}>
              <Text style={styles.desc}>{product.description}</Text>
            </CollapsibleSection>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + spacing.unit2 }]}>
        <AddToCartControl
          product={product}
          variant={selectedVariant}
          size="md"
          style={styles.stickyAdd}
        />
        <PrimaryButton
          label="Buy Now"
          variant="navy"
          onPress={handleBuyNow}
          disabled={!product.inStock}
          style={styles.buyNowBtn}
        />
      </View>
    </View>
  );
}

function SpecBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.specBox}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.unit12, paddingTop: spacing.containerMargin },
  imageWrap: {
    aspectRatio: 1,
    marginBottom: spacing.unit4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBadge: {
    position: 'absolute',
    top: spacing.unit2,
    left: spacing.unit2,
    zIndex: 2,
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: spacing.unit2,
    paddingVertical: 4,
    borderRadius: 4,
  },
  imageBadgeText: { ...typography.labelMd, fontWeight: '800', color: colors.primary },
  image: { width: '100%', height: '100%', alignSelf: 'center' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.containerMargin },
  stockTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
  },
  stockText: { ...typography.labelMd, color: colors.onPrimary, textTransform: 'uppercase' },
  name: { ...typography.headlineLgMobile, color: colors.primary, marginBottom: spacing.unit3 },
  startsAt: { ...typography.labelLg, color: colors.onSurfaceVariant, marginTop: spacing.unit1 },
  deliveryEtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
    marginTop: spacing.unit3,
  },
  deliveryEtaText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.unit2,
    marginTop: spacing.unit4,
  },
  trustChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit1,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 999,
    paddingHorizontal: spacing.unit3,
    paddingVertical: spacing.unit2,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  trustText: { ...typography.labelMd, color: colors.primary, fontWeight: '600' },
  bulkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit3,
    marginTop: spacing.unit4,
    padding: spacing.unit4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(119, 90, 25, 0.35)',
    backgroundColor: colors.secondaryContainer,
  },
  bulkText: { flex: 1 },
  bulkTitle: { ...typography.labelLg, color: colors.primary },
  bulkSub: { ...typography.labelMd, color: colors.onSurfaceVariant, marginTop: 2 },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.unit3,
  },
  specBox: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(0, 10, 30, 0.2)',
    borderRadius: 4,
    padding: spacing.unit3,
    alignItems: 'center',
  },
  specLabel: { ...typography.labelMd, color: colors.onSurfaceVariant, marginBottom: 4 },
  specValue: { ...typography.labelLg, color: colors.primary, fontWeight: '700' },
  desc: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.unit3 },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit3,
    paddingHorizontal: spacing.containerMargin,
    paddingTop: spacing.unit3,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  stickyAdd: { flex: 1 },
  buyNowBtn: { flex: 1 },
});
