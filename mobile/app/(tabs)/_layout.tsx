import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

import { colors, typography } from '@/lib/theme';

function TabIcon({
  name,
  focused,
}: {
  name: keyof typeof MaterialIcons.glyphMap;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <MaterialIcons
        name={name}
        size={24}
        color={focused ? colors.onSecondary : colors.iconMuted}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.iconMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        ...(Platform.OS === 'web'
          ? { tabBarPressColor: colors.surfaceContainerLow }
          : {}),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ focused }) => <TabIcon name="category" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          href: null,
          title: 'Orders',
          tabBarIcon: ({ focused }) => <TabIcon name="receipt-long" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="professionals"
        options={{
          title: 'Pros',
          tabBarIcon: ({ focused }) => <TabIcon name="engineering" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 90 : 74,
    paddingTop: 6,
    backgroundColor: colors.surface,
    borderTopColor: colors.outlineVariant,
    borderTopWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 -4px 16px rgba(0, 10, 30, 0.10)',
      },
      default: {
        elevation: 12,
        shadowColor: '#000a1e',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
      },
    }),
  },
  tabLabel: {
    ...typography.labelMd,
    fontWeight: '600',
    marginTop: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    minWidth: 56,
    borderRadius: 16,
  },
  iconContainerActive: {
    backgroundColor: colors.secondary,
  },
});
