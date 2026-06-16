import * as Location from 'expo-location';

/** Reverse-geocodes the current position to a Norwegian postal code (postnummer). */
export async function lookupPostal(): Promise<{ postal: string; place?: string } | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null);
  if (!loc) return null;
  const res = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }).catch(() => []);
  const g = res[0];
  if (!g?.postalCode) return null;
  return { postal: g.postalCode, place: g.city ?? g.subregion ?? undefined };
}
