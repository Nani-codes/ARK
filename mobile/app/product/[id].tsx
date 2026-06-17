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

import { AddToCartControl } from '@/components/AddToCartControl';
import { AppHeader } from '@/components/AppHeader';
import { MultiVariantPicker } from '@/components/MultiVariantPicker';
import { ProductPriceBlock } from '@/components/ProductPriceBlock';
import { VariantPicker } from '@/components/VariantPicker';
import { fetchProduct } from '@/lib/api';
import { formatInr, getProductDisplayPricing, getProductVariants } from '@/lib/productPricing';
import { mediaUrl } from '@/lib/strapi';
import { colors, spacing, typography } from '@/lib/theme';
import type { ProductVariant, VariantCombination } from '@/lib/types';
import { cartLineId, useCartStore } from '@/stores/cart';

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
  
  const isMultiVariant = !!product?.variantAxes?.length && !!product?.variantCombinations?.length;

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedCombination, setSelectedCombination] = useState<VariantCombination | null>(null);

  useEffect(() => {
    if (isMultiVariant) {
      if (product.variantCombinations?.length) {
        // Find first in-stock combination, fallback to first overall
        const inStockCombo = product.variantCombinations.find((c) => c.stock > 0);
        setSelectedCombination(inStockCombo || product.variantCombinations[0]);
      }
    } else if (variants.length) {
      setSelectedVariant(variants[0]);
    }
  }, [product?.documentId, variants, isMultiVariant, product?.variantCombinations]);

  if (isLoading || !product || (!isMultiVariant && !selectedVariant) || (isMultiVariant && !selectedCombination)) {
    return (
      <View style={styles.loading}>
        <AppHeader showBack showLocation={false} showSearch />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const activeImage = isMultiVariant && selectedCombination?.image?.url ? selectedCombination.image.url : product.image?.url;
  const uri = mediaUrl(activeImage);
  const specs = product.specs ?? [];
  const { price, compareAtPrice, percent } = getProductDisplayPricing(product, selectedVariant ?? undefined, isMultiVariant ? selectedCombination : null);
  const variantLabel = product.variantOptionName ?? 'Size';
  const replacementDays = product.replacementDays ?? 7;
  const minVariantPrice = isMultiVariant 
    ? Math.min(...(product.variantCombinations?.map((c) => Number(c.price)) || [0]))
    : Math.min(...getProductVariants(product).map((v) => v.price));
  const unitLabel = product.priceUnitLabel ?? (product.unit === 'Sq Ft' ? '₹/ft²' : `/${product.unit}`);

  const handleBuyNow = () => {
    if (!product || (!isMultiVariant && !selectedVariant) || (isMultiVariant && !selectedCombination)) return;

    let displayName = product.name;
    let variantId: string | undefined;
    let variantLabelParam: string | undefined;
    let sku: string | undefined;
    let unitPrice = 0;
    
    if (isMultiVariant && selectedCombination) {
      sku = selectedCombination.sku;
      variantLabelParam = selectedCombination.axisValues.join(' / ');
      displayName = `${product.name} (${variantLabelParam})`;
      unitPrice = Number(selectedCombination.price);
    } else if (selectedVariant) {
      displayName = selectedVariant.id === 'default' ? product.name : `${product.name} (${selectedVariant.label})`;
      variantId = selectedVariant.id !== 'default' ? selectedVariant.id : undefined;
      variantLabelParam = selectedVariant.id !== 'default' ? selectedVariant.label : undefined;
      unitPrice = Number(selectedVariant.price);
    }

    const imagePath = isMultiVariant && selectedCombination?.image?.url ? selectedCombination.image.url : product.image?.url;
    const imageUrl = mediaUrl(imagePath);

    const lineId = isMultiVariant && selectedCombination 
      ? cartLineId(product.documentId, undefined, selectedCombination.sku)
      : cartLineId(product.documentId, selectedVariant?.id);
      
    const cartQty = useCartStore.getState().items.find((i) => i.lineId === lineId)?.quantity ?? 0;
    const checkoutQty = cartQty > 0 ? cartQty : 1;

    const item = {
      lineId,
      productDocumentId: product.documentId,
      sku,
      variantId,
      variantLabel: variantLabelParam,
      name: displayName,
      unit: product.unit,
      unitPrice,
      quantity: checkoutQty,
      imageUrl,
    };

    const itemsParam = encodeURIComponent(JSON.stringify([item]));
    router.push(`/checkout?buyNow=true&buyNowItems=${itemsParam}`);
  };

  return (
    <View style={styles.container}>
      <AppHeader showBack showSearch />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.imageWrap}>
          {percent != null && percent > 0 ? (
            <View style={styles.imageBadge}>
              <Text style={styles.imageBadgeText}>{percent}% OFF</Text>
            </View>
          ) : null}
          {uri ? (
            <Image source={{ uri }} style={styles.image} contentFit="contain" />
          ) : (
            <View style={styles.placeholder}>
              <MaterialIcons name="inventory-2" size={64} color={colors.icon} />
            </View>
          )}
        </View>

        <View style={styles.content}>
          {isMultiVariant && selectedCombination ? (
            selectedCombination.stock > 0 ? (
              <View style={styles.stockTag}>
                <Text style={styles.stockText}>IN-STOCK</Text>
              </View>
            ) : null
          ) : product.inStock ? (
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
          {(isMultiVariant && product.variantCombinations && product.variantCombinations.length > 1) || (!isMultiVariant && getProductVariants(product).length > 1) ? (
            <Text style={styles.startsAt}>
              Starts at {formatInr(minVariantPrice)}
              {unitLabel}
            </Text>
          ) : null}

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

          {isMultiVariant && product.variantAxes && product.variantCombinations ? (
            <MultiVariantPicker
              axes={product.variantAxes}
              combinations={product.variantCombinations}
              selectedCombination={selectedCombination}
              onSelect={setSelectedCombination}
            />
          ) : (
            <VariantPicker
              label={variantLabel}
              variants={variants}
              selectedId={selectedVariant?.id || ''}
              onSelect={setSelectedVariant}
            />
          )}

          {specs.length > 0 ? (
            <>
              <View style={styles.divider} />
              <View style={styles.specGrid}>
                {specs.map((row) => (
                  <SpecBox
                    key={row.label}
                    label={row.label.toUpperCase()}
                    value={row.value}
                  />
                ))}
              </View>
            </>
          ) : null}

          {product.description ? (
            <Text style={styles.desc}>{product.description}</Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + spacing.unit2 }]}>
        <View style={styles.buttonRow}>
          <AddToCartControl
            product={product}
            variant={selectedVariant ?? undefined}
            combination={isMultiVariant ? selectedCombination : null}
            size="md"
            style={styles.stickyControl}
          />
          {(isMultiVariant && selectedCombination && selectedCombination.stock > 0) || (!isMultiVariant && product.inStock) ? (
            <Pressable
              style={styles.buyNowBtn}
              onPress={handleBuyNow}>
              <MaterialIcons name="flash-on" size={22} color={colors.onPrimary} />
              <Text style={styles.buyNowLabel}>BUY NOW</Text>
            </Pressable>
          ) : null}
        </View>
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
  scroll: { paddingBottom: spacing.unit12 },
  imageWrap: {
    aspectRatio: 1,
    margin: spacing.containerMargin,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
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
  image: { width: '100%', height: '100%' },
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
  divider: { height: 1, backgroundColor: colors.outlineVariant, marginVertical: spacing.unit4 },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.unit3,
    marginBottom: spacing.unit4,
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
  desc: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.unit4 },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
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
  stickyControl: { flex: 1 },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.unit3,
    width: '100%',
  },
  buyNowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.unit2,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.unit4,
  },
  buyNowLabel: {
    ...typography.labelLg,
    color: colors.onPrimary,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
