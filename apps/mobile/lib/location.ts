import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface UserLocationState {
  coords: Coordinates;
  isDefault: boolean;
  label: string;
  errorMsg?: string;
}

// Indore Bhawarkua Square (Default launch anchor)
export const DEFAULT_INDORE_COORDS: Coordinates = {
  latitude: 22.6886,
  longitude: 75.8676,
};

export const DEFAULT_LOCATION_LABEL = 'Bhawarkua, Indore (Default)';

/**
 * Calculates straight-line spherical distance between two coordinates in kilometers using Haversine formula
 */
export function calculateHaversineDistanceKm(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats distance with transparent origin labeling:
 * - If using default location: '~1.2 km from Bhawarkua'
 * - If using device GPS: '1.2 km away'
 */
export function formatDistanceLabel(
  distanceKm: number,
  isDefaultLocation: boolean
): string {
  const formattedNum = distanceKm < 1
    ? `${Math.round(distanceKm * 1000)} m`
    : `${distanceKm.toFixed(1)} km`;

  if (isDefaultLocation) {
    return `~${formattedNum} from Bhawarkua`;
  }
  return `${formattedNum} away`;
}

/**
 * Requests device location with automatic transparent fallback to Bhawarkua, Indore
 */
export async function getCurrentUserLocation(): Promise<UserLocationState> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        coords: DEFAULT_INDORE_COORDS,
        isDefault: true,
        label: DEFAULT_LOCATION_LABEL,
        errorMsg: 'Permission denied. Using default Indore location.',
      };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      coords: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      isDefault: false,
      label: 'Current Location',
    };
  } catch (err: any) {
    return {
      coords: DEFAULT_INDORE_COORDS,
      isDefault: true,
      label: DEFAULT_LOCATION_LABEL,
      errorMsg: err?.message || 'Could not fetch device location.',
    };
  }
}
