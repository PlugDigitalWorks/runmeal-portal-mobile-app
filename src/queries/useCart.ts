import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import i18n from '@/i18n';
import { useAuth } from '@/context/AuthContext';
import {
  addCartItem,
  applyPromotion,
  clearCart,
  cartIdOf,
  getCurrentCart,
  removeCartItem,
  removePromotion,
  setCartItemQty,
  type CartScope,
} from '@/services/cart.service';
import type { AddItemDto } from '@/types/cart';
import type { BranchDetail } from '@/types/branch';
import type { OrderType } from '@/types/order';
import { qk } from './keys';

/** The one active cart of the marketplace (null when empty); only fetched once the person is signed in. */
export function useCart() {
  const { status } = useAuth();
  return useQuery({ queryKey: qk.cart, queryFn: getCurrentCart, enabled: status === 'signedIn' });
}

/** Asks whether to drop the current cart for a different restaurant; dismissing the alert counts as no. */
function confirmSwitch(branchName: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      i18n.t('cart.switchTitle'),
      i18n.t('cart.switchBody', { name: branchName }),
      [
        { text: i18n.t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
        { text: i18n.t('cart.switchConfirm'), style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

type AddInput = { dto: AddItemDto; branchId: string; brandId: string };

/**
 * Adds a line to the cart. There is one cart across the marketplace, so adding from another
 * branch first asks to empty the current one; 'cancelled' means the person said no and nothing changed.
 */
export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dto, branchId, brandId }: AddInput): Promise<'added' | 'cancelled'> => {
      // Always read the server's cart: another device may have changed it since the last fetch.
      const current = await queryClient.fetchQuery({ queryKey: qk.cart, queryFn: getCurrentCart });
      const currentId = cartIdOf(current);
      if (current && currentId && current.branchId !== branchId && (current.items?.length ?? 0) > 0) {
        const name = queryClient.getQueryData<BranchDetail>(qk.branch(current.branchId))?.name ?? i18n.t('cart.otherRestaurant');
        if (!(await confirmSwitch(name))) return 'cancelled';
        await clearCart(currentId, { branchId: current.branchId, brandId: current.brandId });
      }
      await addCartItem(dto, { branchId, brandId });
      return 'added';
    },
    // Also after a cancel: the fetch above may have shown a newer cart than the cached one.
    onSettled: () => queryClient.invalidateQueries({ queryKey: qk.cart }),
  });
}

/** Every cart edit ends the same way: the cart is re-read so lines and totals come from the server. */
function useCartMutation<TVars>(mutationFn: (vars: TVars) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSettled: () => queryClient.invalidateQueries({ queryKey: qk.cart }) });
}

export const useUpdateCartLine = () => useCartMutation(({ itemId, qty, scope }: { itemId: string; qty: number; scope: CartScope }) => setCartItemQty(itemId, qty, scope));

export const useRemoveCartLine = () => useCartMutation(({ itemId, scope }: { itemId: string; scope: CartScope }) => removeCartItem(itemId, scope));

export const useApplyPromotion = () =>
  useCartMutation(({ cartId, promotionCode, orderType = 'DELIVERY', scope }: { cartId: string; promotionCode: string; orderType?: OrderType; scope: CartScope }) =>
    applyPromotion(cartId, { promotionCode, orderType }, scope),
  );

export const useRemovePromotion = () =>
  useCartMutation(({ cartId, promotionCode, scope }: { cartId: string; promotionCode?: string; scope: CartScope }) => removePromotion(cartId, scope, promotionCode));
