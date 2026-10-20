import * as Location from 'expo-location';
import { Platform } from 'react-native';
import type { CreateAddressInput } from '@/types/address';

export type Coordinates = { latitude: number; longitude: number };

/**
 * Asks for "while using" location and reads it; null when denied or unavailable.
 * When the phone's location is off, Android offers its own "turn on" dialog;
 * iOS has none, so the caller offers Settings instead.
 */
export async function getUserLocation(): Promise<Coordinates | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    if (!(await Location.hasServicesEnabledAsync())) {
      if (Platform.OS !== 'android') return null;
      await Location.enableNetworkProviderAsync();
    }
    const position =
      (await Location.getLastKnownPositionAsync()) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return position ? { latitude: position.coords.latitude, longitude: position.coords.longitude } : null;
  } catch {
    return null;
  }
}

/** Whether asking again can still show the system prompt, or only Settings can turn location on. */
export async function canAskForLocation(): Promise<boolean> {
  try {
    const permission = await Location.getForegroundPermissionsAsync();
    return permission.status !== 'denied' || permission.canAskAgain;
  } catch {
    return false;
  }
}

const longEnough = (value?: string | null) => (value && value.trim().length >= 2 ? value.trim() : null);

/**
 * Turns a point into address fields. The API wants a city and an area, which the
 * platforms fill differently, so each falls back through the neighbouring fields.
 * Only the point comes back when geocoding finds nothing or fails.
 */
export async function reverseGeocode(coords: Coordinates): Promise<Partial<CreateAddressInput>> {
  const point = { latitude: coords.latitude, longitude: coords.longitude };
  try {
    const [place] = await Location.reverseGeocodeAsync(point);
    if (!place) return point;
    const province = longEnough(place.region) ?? longEnough(place.city) ?? longEnough(place.subregion);
    const district = longEnough(place.district) ?? longEnough(place.subregion) ?? longEnough(place.city) ?? province;
    return {
      ...point,
      street: place.street ?? undefined,
      buildingNumber: place.streetNumber ?? undefined,
      district: district ?? undefined,
      province: province ?? undefined,
      postalCode: place.postalCode ?? undefined,
      countryCode: place.isoCountryCode ?? undefined,
    };
  } catch {
    return point;
  }
}

/** Coordinates for a typed address line and postcode; null when nothing matches. */
export async function geocodeText(text: string): Promise<Coordinates | null> {
  try {
    const [match] = await Location.geocodeAsync(text);
    return match ? { latitude: match.latitude, longitude: match.longitude } : null;
  } catch {
    return null;
  }
}
