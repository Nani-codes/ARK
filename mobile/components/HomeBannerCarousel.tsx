import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';

import { colors, spacing } from '@/lib/theme';
import type { HomeBanner } from '@/lib/types';

const HORIZONTAL_PADDING = spacing.containerMargin;
const PAGE_WIDTH = Dimensions.get('window').width - HORIZONTAL_PADDING * 2;
const BANNER_HEIGHT = Math.round(PAGE_WIDTH * 0.42);
const AUTO_ADVANCE_MS = 5000;

type HomeBannerCarouselProps = {
  banners: HomeBanner[];
  loading?: boolean;
};

export function HomeBannerCarousel({ banners, loading }: HomeBannerCarouselProps) {
  const listRef = useRef<FlatList<HomeBanner>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const userInteracted = useRef(false);

  const openBannerLink = useCallback((link?: string) => {
    if (!link) return;
    if (link.startsWith('http://') || link.startsWith('https://')) {
      void Linking.openURL(link);
      return;
    }
    router.push(link.startsWith('/') ? (link as never) : (`/${link}` as never));
  }, []);

  const onMomentumScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / PAGE_WIDTH);
    setActiveIndex(index);
  }, []);

  const onScrollBeginDrag = useCallback(() => {
    userInteracted.current = true;
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return undefined;

    const timer = setInterval(() => {
      if (userInteracted.current) return;
      setActiveIndex((current) => {
        const next = (current + 1) % banners.length;
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, AUTO_ADVANCE_MS);

    return () => clearInterval(timer);
  }, [banners.length]);

  const renderItem: ListRenderItem<HomeBanner> = useCallback(
    ({ item }) => (
      <Pressable
        style={styles.slide}
        onPress={() => openBannerLink(item.link)}
        disabled={!item.link}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          contentFit="cover"
          accessibilityLabel={item.title}
        />
      </Pressable>
    ),
    [openBannerLink]
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!banners.length) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={banners}
        keyExtractor={(item) => item.documentId}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={PAGE_WIDTH}
        snapToAlignment="start"
        disableIntervalMomentum
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollBeginDrag={onScrollBeginDrag}
        getItemLayout={(_, index) => ({
          length: PAGE_WIDTH,
          offset: PAGE_WIDTH * index,
          index,
        })}
        contentContainerStyle={styles.listContent}
      />
      {banners.length > 1 ? (
        <View style={styles.dots}>
          {banners.map((banner, index) => (
            <View
              key={banner.documentId}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.unit4,
  },
  loading: {
    height: BANNER_HEIGHT,
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
    width: PAGE_WIDTH,
    height: BANNER_HEIGHT,
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
});
