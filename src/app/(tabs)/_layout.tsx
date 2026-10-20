import { Redirect, Tabs } from 'expo-router';
import { Compass, Gift, Heart, ShoppingBag, UtensilsCrossed } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/queries/useCart';
import { colors, font, weight } from '@/theme';

export default function TabsLayout() {
  const { t } = useTranslation();
  const { status } = useAuth();
  const { data: cart } = useCart();
  const cartCount = (cart?.items ?? []).reduce((sum, item) => sum + item.qty, 0);
  // Sign-out and an expired session both land here: the tabs are for signed-in people only.
  if (status === 'signedOut') return <Redirect href="/(auth)/login" />;
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
      <Tabs.Screen name="campaigns" options={{ title: t('tabs.campaigns'), tabBarIcon: ({ color, size }) => <Gift color={color} size={size} /> }} />
    </Tabs>
  );
}
