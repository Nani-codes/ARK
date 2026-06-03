import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors } from '@/lib/theme';

type ScreenBackgroundProps = ViewProps & {
  variant?: 'default' | 'hero';
};

/** Light screen base with optional soft warm gradient. */
export function ScreenBackground({ variant = 'default', style, children, ...props }: ScreenBackgroundProps) {
  return (
    <View style={[styles.root, style]} {...props}>
      {variant === 'hero' ? (
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <LinearGradient
        colors={['rgba(255, 184, 0, 0.08)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0.6 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});
