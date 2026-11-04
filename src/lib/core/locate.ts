// The visitor's location, asked for only when they tap "Use my location" (Q4). The fix is
// kept in memory by the caller and never stored or put in a URL. Options as README:281.
import type { Point } from './geo.ts';

export function locate(): Promise<Point> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('no geolocation'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) => reject(error),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
  });
}
