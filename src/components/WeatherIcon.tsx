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

export function getWeatherIcon(condition: string): string {
  const lower = condition.toLowerCase();
  return ICONS[pickIcon(lower)];
}

export function WeatherIcon({ condition }: { condition: string }) {
  const icon = getWeatherIcon(condition);
  return <text>{icon}</text>;
}
