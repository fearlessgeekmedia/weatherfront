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

## Installation

### Using Nix (Recommended)

If you have Nix installed, you can run WeatherFront directly without installing dependencies:

```bash
# Run directly from GitHub
nix run github:fearlessgeek/weatherfront

# Or clone and run locally
git clone https://github.com/fearlessgeek/weatherfront.git
cd weatherfront
nix run .
```

### Install with Nix

To install WeatherFront permanently:

```bash
# Install to your user profile
nix profile install github:fearlessgeek/weatherfront

# Or install system-wide (requires sudo)
nix-env -iA nixpkgs.weatherfront
```

### NixOS System Installation

Add to your NixOS configuration:

```nix
# In your configuration.nix or flake.nix
{
  inputs.weatherfront.url = "github:fearlessgeek/weatherfront";
  
  # Then in your system packages:
  environment.systemPackages = [
    inputs.weatherfront.packages.${system}.default
  ];
}
```

### Quick Installation Script

For a quick installation with automatic testing:

```bash
git clone https://github.com/fearlessgeek/weatherfront.git
cd weatherfront
./install.sh
```

### Manual Installation

If you prefer to install manually, ensure you have the following dependencies:

- `bash`
- `curl`
- `jq`
- `gum`
- `chafa`
- `bc`

Then simply make the script executable and run it:

```bash
chmod +x weatherfront
./weatherfront
```

### Development Environment

For development with all dependencies available:

```bash
# Enter development shell
nix develop

# Or with direnv (if .envrc is present)
direnv allow
```

**Note:** The `flake.lock` file ensures reproducible builds by pinning exact versions of all dependencies. It should be committed to version control.

### Manual Installation

If you prefer not to use Nix, you'll need to install the following dependencies:

- Gum
- Chafa
- curl
- jq
- bc

## Image output and radar

- WeatherFront auto-detects terminal image support:
  - Kitty protocol: Kitty, Ghostty
  - SIXEL: XTerm (built with SIXEL), mlterm, WezTerm (enable in config), Konsole (recent builds), Contour, mintty (newer releases), st (patched)
  - If neither is detected, radar falls back to high-quality text/ANSI via Chafa symbols.
- Multiplexers: tmux/screen often block image protocols; run outside them for images.
- Override detection if needed:

  ```bash
  WEATHERFRONT_IMAGE_FORMAT=kitty ./weatherfront   # or: sixel | symbols
  ```

- Ensure your Chafa build supports the desired output: `chafa -f kitty` or `chafa -f sixel`.

If you find this script helpful, consider financially supporting it at https://ko-fi.com/fearlessgeekmedia
