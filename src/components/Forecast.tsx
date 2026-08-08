import type { ForecastPeriod, NwsHourlyPeriod } from "../api";
import { getWeatherIcon } from "./WeatherIcon";

function formatHour(dateStr: string | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
  } catch {
    return "";
  }
}

function getDayDate(dayName: string, periods: ForecastPeriod[]): string | null {
  const dayPeriods = periods.filter((p) => {
    const pDay = p.name.replace(/ (Night|Day)$/, "").trim();
    return pDay === dayName;
  });
  const first = dayPeriods[0];
  return first?.startTime ? new Date(first.startTime).toDateString() : null;
}

export function Forecast({
  periods,
  selectedForecastIdx,
  onSelectForecastIdx,
  showHourly,
  hourlyPeriods,
  uniqueDays,
}: {
  periods: ForecastPeriod[];
  selectedForecastIdx: number;
  onSelectForecastIdx: (idx: number) => void;
  showHourly: boolean;
  hourlyPeriods: NwsHourlyPeriod[] | null;
  uniqueDays: string[];
}) {
  const selectedDay = uniqueDays[selectedForecastIdx] ?? null;
  const selectedDayDate = selectedDay ? getDayDate(selectedDay, periods) : null;

  const daysToShow = showHourly && selectedDay ? [selectedDay] : uniqueDays;

  return (
    <box title="Forecast" style={{ flexDirection: "column", border: true, padding: 1, flexGrow: 1, flexShrink: 1, minWidth: 1 }}>
      {!showHourly && (
        <text fg="gray">Press Enter or Space on a day to view its hourly forecast. Use j/k or arrows to scroll through days.</text>
      )}
      {showHourly && (
        <text fg="gray">Hourly forecast for {selectedDay}. Press Enter or Space to close. Use j/k or arrows to scroll hourly entries.</text>
      )}
      <scrollbox style={{ maxHeight: 40, maxWidth: "100%" }}>
        {daysToShow.map((day, idx) => {
          const isSelected = showHourly ? true : idx === selectedForecastIdx;
          const dayPeriods = periods.filter((p) => {
            const pDay = p.name.replace(/ (Night|Day)$/, "").trim();
            return pDay === day;
          });
          const dayPeriod = dayPeriods[0];
          const dayDate = getDayDate(day, periods);
          const dayHourly = dayDate && hourlyPeriods
            ? hourlyPeriods.filter((p) => p.startTime && new Date(p.startTime).toDateString() === dayDate)
            : [];
          const showThisHourly = showHourly && day === selectedDay;

          return (
            <box
              key={day}
              style={{
                flexDirection: "column",
                gap: 0,
                ...(isSelected ? { bg: "blue" } : {}),
              }}
            >
              <text fg={isSelected ? "white" : "cyan"}>
                {day}
              </text>
              {dayPeriod && (
                <text fg={isSelected ? "white" : "gray"}>
                  {getWeatherIcon(dayPeriod.shortForecast, dayPeriod.isDaytime)} {dayPeriod.temperature}
                  {dayPeriod.temperatureUnit}
                  {dayPeriod.probabilityOfPrecipitation !== null && dayPeriod.probabilityOfPrecipitation !== undefined && (
                    <span fg="blue"> | {dayPeriod.probabilityOfPrecipitation}% chance of precipitation</span>
                  )}
                </text>
              )}
              {showThisHourly && (
                <>
                  <text fg={isSelected ? "white" : "gray"}>------------------------</text>
                  {dayHourly.length === 0 && hourlyPeriods === null && (
                    <text fg={isSelected ? "white" : "gray"}>Loading hourly forecast...</text>
                  )}
                  {dayHourly.length === 0 && hourlyPeriods !== null && (
                    <text fg={isSelected ? "white" : "gray"}>No hourly data available for this day.</text>
                  )}
                  {dayHourly.map((period, hIdx) => (
                    <box
                      key={hIdx}
                      style={{
                        flexDirection: "column",
                        gap: 0,
                      }}
                    >
                      <text fg={isSelected ? "white" : "cyan"}>
                        {formatHour(period.startTime)} - {formatHour(period.endTime)}
                      </text>
                      <text fg={isSelected ? "white" : "gray"}>
                        {getWeatherIcon(period.shortForecast, period.isDaytime)} {period.temperature}
                        {period.temperatureUnit}
                      </text>
                      <text fg={isSelected ? "white" : undefined}>
                        {period.shortForecast}
                        {period.probabilityOfPrecipitation !== null && period.probabilityOfPrecipitation !== undefined && (
                          <span fg="blue"> | {period.probabilityOfPrecipitation}% chance of precipitation</span>
                        )}
                      </text>
                      <text fg={isSelected ? "white" : "gray"}>
                        Wind: {period.windSpeed} {period.windDirection}
                      </text>
                    </box>
                  ))}
                </>
              )}
            </box>
          );
        })}
      </scrollbox>
    </box>
  );
}
