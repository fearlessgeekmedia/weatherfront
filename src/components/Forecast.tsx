import type { ForecastPeriod } from "../api";

export function Forecast({ periods }: { periods: ForecastPeriod[] }) {
  return (
    <box title="Forecast" style={{ flexDirection: "column", border: true, padding: 1, flexGrow: 1, flexShrink: 1, minWidth: 1 }}>
      <scrollbox style={{ maxHeight: 40, maxWidth: "100%" }}>
        {periods.slice(0, 8).map((period, idx) => (
          <box
            key={idx}
            style={{
              flexDirection: "column",
              gap: 0,
            }}
          >
            <text fg="cyan">{period.name}</text>
            <text fg="gray">
              {period.isDaytime !== false ? "☀️" : "🌙"} {period.temperature}
              {period.temperatureUnit}
            </text>
            <text>{period.shortForecast}</text>
          </box>
        ))}
      </scrollbox>
    </box>
  );
}
