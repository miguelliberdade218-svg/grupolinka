import { getDistance as geolibDistance } from "geolib";

export function getDistance(
  lat1: number,
  lng1: number,
  lat2: number | null,
  lng2: number | null
): number {
  if (lat2 === null || lng2 === null) return Infinity;
  return geolibDistance(
    { latitude: lat1, longitude: lng1 },
    { latitude: lat2, longitude: lng2 }
  ) / 1000; // retorna em KM
}