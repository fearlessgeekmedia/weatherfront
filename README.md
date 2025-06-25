# WeatherFront

WeatherFront is a user-friendly, terminal-based weather application that provides current conditions, detailed forecasts, and animated radar imagery, all powered by the National Weather Service (NWS) API. It's designed to be both informative and visually appealing, making it easy to get the weather information you need without leaving your terminal.

## Key Features

- **Current Weather Conditions:** Get up-to-the-minute weather information for your location, including temperature, wind speed, and more.
- **Detailed Forecasts:** View a comprehensive weather forecast, giving you a clear outlook for the coming days.
- **Animated Radar:** See the latest weather patterns with an animated radar loop for your area.
- **Automatic Location Detection:** WeatherFront can automatically detect your location, or you can manually specify coordinates.
- **Interactive Menu:** A simple, clean menu allows you to choose what you want to see, whether it's the forecast, the radar, or you're ready to quit.

## Usage

To start WeatherFront, simply run the script:

```bash
./weatherfront
```

If you want to specify your location manually, you can provide the latitude and longitude as arguments:

```bash
./weatherfront 35 -90
```

## Dependencies
- Ansiweather
- Gum
- Chafa
- curl
- jq

## Radar Dependencies
- A terminal that supports the Kitty Image Protocol, such as Kitty or Ghostty.
  In terminals that don't support images, the radar will not display.

If you find this script helpful, consider financially supporting it at https://ko-fi.com/fearlessgeekmedia
