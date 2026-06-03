import { MaterialIcons } from '@expo/vector-icons';
import type { StyleProp, TextStyle } from 'react-native';

import { colors } from '@/lib/theme';

type IconName = keyof typeof MaterialIcons.glyphMap;

type AppIconProps = {
  name: IconName;
  size?: number;
  variant?: 'default' | 'muted' | 'onAccent' | 'onSurface';
  color?: string;
  style?: StyleProp<TextStyle>;
};

const variantColor = {
  default: colors.icon,
  muted: colors.iconMuted,
  onAccent: colors.iconOnAccent,
  onSurface: colors.onSurface,
} as const satisfies Record<string, string>;

export function AppIcon({ name, size = 24, variant = 'default', color, style }: AppIconProps) {
  return (
    <MaterialIcons
      name={name}
      size={size}
      color={color ?? variantColor[variant]}
      style={style}
    />
  );
}
