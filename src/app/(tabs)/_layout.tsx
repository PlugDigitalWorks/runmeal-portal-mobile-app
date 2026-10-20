import { Redirect, Tabs } from 'expo-router';
import { Home } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

export default function TabsLayout() {
  const { t } = useTranslation();
  const { status } = useAuth();
  // Sign-out and an expired session both land here: the tabs are for signed-in people only.
  if (status === 'signedOut') return <Redirect href="/(auth)/login" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtle,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
    </Tabs>
  );
}
