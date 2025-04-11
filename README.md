# WeatherFront

This is a bash script I created to display current weather conditions, the weather forecast, and a weather radar.

The script now automatically detects your location in the United States of America.

If your location isn't detected properly, you can also feed it your latitude and longitude, for example:

`weatherfront 35 -90`

It also now gives a more detailed forecast. While it still relies on Ansiweather for current weather conditions, it now gets a more detailed forecast from the National Weather Service.

We only have a few maps set up, so unless you're in a lucky area, the maps may not be your area. It's a work in progress. I will get more radar maps added ASAP.

## Dependencies
- Ansiweather
- Gum
- Chafa

## Radar Dependencies
- A terminal that supports the Kitty Image Protocol, such as Kitty or Ghostty.
  In terminals that don't support images, the radar will not display.

If you find this script helpful, consider financially supporting it at https://ko-fi.com/fearlessgeekmedia
