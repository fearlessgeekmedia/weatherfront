export interface LatLon {
  lat: number;
  lon: number;
}

export interface WeatherData {
  location: {
    city: string;
    state: string;
    lat: number;
    lon: number;
  };
  current: import("./api").CurrentConditions;
  forecast: import("./api").ForecastPeriod[];
  radar: import("./api").RadarInfo;
}
