import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loadFavorites, toggleFavorite, type FavoriteBranch } from '@/lib/favorites';

const KEY = ['favorites'] as const;

/** Favourite branches saved on this device; the cache is the source of truth after the first read. */
export function useFavorites() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: KEY, queryFn: loadFavorites, staleTime: Infinity });
  const mutation = useMutation({
    mutationFn: toggleFavorite,
    onSuccess: (next) => queryClient.setQueryData(KEY, next),
  });
  const favorites = data ?? [];
  return {
    favorites,
    isFavorite: (id: string) => favorites.some((f) => f.id === id),
    toggle: (branch: FavoriteBranch) => mutation.mutate(branch),
  };
}
