import { clearFavorites } from './favorites';
import { clearPendingPayment } from './pending-payment';
import { clearRecent } from './recent-searches';

/**
 * Forgets what this device keeps for the signed-in account, so a new account on the same email
 * starts empty. The device id and the app language belong to the device and stay.
 */
export async function clearUserData(): Promise<void> {
  clearPendingPayment();
  await Promise.all([clearFavorites(), clearRecent()]).catch(() => undefined);
}
