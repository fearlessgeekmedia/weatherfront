const ICONS = {
  sunny: "☀️",
  clear: "🌙",
  cloudy: "☁️",
  rain: "🌧️",
  drizzle: "🌦️",
  thunderstorm: "⛈️",
  snow: "❄️",
  fog: "🌫️",
  mist: "🌫️",
  smoke: "🌁",
  haze: "😶‍🌫️",
  dust: "💨",
  sand: "🏜️",
  ash: "🌋",
  squall: "💨",
  tornado: "🌪️",
  default: "❓",
} as const;

type IconMap = typeof ICONS;

function pickIcon(lower: string): keyof IconMap {
  for (const key of Object.keys(ICONS) as (keyof IconMap)[]) {
    if (key !== "default" && lower.includes(key)) {
      return key;
    }
  }
  return "default";
}

export function getWeatherIcon(condition: string, isDaytime?: boolean): string {
  const lower = condition.toLowerCase();
  let isNight = false;
  let stripped = lower;

  if (lower.startsWith("night_")) {
    isNight = true;
    stripped = lower.slice(6);
  } else if (lower.startsWith("day_")) {
    isNight = false;
    stripped = lower.slice(4);
  } else {
    isNight = isDaytime === false;
  }

  const iconKey = pickIcon(stripped);
  if (iconKey === "clear" || iconKey === "sunny") {
    return isNight ? "🌙" : "☀️";
  }
  return ICONS[iconKey];
}

export function WeatherIcon({ condition, isDaytime }: { condition: string; isDaytime?: boolean }) {
  const icon = getWeatherIcon(condition, isDaytime);
  return <text>{icon}</text>;
}
