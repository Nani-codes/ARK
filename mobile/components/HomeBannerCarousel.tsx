import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type ListRenderItem,
} from 'react-native';

import { colors, spacing } from '@/lib/theme';
import type { HomeBanner } from '@/lib/types';

const HORIZONTAL_PADDING = spacing.containerMargin;
const BANNER_ASPECT = 0.42;
const AUTO_ADVANCE_MS = 5000;

type HomeBannerCarouselProps = {
  banners: HomeBanner[];
  loading?: boolean;
};

function clampIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(index, length - 1));
}

export function HomeBannerCarousel({ banners, loading }: HomeBannerCarouselProps) {
  const { width: screenWidth } = useWindowDimensions();
  const pageWidth = screenWidth - HORIZONTAL_PADDING * 2;
  const bannerHeight = Math.round(pageWidth * BANNER_ASPECT);

  const listRef = useRef<FlatList<HomeBanner>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const userInteracted = useRef(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginBottom: spacing.unit4,
        },
        loading: {
          height: bannerHeight,
          marginHorizontal: HORIZONTAL_PADDING,
          marginBottom: spacing.unit4,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surfaceContainerLow,
          borderRadius: 12,
        },
        listContent: {
          paddingHorizontal: HORIZONTAL_PADDING,
        },
        slide: {
          width: pageWidth,
          height: bannerHeight,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: colors.surfaceContainerLow,
        },
        image: {
          width: '100%',
          height: '100%',
        },
        dots: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: spacing.unit1,
          marginTop: spacing.unit2,
        },
        dot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.outlineVariant,
        },
        dotActive: {
          width: 18,
          backgroundColor: colors.secondary,
        },
      }),
    [bannerHeight, pageWidth]
  );

  useEffect(() => {
    setActiveIndex((current) => clampIndex(current, banners.length));
    userInteracted.current = false;
  }, [banners.length]);

  const scrollToIndex = useCallback(
    (index: number, animated = true) => {
      const safeIndex = clampIndex(index, banners.length);
      listRef.current?.scrollToIndex({ index: safeIndex, animated });
    },
    [banners.length]
  );

  const onScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      listRef.current?.scrollToOffset({
        offset: info.averageItemLength * info.index,
        animated: false,
      });
      requestAnimationFrame(() => scrollToIndex(info.index, false));
    },
    [scrollToIndex]
  );

  const openBannerLink = useCallback((link?: string) => {
    if (!link) return;
    if (link.startsWith('http://') || link.startsWith('https://')) {
      void Linking.openURL(link);
      return;
    }
    router.push(link.startsWith('/') ? (link as never) : (`/${link}` as never));
  }, []);

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = clampIndex(
        Math.round(event.nativeEvent.contentOffset.x / pageWidth),
        banners.length
      );
      setActiveIndex(index);
    },
    [banners.length, pageWidth]
  );

  const onScrollBeginDrag = useCallback(() => {
    userInteracted.current = true;
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return undefined;

    const timer = setInterval(() => {
      if (userInteracted.current) return;
      setActiveIndex((current) => {
        const next = (current + 1) % banners.length;
        scrollToIndex(next);
        return next;
      });
    }, AUTO_ADVANCE_MS);

    return () => clearInterval(timer);
  }, [banners.length, scrollToIndex]);

  const renderItem: ListRenderItem<HomeBanner> = useCallback(
    ({ item }) => (
      <Pressable
        style={styles.slide}
        onPress={() => openBannerLink(item.link)}
        disabled={!item.link}
        accessibilityRole="button"
        accessibilityLabel={item.link ? `${item.title}, open promotion` : item.title}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          contentFit="cover"
          accessibilityLabel={item.title}
        />
      </Pressable>
    ),
    [openBannerLink, styles.image, styles.slide]
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<HomeBanner> | null | undefined, index: number) => ({
      length: pageWidth,
      offset: pageWidth * index,
      index,
    }),
    [pageWidth]
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!banners.length) return null;

  const safeActiveIndex = clampIndex(activeIndex, banners.length);

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={banners}
        keyExtractor={(item) => item.documentId}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        nestedScrollEnabled={Platform.OS === 'android'}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={pageWidth}
        snapToAlignment="start"
        disableIntervalMomentum
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollToIndexFailed={onScrollToIndexFailed}
        getItemLayout={getItemLayout}
        contentContainerStyle={styles.listContent}
      />
      {banners.length > 1 ? (
        <View style={styles.dots} accessibilityRole="tablist">
          {banners.map((banner, index) => (
            <View
              key={banner.documentId}
              style={[styles.dot, index === safeActiveIndex && styles.dotActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: index === safeActiveIndex }}
              accessibilityLabel={`Banner ${index + 1} of ${banners.length}: ${banner.title}`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
