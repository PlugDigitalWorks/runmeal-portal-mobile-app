import { useQueryClient } from '@tanstack/react-query';
import { LocateFixed } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { apiErrorMessage } from '@/lib/api-error';
import { addressCoordinates, addressFirstLine, normalizePhone } from '@/lib/address';
import { geocodeText, getUserLocation, reverseGeocode, type Coordinates } from '@/lib/location';
import { qk } from '@/queries/keys';
import { useAddresses } from '@/queries/useAddresses';
import { createAddress, setActiveAddress, updateAddress } from '@/services/address.service';
import { colors, font, radius, space } from '@/theme';
import type { Address } from '@/types/address';
import { Button } from '@/ui/Button';
import { Skeleton } from '@/ui/Skeleton';
import { TextField } from '@/ui/TextField';

type Region = { countryCode: string; province: string; district: string };
type Located = { point: Coordinates; region: Region };
type FieldErrors = { line?: string; postalCode?: string; phone?: string };

/** The market this app launches in, used only when the phone's geocoder names no country. */
const DEFAULT_COUNTRY = 'TR';
/** Where the house number comes before the street, as brandfe's composeFirstLine. */
const NUMBER_FIRST = new Set(['GB', 'US', 'CA', 'AU', 'NZ', 'IE']);

function composeFirstLine(street: string, number: string, country: string): string {
  if (!number) return street;
  if (!street) return number;
  if (NUMBER_FIRST.has(country)) return `${number} ${street}`;
  if (country === 'TR') return `${street} No: ${number}`;
  return `${street} ${number}`;
}

const longEnough = (value?: string | null) => (value && value.trim().length >= 2 ? value.trim() : null);

type Props = {
  /** Edits this address when given, adds a new one otherwise. */
  id?: string;
  /** Runs once the address is saved and the lists are refreshed. */
  onSaved: () => void;
};

/**
 * brandfe's single-line address form: the first line, postcode and phone. The API also
 * wants coordinates, a city and an area, which come from the phone's location or from
 * geocoding what was typed. Shared by the address screen and the first-run onboarding.
 */
export function AddressForm({ id, onSaved }: Props) {
  const { t } = useTranslation();
  const { data: addresses } = useAddresses();
  const existing = id ? addresses?.find((a) => a.id === id) : undefined;

  if (id && !existing) {
    // Edit mode needs the address from the list; once the list is in and lacks it (deleted elsewhere) there is nothing to save to.
    return addresses ? (
      <Text style={styles.error}>{t('addresses.loadFailed')}</Text>
    ) : (
      <View style={styles.form}>
        <Skeleton height={52} radius={radius.md} />
        <Skeleton height={48} radius={radius.md} />
        <Skeleton height={48} radius={radius.md} />
      </View>
    );
  }
  return <AddressFields existing={existing} isFirst={addresses?.length === 0} onSaved={onSaved} />;
}

type FieldsProps = { existing?: Address; isFirst: boolean; onSaved: () => void };

function AddressFields({ existing, isFirst, onSaved }: FieldsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const id = existing?.id;

  const [line, setLine] = useState(() => (existing ? addressFirstLine(existing) : ''));
  const [postalCode, setPostalCode] = useState(existing?.postalCode ?? '');
  const [phone, setPhone] = useState(existing?.phoneE164 ?? '');
  // Kept only while they still describe what is typed; any edit sends the address to geocoding again.
  const [located, setLocated] = useState<Located | null>(() => {
    const point = existing ? addressCoordinates(existing) : null;
    return existing && point ? { point, region: { countryCode: existing.countryCode, province: existing.province, district: existing.district } } : null;
  });
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);

  const edit = (field: keyof FieldErrors, setter: (value: string) => void, keepLocation = false) => (value: string) => {
    setError(null);
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    if (!keepLocation) setLocated(null);
    setter(value);
  };

  const useMyLocation = async () => {
    setError(null);
    setLocating(true);
    try {
      const point = await getUserLocation();
      if (!point) return setError(t('addresses.locationDenied'));
      const place = await reverseGeocode(point);
      if (!place.province || !place.district) return setError(t('addresses.locationFailed'));
      const countryCode = place.countryCode ?? DEFAULT_COUNTRY;
      setLine(composeFirstLine(place.street ?? '', place.buildingNumber ?? '', countryCode));
      setPostalCode(place.postalCode ?? '');
      setFieldErrors({});
      setLocated({ point, region: { countryCode, province: place.province, district: place.district } });
    } finally {
      setLocating(false);
    }
  };

  /** Coordinates and region for what is typed: from location or the address it was loaded with, else geocoding. */
  const locate = async (): Promise<Located | null> => {
    if (located) return located;
    const point = await geocodeText(`${line.trim()}, ${postalCode.trim()}`);
    if (!point) return null;
    const place = await reverseGeocode(point);
    if (!place.province || !place.district) return null;
    return { point, region: { countryCode: place.countryCode ?? DEFAULT_COUNTRY, province: place.province, district: place.district } };
  };

  const save = async () => {
    const phoneE164 = normalizePhone(phone);
    const errors: FieldErrors = {
      line: longEnough(line) ? undefined : t('addresses.lineRequired'),
      postalCode: postalCode.trim() ? undefined : t('addresses.postalCodeRequired'),
      phone: phoneE164 ? undefined : t('addresses.phoneInvalid'),
    };
    setFieldErrors(errors);
    if (!phoneE164 || errors.line || errors.postalCode) return;

    setBusy(true);
    setError(null);
    try {
      const place = await locate();
      if (!place) return setError(t('addresses.notFound'));
      const input = {
        countryCode: place.region.countryCode,
        province: place.region.province,
        district: place.region.district,
        street: line.trim(),
        postalCode: postalCode.trim(),
        phoneE164,
        latitude: place.point.latitude,
        longitude: place.point.longitude,
        // The whole first line is in `street`; null clears an older separate house or flat number.
        buildingNumber: null,
        apartmentNumber: null,
      };
      if (id) {
        await updateAddress(id, input);
      } else {
        const created = await createAddress(input);
        if (isFirst) {
          // The first address becomes the delivery address. If activating fails the address still
          // exists and the context falls back to it, so a retry must not create a duplicate.
          await setActiveAddress(created.id).catch(() => {});
        }
      }
      await Promise.all([queryClient.invalidateQueries({ queryKey: qk.addresses }), queryClient.invalidateQueries({ queryKey: ['nearby'] })]);
      onSaved();
    } catch (e) {
      setError(apiErrorMessage(e, t('addresses.failed')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.form}>
      <Button
        variant="secondary"
        title={t('addresses.useLocation')}
        icon={<LocateFixed size={18} color={colors.primary} />}
        onPress={useMyLocation}
        loading={locating}
      />
      <TextField
        label={t('addresses.line')}
        value={line}
        onChangeText={edit('line', setLine)}
        placeholder={t('addresses.linePlaceholder')}
        autoComplete="street-address"
        error={fieldErrors.line}
      />
      <TextField
        label={t('addresses.postalCode')}
        value={postalCode}
        onChangeText={edit('postalCode', setPostalCode)}
        autoCapitalize="characters"
        autoComplete="postal-code"
        error={fieldErrors.postalCode}
      />
      <TextField
        label={t('addresses.phone')}
        value={phone}
        // The phone is not part of the geocoded address, so changing it keeps the coordinates.
        onChangeText={edit('phone', setPhone, true)}
        placeholder={t('addresses.phonePlaceholder')}
        keyboardType="phone-pad"
        autoComplete="tel"
        error={fieldErrors.phone}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title={t('addresses.save')} loading={busy} onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.md },
  error: { color: colors.destructive, fontSize: font.body },
});
