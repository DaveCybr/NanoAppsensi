/**
 * GPS Utilities for Attendance System
 * Radius bumi = 6371000 meter
 */

/**
 * Menghitung jarak antara dua titik koordinat menggunakan Haversine Formula.
 * Return jarak dalam satuan meter.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Radius bumi dalam meter
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance)
}

/**
 * Mengecek apakah koordinat karyawan berada dalam radius lokasi kantor.
 */
export function isWithinRadius(
  empLat: number,
  empLon: number,
  officeLat: number,
  officeLon: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(empLat, empLon, officeLat, officeLon)
  return distance <= radiusMeters
}
