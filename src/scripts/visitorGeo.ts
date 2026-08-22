export interface VisitorGeo {
  countryCode: string | null;
  latitude: number | null;
  longitude: number | null;
}

export type VisitorIdentityRegion = "latvia" | "russia" | "international";

const GEO_URL = "https://ipapi.co/json/";
const IDENTITY_REGION_KEY = "q888:identity-region";

let geoRequest: Promise<VisitorGeo> | null = null;

function nullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeCountryCode(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase() : null;
}

function identityRegionFromCountry(countryCode: string | null): VisitorIdentityRegion {
  if (countryCode === "LV") return "latvia";
  if (countryCode === "RU") return "russia";
  return "international";
}

function readRememberedIdentityRegion(): VisitorIdentityRegion | null {
  try {
    const value = window.sessionStorage.getItem(IDENTITY_REGION_KEY);
    return value === "latvia" || value === "russia" || value === "international"
      ? value
      : null;
  } catch {
    return null;
  }
}

function rememberIdentityRegion(region: VisitorIdentityRegion) {
  try {
    // CHOICE: remember only the name category for this tab, never the IP or coordinates.
    window.sessionStorage.setItem(IDENTITY_REGION_KEY, region);
  } catch {
    // Private browsing or storage restrictions should not block the portfolio.
  }
}

export function getVisitorGeo(): Promise<VisitorGeo> {
  if (geoRequest) return geoRequest;

  geoRequest = fetch(GEO_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`Visitor geography failed: ${response.status}`);
      return response.json();
    })
    .then((data) => ({
      countryCode: normalizeCountryCode(data?.country_code),
      latitude: nullableNumber(data?.latitude),
      longitude: nullableNumber(data?.longitude),
    }))
    .catch(() => ({ countryCode: null, latitude: null, longitude: null }));

  return geoRequest;
}

export async function getVisitorIdentityRegion(): Promise<VisitorIdentityRegion> {
  const rememberedRegion = readRememberedIdentityRegion();
  if (rememberedRegion) return rememberedRegion;

  const geo = await getVisitorGeo();
  const region = identityRegionFromCountry(geo.countryCode);
  if (geo.countryCode) rememberIdentityRegion(region);
  return region;
}
