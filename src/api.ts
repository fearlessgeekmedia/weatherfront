import type { LatLon } from "./types";

const NWS_USER_AGENT = "(weatherfront, fearlessgeek@github.com)";

export async function detectCoordinates(): Promise<LatLon> {
  const response = await fetch("https://ipinfo.io/json", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`ipinfo.io failed: ${response.status}`);
  }
  const data = (await response.json()) as { loc?: string };
  if (!data.loc) {
    throw new Error("Could not detect location");
  }
  const parts = data.loc.split(",");
  const lat = Number(parts[0]);
  const lon = Number(parts[1] ?? "0");
  return { lat, lon };
}

export interface NwsPoint {
  properties: {
    relativeLocation: {
      properties: {
        city: string;
        state: string;
      };
    };
    forecast: string;
    forecastGridData: string;
    radarStation?: string;
  };
}

export async function fetchNwsPoint(lat: number, lon: number): Promise<NwsPoint> {
  const response = await fetch(
    `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
    {
      headers: {
        "User-Agent": NWS_USER_AGENT,
        Accept: "application/json",
      },
    },
  );
  if (!response.ok) {
    throw new Error(`NWS points failed: ${response.status}`);
  }
  return (await response.json()) as NwsPoint;
}

export interface ForecastPeriod {
  name: string;
  temperature: number;
  temperatureUnit: string;
  shortForecast: string;
  detailedForecast: string;
  isDaytime?: boolean;
}

export interface NwsForecast {
  properties: {
    periods: ForecastPeriod[];
  };
}

export async function fetchNwsForecast(url: string): Promise<ForecastPeriod[]> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": NWS_USER_AGENT,
      Accept: "application/geo+json",
    },
  });
  if (!response.ok) {
    throw new Error(`NWS forecast failed: ${response.status}`);
  }
  const data = (await response.json()) as NwsForecast;
  return data.properties.periods;
}

export interface CurrentConditions {
  temperatureF: number | null;
  humidity: number | null;
  windSpeedMph: number | null;
  windDirection: string | null;
  weather: string;
  isDaytime?: boolean;
}

export async function fetchCurrentConditions(gridDataUrl: string, lat: number, lon: number): Promise<CurrentConditions> {
  const response = await fetch(gridDataUrl, {
    headers: {
      "User-Agent": NWS_USER_AGENT,
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`NWS grid data failed: ${response.status}`);
  }
  const data = await response.json();
  const now = new Date();
  const timeStr = now.toISOString().slice(0, 13);

  const values = data.properties?.temperature?.values ?? [];
  const reversed = [...values].reverse();
  const tempEntry = reversed.find((v: { validTime: string }) => v.validTime.startsWith(timeStr)) ?? values.at(-1);
  const tempC = tempEntry?.value ?? null;
  const tempF = tempC !== null && tempC !== undefined ? Math.round((tempC * 9) / 5 + 32) : null;

  const windEntry = data.properties?.windSpeed?.values?.at(-1) as { value: number } | undefined;
  const windSpeedMs = windEntry?.value ?? null;
  const windSpeedMph =
    windSpeedMs !== null && windSpeedMs !== undefined ? Math.round(windSpeedMs * 2.237) : null;

  const dirEntry = data.properties?.windDirection?.values?.at(-1) as { value: number } | undefined;
  const windDeg = dirEntry?.value ?? null;

  const humidityEntry = data.properties?.relativeHumidity?.values?.at(-1) as { value: number } | undefined;
  const humidity = humidityEntry?.value ?? null;

  const weatherValues = data.properties?.weather?.values ?? [];
  const utcHour = now.getUTCHours();
  const localHour = ((utcHour + Math.round(lon / 15)) % 24 + 24) % 24;
  const localHourStr = String(localHour).padStart(2, "0");
  const weatherEntry =
    weatherValues.find((v: { validTime: string }) => v.validTime.includes(`T${localHourStr}:`)) ??
    weatherValues.find((v: { validTime: string }) => v.validTime.startsWith(timeStr)) ??
    weatherValues.at(-1);
  const weather = weatherEntry?.weather ?? "Clear";

  return {
    temperatureF: tempF,
    humidity,
    windSpeedMph,
    windDirection: windDeg !== null ? degreesToCompass(windDeg) : null,
    weather,
    isDaytime: localHour >= 6 && localHour < 20,
  };
}

function degreesToCompass(deg: number): string {
  if (!Number.isFinite(deg)) return "N";
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const idx = Math.floor(((deg + 11.25) % 360) / 22.5);
  return dirs[idx] ?? "N";
}

export interface RadarInfo {
  station: string;
  url: string;
}

export function getNearestRadar(lat: number, lon: number): RadarInfo {
  const radars: { id: string; lat: number; lon: number }[] = [
    { id: "KABR", lat: 45.456, lon: -98.413 },
    { id: "KABX", lat: 35.15, lon: -106.824 },
    { id: "KAKQ", lat: 36.984, lon: -77.008 },
    { id: "KAMX", lat: 25.611, lon: -80.413 },
    { id: "KAPX", lat: 44.907, lon: -84.72 },
    { id: "KARX", lat: 43.823, lon: -91.191 },
    { id: "KATX", lat: 48.195, lon: -122.496 },
    { id: "KBGM", lat: 42.2, lon: -75.985 },
    { id: "KBIS", lat: 46.771, lon: -100.76 },
    { id: "KBMX", lat: 33.172, lon: -86.77 },
    { id: "KBOX", lat: 41.956, lon: -71.137 },
    { id: "KBRO", lat: 25.916, lon: -97.419 },
    { id: "KBUF", lat: 42.949, lon: -78.737 },
    { id: "KCAE", lat: 33.949, lon: -81.118 },
    { id: "KCBW", lat: 46.039, lon: -67.806 },
    { id: "KCBX", lat: 43.49, lon: -116.236 },
    { id: "KCCX", lat: 40.923, lon: -78.004 },
    { id: "KCLE", lat: 41.413, lon: -81.86 },
    { id: "KCLX", lat: 32.655, lon: -81.042 },
    { id: "KCRI", lat: 35.238, lon: -97.46 },
    { id: "KCRP", lat: 27.784, lon: -97.511 },
    { id: "KCYS", lat: 41.152, lon: -104.806 },
    { id: "KDAX", lat: 38.501, lon: -121.678 },
    { id: "KDDC", lat: 37.761, lon: -99.969 },
    { id: "KDGX", lat: 32.28, lon: -89.985 },
    { id: "KDIX", lat: 39.947, lon: -74.411 },
    { id: "KDLH", lat: 46.837, lon: -92.21 },
    { id: "KDMX", lat: 41.731, lon: -93.723 },
    { id: "KDOX", lat: 38.826, lon: -75.44 },
    { id: "KDTX", lat: 42.7, lon: -83.472 },
    { id: "KDVN", lat: 41.612, lon: -90.581 },
    { id: "KEAX", lat: 38.81, lon: -94.264 },
    { id: "KEMX", lat: 31.894, lon: -110.63 },
    { id: "KENX", lat: 42.586, lon: -74.064 },
    { id: "KEOX", lat: 31.46, lon: -85.459 },
    { id: "KEPZ", lat: 31.873, lon: -106.698 },
    { id: "KESX", lat: 35.701, lon: -114.891 },
    { id: "KEVX", lat: 30.565, lon: -85.922 },
    { id: "KEWX", lat: 29.704, lon: -98.029 },
    { id: "KFDR", lat: 34.362, lon: -98.976 },
    { id: "KFDX", lat: 34.634, lon: -103.618 },
    { id: "KFFC", lat: 33.363, lon: -84.566 },
    { id: "KFSD", lat: 43.588, lon: -96.729 },
    { id: "KFSX", lat: 34.574, lon: -111.198 },
    { id: "KFTG", lat: 39.786, lon: -104.546 },
    { id: "KFWS", lat: 32.573, lon: -97.303 },
    { id: "KGGW", lat: 48.206, lon: -106.625 },
    { id: "KGJX", lat: 39.062, lon: -108.214 },
    { id: "KGLD", lat: 39.367, lon: -101.7 },
    { id: "KGRB", lat: 44.499, lon: -88.111 },
    { id: "KGRK", lat: 30.722, lon: -97.383 },
    { id: "KGRR", lat: 42.894, lon: -85.545 },
    { id: "KGSP", lat: 34.883, lon: -82.22 },
    { id: "KGWX", lat: 33.897, lon: -88.329 },
    { id: "KGYX", lat: 43.891, lon: -70.256 },
    { id: "KHDX", lat: 33.077, lon: -106.12 },
    { id: "KHGX", lat: 29.472, lon: -95.079 },
    { id: "KHNX", lat: 36.314, lon: -119.632 },
    { id: "KHPX", lat: 36.737, lon: -87.285 },
    { id: "KHTX", lat: 34.931, lon: -86.084 },
    { id: "KICT", lat: 37.654, lon: -97.443 },
    { id: "KICX", lat: 37.591, lon: -112.862 },
    { id: "KILN", lat: 39.42, lon: -83.822 },
    { id: "KILX", lat: 40.15, lon: -89.337 },
    { id: "KIND", lat: 39.708, lon: -86.28 },
    { id: "KINX", lat: 36.175, lon: -95.564 },
    { id: "KIWA", lat: 33.289, lon: -111.67 },
    { id: "KIWX", lat: 41.359, lon: -85.7 },
    { id: "KJAN", lat: 32.321, lon: -90.078 },
    { id: "KJAX", lat: 30.485, lon: -81.702 },
    { id: "KJGX", lat: 32.675, lon: -83.351 },
    { id: "KJKL", lat: 37.591, lon: -83.313 },
    { id: "KLBB", lat: 33.654, lon: -101.814 },
    { id: "KLCH", lat: 30.125, lon: -93.216 },
    { id: "KLGX", lat: 47.117, lon: -124.107 },
    { id: "KLIX", lat: 30.337, lon: -89.825 },
    { id: "KLNX", lat: 41.958, lon: -100.576 },
    { id: "KLOT", lat: 41.604, lon: -88.085 },
    { id: "KLRX", lat: 40.74, lon: -116.803 },
    { id: "KLSX", lat: 38.699, lon: -90.683 },
    { id: "KLTX", lat: 33.989, lon: -78.429 },
    { id: "KLVX", lat: 37.975, lon: -85.944 },
    { id: "KLWX", lat: 38.976, lon: -77.478 },
    { id: "KLZK", lat: 34.836, lon: -92.262 },
    { id: "KMAF", lat: 31.943, lon: -102.189 },
    { id: "KMAX", lat: 42.081, lon: -122.717 },
    { id: "KMBX", lat: 48.393, lon: -100.865 },
    { id: "KMHX", lat: 34.776, lon: -76.876 },
    { id: "KMKX", lat: 42.968, lon: -88.551 },
    { id: "KMLB", lat: 28.113, lon: -80.654 },
    { id: "KMOB", lat: 30.679, lon: -88.24 },
    { id: "KMPX", lat: 44.849, lon: -93.565 },
    { id: "KMQT", lat: 46.531, lon: -87.548 },
    { id: "KMRX", lat: 36.168, lon: -83.402 },
    { id: "KMSX", lat: 47.041, lon: -113.986 },
    { id: "KMTX", lat: 41.263, lon: -112.448 },
    { id: "KMUX", lat: 37.155, lon: -121.898 },
    { id: "KMVX", lat: 47.528, lon: -97.325 },
    { id: "KNKX", lat: 32.919, lon: -117.042 },
    { id: "KNQA", lat: 35.345, lon: -89.873 },
    { id: "KOAX", lat: 41.32, lon: -96.367 },
    { id: "KOHX", lat: 36.247, lon: -86.563 },
    { id: "KOKC", lat: 35.238, lon: -97.46 },
    { id: "KOKX", lat: 40.866, lon: -72.864 },
    { id: "KOTX", lat: 47.68, lon: -117.627 },
    { id: "KPAH", lat: 37.068, lon: -88.772 },
    { id: "KPBZ", lat: 40.532, lon: -80.218 },
    { id: "KPDT", lat: 45.691, lon: -118.853 },
    { id: "KPOE", lat: 31.155, lon: -92.976 },
    { id: "KPUX", lat: 38.46, lon: -104.181 },
    { id: "KRAX", lat: 35.665, lon: -78.49 },
    { id: "KRGX", lat: 39.754, lon: -119.462 },
    { id: "KRIW", lat: 43.066, lon: -108.477 },
    { id: "KRLX", lat: 38.311, lon: -81.723 },
    { id: "KRTX", lat: 45.715, lon: -122.964 },
    { id: "KSFX", lat: 43.106, lon: -112.686 },
    { id: "KSGF", lat: 37.235, lon: -93.401 },
    { id: "KSHV", lat: 32.451, lon: -93.841 },
    { id: "KSJT", lat: 31.371, lon: -100.492 },
    { id: "KSOX", lat: 33.818, lon: -117.636 },
    { id: "KSRX", lat: 35.29, lon: -94.362 },
    { id: "KTBW", lat: 27.705, lon: -82.402 },
    { id: "KTFX", lat: 47.46, lon: -111.385 },
    { id: "KTLH", lat: 30.398, lon: -84.329 },
    { id: "KTLX", lat: 35.333, lon: -97.278 },
    { id: "KTWX", lat: 39.002, lon: -95.89 },
    { id: "KTYX", lat: 43.756, lon: -75.68 },
    { id: "KUDX", lat: 44.125, lon: -102.83 },
    { id: "KUEX", lat: 40.321, lon: -98.442 },
    { id: "KVAX", lat: 30.89, lon: -83.002 },
    { id: "KVBX", lat: 34.839, lon: -119.179 },
    { id: "KVNX", lat: 36.741, lon: -98.128 },
    { id: "KVTX", lat: 34.412, lon: -119.179 },
    { id: "KVWX", lat: 38.26, lon: -87.724 },
    { id: "KYUX", lat: 32.495, lon: -114.656 },
    { id: "TJUA", lat: 18.115, lon: -66.078 },
  ];

  let nearest: { id: string; lat: number; lon: number } = radars[0]!;
  let minDist = haversine(lat, lon, nearest.lat, nearest.lon);

  for (let i = 1; i < radars.length; i++) {
    const r = radars[i]!;
    const d = haversine(lat, lon, r.lat, r.lon);
    if (d < minDist) {
      minDist = d;
      nearest = r;
    }
  }

  return {
    station: nearest.id,
    url: `https://radar.weather.gov/ridge/standard/${nearest.id}_loop.gif`,
  };
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
