import { Tabs } from 'expo-router';
import { Compass, Gift, Heart, ShoppingBag, UtensilsCrossed } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { SHOW_MOCKS } from '@/config';
import { useCart } from '@/queries/useCart';
import { colors, font, weight } from '@/theme';

export default function TabsLayout() {
  const { t } = useTranslation();
  const { data: cart } = useCart();
  const cartCount = (cart?.items ?? []).reduce((sum, item) => sum + item.qty, 0);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.foreground,
        tabBarInactiveTintColor: colors.subtle,
        tabBarLabelStyle: { fontSize: font.caption, fontWeight: weight.semibold },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarBadgeStyle: { backgroundColor: colors.primary, color: colors.primaryForeground },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: ({ color, size }) => <Compass color={color} size={size} /> }} />
      <Tabs.Screen name="favorites" options={{ title: t('tabs.favorites'), tabBarIcon: ({ color, size }) => <Heart color={color} size={size} /> }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: t('tabs.cart'),
          // No badge at zero: an empty cart should look empty.
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="orders" options={{ title: t('tabs.orders'), tabBarIcon: ({ color, size }) => <UtensilsCrossed color={color} size={size} /> }} />
      <Tabs.Screen
        name="campaigns"
        // Every campaign is mock data: a store build without mocks has no Kampanyalar tab.
        options={{ title: t('tabs.campaigns'), href: SHOW_MOCKS ? undefined : null, tabBarIcon: ({ color, size }) => <Gift color={color} size={size} /> }}
      />
    </Tabs>
  );
}
