/** Mirrors runmeal-brand-fe-website/src/types/product.ts (storefront contract). */
export type OptionGroupType = 'SINGLE' | 'MULTI' | 'VARIANT' | 'INGREDIENT';

export interface ProductOption {
  id: string;
  name: string;
  priceDelta: number;
  isDefault: boolean;
  sortOrder: number;
}

export interface OptionGroup {
  id: string;
  name: string;
  type: OptionGroupType;
  isRequired: boolean;
  minSelections?: number | null;
  maxSelections?: number | null;
  options: ProductOption[];
  sortOrder?: number;
}

/** GET /products/:id (carries the option groups the menu rows do not). */
export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number | string;
  discountedPrice?: number | string | null;
  imageUrl?: string | null;
  isActive: boolean;
  optionGroups?: OptionGroup[];
}

/** A product row inside GET /menu (as observed on staging). */
export interface MenuProduct {
  id: string;
  categoryId: string;
  brandId: string;
  name: string;
  description: string | null;
  tags?: string[] | null;
  price: number;
  discountedPrice: number | null;
  imageUrl: string | null;
  currency: string;
  currencySymbol: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  sortOrder?: number;
  products: MenuProduct[];
}

export interface Menu {
  branchId: string;
  brandId: string;
  currency: string;
  currencySymbol: string;
  categories: MenuCategory[];
}
