import { Image, ImageStyle, StyleSheet, View, ViewStyle } from 'react-native';

type LogoSize = 'sm' | 'md' | 'hero';

const SIZES: Record<LogoSize, number> = {
  sm: 28,
  md: 36,
  hero: 72,
};

type LogoProps = {
  size?: LogoSize;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  /** Slightly rounded corners on md/sm; hero uses larger radius */
  rounded?: boolean;
};

export function Logo({ size = 'md', style, imageStyle, rounded = true }: LogoProps) {
  const dimension = SIZES[size];
  const radius = size === 'hero' ? 16 : 8;

  return (
    <View
      style={[
        styles.wrap,
        rounded && { borderRadius: radius },
        { width: dimension, height: dimension },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="ARK logo">
      <Image
        source={require('@/assets/images/Logo.png')}
        style={[
          styles.image,
          { width: dimension, height: dimension, borderRadius: rounded ? radius : 0 },
          imageStyle,
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
