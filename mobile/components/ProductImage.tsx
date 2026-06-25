import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/lib/theme';

type ProductImageProps = {
  uri?: string | null;
  accessibilityLabel?: string;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
};

/** Centered product thumbnail used across cards, cart rows, and detail pages. */
export function ProductImage({
  uri,
  accessibilityLabel,
  iconSize = 32,
  style,
}: ProductImageProps) {
  return (
    <View style={[styles.wrap, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={styles.image}
          contentFit="contain"
          contentPosition="center"
          accessibilityLabel={accessibilityLabel}
        />
      ) : (
        <View style={styles.placeholder}>
          <MaterialIcons name="inventory-2" size={iconSize} color={colors.icon} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  placeholder: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
