/** Mirrors brandfe's order and payment service types. */
export type PaymentMethod = 'ONLINE_CARD' | 'CASH' | 'CARD_ON_DELIVERY';
export type OrderType = 'DELIVERY' | 'SCHEDULED_DELIVERY' | 'PICKUP' | 'SCHEDULED_PICKUP';
export type ScheduledOrderType = 'SCHEDULED_DELIVERY' | 'SCHEDULED_PICKUP';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';

export interface PaymentInitializationResponse {
  paymentId: string;
  orderId?: string;
  orderNumber?: number;
  /** iyzico: an HTML form to render. */
  checkoutFormContent?: string;
  /** Stripe, PayTR, Dojo: a hosted page to open. */
  paymentUrl?: string;
}

export interface InitializePaymentInput {
  cartId: string;
  branchId: string;
  paymentMethod: PaymentMethod;
  orderType: OrderType;
  scheduledFor?: string;
  /** Runmeal credit to spend on this order; 0 or absent spends none. */
  creditUsedAmount?: number;
  note?: string;
}

export interface FulfillmentSlot {
  label: string;
  /** Opaque backend value; never parse it. */
  value: string;
}

export interface FulfillmentSlotsResponse {
  orderType: ScheduledOrderType;
  available: boolean;
  dates: { date: string; slots: FulfillmentSlot[] }[];
}

export interface BranchAvailability {
  canAcceptOrders: boolean;
  reason: string | null;
}

export interface OrderItemOptionGroup {
  groupName: string;
  selections: { optionName: string }[];
}

export interface OrderItem {
  id: string;
  productName: string;
  quantity?: number;
  qty?: number;
  unitPrice?: number | string;
  price?: number | string;
  totalPrice?: number | string;
  lineTotal?: number | string | null;
  finalLineTotal?: number | string | null;
  options?: OrderItemOptionGroup[] | null;
  note?: string | null;
}

export interface Order {
  id: string;
  orderNumber: number;
  createdAt: string;
  brandId: string;
  branchId: string;
  cartId: string;
  totalPrice: string;
  status: string;
  orderType?: string;
  paymentMethod?: string;
  currency?: string;
  /** The API's symbol for `currency` ("₺"); the lists carry it too. */
  currencySymbol?: string;
  scheduledFor?: string | null;
  discountAmount?: number | string | null;
  /** Runmeal credit spent on the order. */
  creditUsedAmount?: number | string | null;
  note?: string | null;
  addressText?: string;
}

export interface OrderDetails extends Order {
  items: OrderItem[];
}

export interface PaymentRecord {
  id: string;
  status: string;
  orderId: string | null;
  branchId: string | null;
  brandId: string | null;
}
