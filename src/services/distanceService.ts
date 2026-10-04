/**
 * Accurate Haversine Distance Calculation & Commute Estimator for RentPH
 */

export interface CommuteEstimate {
  distanceKm: number;
  walkingMinutes: number;
  drivingMinutes: number;
  formattedDistance: string;
  formattedWalking: string;
  formattedDriving: string;
}

export class DistanceService {
  /**
   * Calculates geodesic distance between two latitude/longitude points in kilometers.
   */
  public static calculateHaversineKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return Number(d.toFixed(2));
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Generates realistic student walking and commute times.
   * Average urban pedestrian speed: 4.8 km/h.
   * Average Manila jeepney/tricycle/car speed: 20 km/h (with stops).
   */
  public static estimateCommute(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): CommuteEstimate {
    const distanceKm = this.calculateHaversineKm(lat1, lon1, lat2, lon2);
    const walkingMinutes = Math.max(1, Math.round((distanceKm / 4.8) * 60));
    const drivingMinutes = Math.max(2, Math.round((distanceKm / 20) * 60));

    return {
      distanceKm,
      walkingMinutes,
      drivingMinutes,
      formattedDistance: distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm} km`,
      formattedWalking: `${walkingMinutes} min walk`,
      formattedDriving: `${drivingMinutes} min ride`,
    };
  }
}
