import { setUserCoords } from "./systemMetaState";
import { getVisitorGeo } from "./visitorGeo";

function formatCoords(lat: number, lon: number): string {
  const latStr = `${Math.abs(lat).toFixed(7)}${lat >= 0 ? "N" : "S"}`;
  const lonStr = `${Math.abs(lon).toFixed(7)}${lon >= 0 ? "E" : "W"}`;
  return `${latStr} ${lonStr}`;
}

export function initIpGeoCoords() {
  getVisitorGeo()
    .then((data) => {
      const lat = data.latitude;
      const lon = data.longitude;
      if (typeof lat === "number" && typeof lon === "number") {
        setUserCoords(formatCoords(lat, lon));
      } else {
        setUserCoords(null);
      }
    })
    .catch(() => setUserCoords(null));
}
