import { WeatherIcon } from "./WeatherIcon";
import type { CurrentConditions } from "../api";

export function CurrentConditions({
  conditions,
  city,
  state,
  isDaytime,
}: {
  conditions: CurrentConditions;
  city: string;
  state: string;
  isDaytime?: boolean;
}) {
  return (
    <box title={`Current: ${city}, ${state}`} style={{ flexDirection: "column", border: true, padding: 1, gap: 1 }}>
      <box style={{ flexDirection: "column", gap: 0 }}>
        <text fg="cyan">
          {conditions.temperatureF !== null ? `${conditions.temperatureF}°F` : "N/A"}
        </text>
        <WeatherIcon condition={conditions.weather} isDaytime={isDaytime} />
        <text>{conditions.weather}</text>
      </box>
      <box style={{ flexDirection: "column", gap: 0 }}>
        {conditions.humidity !== null && (
          <text fg="gray">
            Humidity: <span>{conditions.humidity}%</span>
          </text>
        )}
        {conditions.windSpeedMph !== null && (
          <text fg="gray">
            Wind: <span>{conditions.windSpeedMph} mph {conditions.windDirection ?? ""}</span>
          </text>
        )}
      </box>
    </box>
  );
}
