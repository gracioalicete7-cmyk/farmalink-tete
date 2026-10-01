/**
 * Geolocation & Pharmacy Operation Helpers for Tete, Moçambique
 */

export const TETE_CENTER = {
  latitude: -16.1564,
  longitude: 33.5863,
  cidade: 'Cidade de Tete',
  provincia: 'Tete',
};

export const TETE_BAIRROS = [
  'Todos os Bairros',
  'Francisco Manyanga',
  'Matundo',
  'Chingodzi',
  'Degue',
  'Samora Machel',
  'Josina Machel',
  'Mphadue',
  'Filipe Samuel Magaia',
  'Chithatha',
  'Vila de Moatize',
  'Mutarara',
];

/**
 * Calculates distance between two coordinates in kilometers using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats distance into localized string (e.g., "750 m" or "2,4 km")
 */
export function formatDistance(distanceKm: number | null | undefined): string {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return '-- km';
  }
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1).replace('.', ',')} km`;
}

/**
 * Checks if a pharmacy is currently open based on operating hours string
 * Supported formats: "24 Horas", "08:00 - 20:00", "07:30 - 22:00"
 */
export function isPharmacyOpen(horarioStr?: string): boolean {
  if (!horarioStr) return true;
  const str = horarioStr.toLowerCase();
  if (str.includes('24') || str.includes('permanente') || str.includes('sempre')) {
    return true;
  }

  const match = horarioStr.match(/(\d{1,2}):(\d{2})\s*[-aà]\s*(\d{1,2}):(\d{2})/);
  if (!match) return true; // Default fallback to open if not parsable

  const startHour = parseInt(match[1], 10);
  const startMin = parseInt(match[2], 10);
  const endHour = parseInt(match[3], 10);
  const endMin = parseInt(match[4], 10);

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (endMinutes > startMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } else {
    // Overnight pharmacy (e.g. 18:00 to 06:00)
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
}

/**
 * Generates map direction URL for device
 */
export function getDirectionsUrl(lat: number, lng: number, label?: string): string {
  const encodedLabel = encodeURIComponent(label || 'Farmácia em Tete');
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodedLabel}`;
}

import { UserLocation } from '../types';

/**
 * Attempts to acquire real GPS location of the user or falls back gracefully to Tete Center
 */
export async function getCurrentUserLocation(): Promise<UserLocation> {
  return new Promise((resolve) => {
    // Default immediate fallback
    const defaultLocation: UserLocation = {
      latitude: TETE_CENTER.latitude,
      longitude: TETE_CENTER.longitude,
      bairro: 'Francisco Manyanga (Centro)',
      cidade: 'Cidade de Tete',
      timestamp: Date.now(),
    };

    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve(defaultLocation);
      return;
    }

    let resolved = false;
    const safetyTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(defaultLocation);
      }
    }, 2000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(safetyTimer);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        // Check if user is in/around Tete (approx bounds)
        const isNearTete = Math.abs(lat - TETE_CENTER.latitude) < 2 && Math.abs(lng - TETE_CENTER.longitude) < 2;

        resolve({
          latitude: isNearTete ? lat : TETE_CENTER.latitude,
          longitude: isNearTete ? lng : TETE_CENTER.longitude,
          bairro: isNearTete ? 'Tete (GPS Ativo)' : 'Francisco Manyanga (Centro)',
          cidade: 'Cidade de Tete',
          precisao: position.coords.accuracy,
          timestamp: Date.now(),
        });
      },
      () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(safetyTimer);
        resolve(defaultLocation);
      },
      { timeout: 2000, enableHighAccuracy: false, maximumAge: 60000 }
    );
  });
}
