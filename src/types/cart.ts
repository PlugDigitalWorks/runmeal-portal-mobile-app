/** Mirrors brandfe's src/types/cart.ts (the parts the app reads). */
export interface CartItemOptionSelection {
  action: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
}

export interface CartItemOptionGroup {
  type: string;
  groupId: string;
  groupName: string;
  selections: CartItemOptionSelection[];
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string | null;
  /** Unit price including options. */
  price: number;
  note?: string | null;
  imgUrl: string | null;
  qty: number;
  options?: CartItemOptionGroup[];
  lineTotal?: number;
  finalLineTotal?: number;
}

/** A promotion on the cart; only internal coupons are applied from this app, so `type` is echoed back as sent. */
export interface AppliedPromotion {
  type: string;
  promotionCode: string;
  name?: string | null;
  creditValue?: number;
}

export interface Cart {
  id?: string;
  cartId?: string;
  brandId: string;
  branchId: string;
  totalCartPrice?: number;
  discountAmount?: number;
  finalPrice?: number;
  /** Every promotion currently on the cart (the single source of truth for the applied list). */
  appliedPromotions?: AppliedPromotion[];
  items?: CartItem[];
  isActive?: boolean;
  updatedAt?: string;
}

/** One option group as POST /carts/items expects it. */
export interface AddItemOption {
  groupId: string;
  optionId?: string;
  optionIds?: string[];
}

export interface AddItemDto {
  productId: string;
  qty: number;
  options?: AddItemOption[];
  note?: string;
  cartId?: string;
}
