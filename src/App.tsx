import { useEffect, useState, useCallback, useRef } from "react";
import { useKeyboard } from "@opentui/react";
import type { LatLon, WeatherData } from "./types";
import {
  detectCoordinates,
  fetchNwsPoint,
  fetchNwsForecast,
  fetchCurrentConditions,
  getNearestRadar,
} from "./api";
import { CurrentConditions } from "./components/CurrentConditions";
import { Forecast } from "./components/Forecast";
import { Radar } from "./components/Radar";

export function App({ initialLatLon }: { initialLatLon?: LatLon }) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshMs = Number(process.env.WEATHERFRONT_REFRESH_INTERVAL || 300000);

  const loadData = useCallback(async (latLon?: LatLon) => {
    setLoading(true);
    setError(null);
    try {
      const coords = latLon ?? (await detectCoordinates());
      const point = await fetchNwsPoint(coords.lat, coords.lon);
      const forecast = await fetchNwsForecast(point.properties.forecast);
      const current = await fetchCurrentConditions(point.properties.forecastGridData, coords.lat, coords.lon);
      const radar = getNearestRadar(coords.lat, coords.lon);

      setData({
        location: {
          city: point.properties.relativeLocation.properties.city,
          state: point.properties.relativeLocation.properties.state,
          lat: coords.lat,
          lon: coords.lon,
        },
        current,
        forecast,
        radar,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      loadData();
    }, refreshMs);
  }, [loadData, refreshMs]);

  useEffect(() => {
    loadData(initialLatLon);
    startAutoRefresh();

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [loadData, startAutoRefresh]);

  useKeyboard((key) => {
    if (key.name === "r" && !key.ctrl && !key.meta) {
      loadData();
      startAutoRefresh();
    }
    if (key.name === "q" && !key.ctrl && !key.meta) {
      try {
        const maybe = (globalThis as Record<string, unknown>).__wfRenderer;
        if (maybe && typeof maybe === "object" && maybe !== null && typeof (maybe as { destroy?: unknown }).destroy === "function") {
          (maybe as { destroy: () => void }).destroy();
        }
      } catch {
        // ignore
      }
      process.exit(0);
    }
  });

  const refreshLabel =
    refreshMs >= 60000
      ? `${refreshMs / 60000} min`
      : `${refreshMs / 1000} sec`;

  return (
    <box style={{ flexDirection: "column", padding: 1, gap: 1, width: "100%", height: "100%" }}>
      <box style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <text fg="yellow">WeatherFront</text>
        {data && (
          <text fg="gray">
            {data.location.city}, {data.location.state} ({data.location.lat.toFixed(2)}, {data.location.lon.toFixed(2)})
          </text>
        )}
        <text fg="gray">
          Press <span fg="white">r</span> to refresh | <span fg="white">q</span> to quit | Auto refresh: {refreshLabel}
        </text>
      </box>

      <box style={{ flexDirection: "row", gap: 1, width: "100%" }}>
        <box style={{ flexDirection: "column", gap: 1, width: 35, flexShrink: 0 }}>
          {loading && <text fg="gray">Loading current conditions...</text>}
          {error && <text fg="red">Error: {error}</text>}
          {data && (
            <CurrentConditions conditions={data.current} city={data.location.city} state={data.location.state} isDaytime={data.current.isDaytime} />
          )}
        </box>

        <box style={{ flexDirection: "column", gap: 1, flexGrow: 1, flexShrink: 1, minWidth: 1 }}>
          <Forecast periods={data?.forecast ?? []} />
        </box>
      </box>

      {data && <Radar radarUrl={data.radar.url} />}
    </box>
  );
}
