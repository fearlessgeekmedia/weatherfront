import { useEffect, useRef } from "react";
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

export interface ForecastHandle {
  scrollUp: () => void;
  scrollDown: () => void;
  scrollToTop: () => void;
  scrollToLine: (y: number) => void;
}

export function Forecast({
  periods,
  selectedForecastIdx,
  onSelectForecastIdx,
  showHourly,
  hourlyPeriods,
  uniqueDays,
  onScrollboxReady,
  focusedPanel,
}: {
  periods: ForecastPeriod[];
  selectedForecastIdx: number;
  onSelectForecastIdx: (idx: number) => void;
  showHourly: boolean;
  hourlyPeriods: NwsHourlyPeriod[] | null;
  uniqueDays: string[];
  onScrollboxReady?: (handle: ForecastHandle) => void;
  focusedPanel: "alerts" | "forecast";
}) {
  const selectedDay = uniqueDays[selectedForecastIdx] ?? null;
  const selectedDayDate = selectedDay ? getDayDate(selectedDay, periods) : null;

  const daysToShow = showHourly && selectedDay ? [selectedDay] : uniqueDays;

  const lines: string[] = [];
  const colors: string[] = [];
  const backgrounds: (string | undefined)[] = [];

  if (!showHourly) {
    lines.push("Press Enter or Space on a day to view its hourly forecast. Use j/k or arrows to scroll through days.");
    colors.push("gray");
    backgrounds.push(undefined);
  } else {
    lines.push(`Hourly forecast for ${selectedDay}. Press Enter or Space to close. Use j/k or arrows to scroll hourly entries.`);
    colors.push("gray");
    backgrounds.push(undefined);
  }

  daysToShow.forEach((day, idx) => {
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

    lines.push(day);
    colors.push(isSelected ? "white" : "cyan");
    backgrounds.push(isSelected ? "blue" : undefined);

    if (dayPeriod) {
      const precipText = dayPeriod.probabilityOfPrecipitation !== null && dayPeriod.probabilityOfPrecipitation !== undefined
        ? ` | ${dayPeriod.probabilityOfPrecipitation}% chance of precipitation`
        : "";
      lines.push(`${getWeatherIcon(dayPeriod.shortForecast, dayPeriod.isDaytime)} ${dayPeriod.temperature}${dayPeriod.temperatureUnit}${precipText}`);
      colors.push(isSelected ? "white" : "gray");
      backgrounds.push(isSelected ? "blue" : undefined);
    }

    if (showThisHourly) {
      lines.push("------------------------");
      colors.push("gray");
      backgrounds.push(undefined);

      if (dayHourly.length === 0 && hourlyPeriods === null) {
        lines.push("Loading hourly forecast...");
        colors.push("gray");
        backgrounds.push(undefined);
      } else if (dayHourly.length === 0 && hourlyPeriods !== null) {
        lines.push("No hourly data available for this day.");
        colors.push("gray");
        backgrounds.push(undefined);
      } else {
        dayHourly.forEach((period) => {
          lines.push(`${formatHour(period.startTime)} - ${formatHour(period.endTime)}`);
          colors.push("cyan");
          backgrounds.push(undefined);
          lines.push(`${getWeatherIcon(period.shortForecast, period.isDaytime)} ${period.temperature}${period.temperatureUnit}`);
          colors.push("gray");
          backgrounds.push(undefined);
          const hPrecip = period.probabilityOfPrecipitation !== null && period.probabilityOfPrecipitation !== undefined
            ? ` | ${period.probabilityOfPrecipitation}% chance of precipitation`
            : "";
          lines.push(`${period.shortForecast}${hPrecip}`);
          colors.push("gray");
          backgrounds.push(undefined);
          lines.push(`Wind: ${period.windSpeed} ${period.windDirection}`);
          colors.push("gray");
          backgrounds.push(undefined);
        });
      }
    }
  });

  const scrollboxNodeRef = useRef<{ scrollBy: (delta: { x: number; y: number }) => void; scrollTo: (pos: { x: number; y: number }) => void } | null>(null);

  useEffect(() => {
    const node = scrollboxNodeRef.current;
    if (node && onScrollboxReady) {
      onScrollboxReady({
        scrollUp: () => { node.scrollBy({ x: 0, y: -1 }); },
        scrollDown: () => { node.scrollBy({ x: 0, y: 1 }); },
        scrollToTop: () => { node.scrollTo({ x: 0, y: 0 }); },
        scrollToLine: (y: number) => { node.scrollTo({ x: 0, y }); },
      });
    }
  }, [onScrollboxReady, lines.length, showHourly]);

  return (
    <box title="Forecast" style={{ flexDirection: "column", border: true, padding: 1, flexGrow: 1, flexShrink: 1, minWidth: 1 }}>
      <scrollbox
        viewportCulling={false}
        scrollY={true}
        scrollX={false}
        focused={focusedPanel === "forecast"}
        ref={scrollboxNodeRef as any}
        style={{ maxHeight: 40, maxWidth: "100%" }}
      >
        {lines.map((text, idx) => (
          <text key={`${selectedDay}-${idx}`} fg={colors[idx]} bg={backgrounds[idx]}>
            {text}
          </text>
        ))}
      </scrollbox>
    </box>
  );
}
