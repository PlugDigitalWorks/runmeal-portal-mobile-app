import { Heart } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet } from 'react-native';
import { FavoriteRow } from '@/components/FavoriteRow';
import { TabScreen } from '@/components/TabScreen';
import { useFavorites } from '@/queries/useFavorites';
import { colors, space } from '@/theme';
import { EmptyState } from '@/ui/EmptyState';

/** Restaurants the person hearted (stored on this device until the API has favourites). */
export default function Favorites() {
  const { t } = useTranslation();
  const { favorites, toggle } = useFavorites();
  return (
    <TabScreen title={t('favorites.title')}>
      <FlatList
        data={favorites}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <FavoriteRow branch={item} onRemove={() => toggle(item)} />}
        ListEmptyComponent={
          <EmptyState icon={<Heart size={32} color={colors.primarySoftForeground} />} title={t('favorites.emptyTitle')} body={t('favorites.emptyBody')} />
        }
      />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.md },
});
