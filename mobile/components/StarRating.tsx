import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/lib/theme';

type StarRatingProps = {
  rating: number;
  size?: number;
  showValue?: boolean;
  count?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
};

export function StarRating({
  rating,
  size = 16,
  showValue = false,
  count,
  interactive = false,
  onChange,
}: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.row}>
      {stars.map((star) => {
        const filled = rating >= star - 0.25;
        const half = !filled && rating >= star - 0.75;
        const icon = filled ? 'star' : half ? 'star-half' : 'star-border';
        const content = (
          <MaterialIcons
            name={icon}
            size={size}
            color={filled || half ? colors.secondary : colors.outlineVariant}
          />
        );

        if (interactive && onChange) {
          return (
            <Pressable key={star} onPress={() => onChange(star)} hitSlop={6}>
              {content}
            </Pressable>
          );
        }

        return <View key={star}>{content}</View>;
      })}
      {showValue ? (
        <Text style={styles.value}>
          {rating > 0 ? rating.toFixed(1) : 'New'}
          {count !== undefined ? ` (${count})` : ''}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  value: { ...typography.labelMd, color: colors.onSurfaceVariant, marginLeft: spacing.unit2 },
});
