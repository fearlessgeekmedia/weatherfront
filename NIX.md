# Nix Setup Documentation

This document explains the Nix flake configuration for WeatherFront and how to maintain it.

## Flake Structure

The `flake.nix` file provides:

1. **Package**: A derivation that builds WeatherFront with all dependencies
2. **App**: Direct execution via `nix run`
3. **Development Shell**: Environment with all dependencies for development

## Dependencies

WeatherFront requires these runtime dependencies, all managed by Nix:

- `bash` - Shell interpreter
- `curl` - HTTP client for API requests
- `jq` - JSON processor
- `gum` - Beautiful shell scripts UI
- `chafa` - Terminal image/animation viewer
- `bc` - Basic calculator for numeric operations

## Building and Testing

```bash
# Check flake syntax and evaluate
nix flake check

# Build the package
nix build

# Test the built binary
./result/bin/weatherfront

# Run directly without building
nix run .

# Enter development environment
nix develop
```

## Updating Dependencies

To update all inputs to their latest versions:

```bash
nix flake update
```

To update a specific input:

```bash
nix flake lock --update-input nixpkgs
```

## Cross-Platform Support

The flake supports all platforms that Nix supports:
- Linux (x86_64, aarch64)
- macOS (x86_64, aarch64)
- And more via `flake-utils.lib.eachDefaultSystem`

## Packaging Notes

- The script is wrapped with `makeWrapper` to ensure all dependencies are in PATH
- No compilation is needed since this is a bash script
- The derivation simply copies the script and sets up the runtime environment

## Publishing

When publishing to a Git repository, ensure:

1. `flake.nix` and `flake.lock` are committed
2. Update README.md GitHub URLs to match your repository
3. The script remains executable (`chmod +x weatherfront`)

## Direnv Integration

The `.envrc` file enables automatic environment setup:

```bash
# Allow direnv to use the flake
direnv allow

# Environment will be loaded automatically when entering the directory
```

## Troubleshooting

### Common Issues

1. **"Path not tracked by Git"**: Add files with `git add flake.nix`
2. **Missing dependencies**: Check that all required tools are in `buildInputs`
3. **Script not executable**: Ensure the original script has execute permissions

### Testing Changes

Always test after modifying the flake:

```bash
nix flake check
nix build
./result/bin/weatherfront
```
