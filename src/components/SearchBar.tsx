import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, space } from '@/theme';

/** Looks like a search field but is a button: the real input lives on the /search screen. */
export function SearchBar() {
  const { t } = useTranslation();
  return (
    <Pressable onPress={() => router.push('/search')} style={styles.bar} accessibilityRole="search" accessibilityLabel={t('home.searchPlaceholder')}>
      <Search size={18} color={colors.foreground} />
      <Text style={styles.placeholder} numberOfLines={1}>
        {t('home.searchPlaceholder')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 40,
    marginHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.full,
    backgroundColor: colors.searchFill,
  },
  placeholder: { flex: 1, fontSize: 14, color: colors.subtle },
});
