import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/lib/theme';

type CollapsibleSectionProps = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function CollapsibleSection({ title, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={styles.wrap}>
      <Pressable
        style={styles.head}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}>
        <Text style={styles.title}>{title}</Text>
        <MaterialIcons
          name={open ? 'expand-less' : 'expand-more'}
          size={24}
          color={colors.iconMuted}
        />
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.unit4,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.unit4,
  },
  title: { ...typography.labelLg, color: colors.primary, fontWeight: '700' },
  body: { paddingHorizontal: spacing.unit4, paddingBottom: spacing.unit4 },
});
