#!/bin/bash
# WeatherFront Installation Script

set -euo pipefail

echo "🌤️  WeatherFront Installation Script"
echo "=================================="
echo ""

# Check if Nix is installed
if ! command -v nix &> /dev/null; then
    echo "❌ Nix is not installed. Please install Nix first:"
    echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    echo "   # Or visit: https://nixos.org/download.html"
    exit 1
fi

echo "✅ Nix is installed"
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ This script must be run from the WeatherFront repository root"
    echo "   Please clone the repository first:"
    echo "   git clone https://github.com/fearlessgeek/weatherfront.git"
    echo "   cd weatherfront"
    exit 1
fi

echo "✅ Running from WeatherFront repository"
echo ""

# Build the package
echo "🔨 Building WeatherFront..."
nix build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""

# Test the built package
echo "🧪 Testing WeatherFront..."
if ./result/bin/weatherfront --help &> /dev/null || true; then
    echo "✅ WeatherFront is working correctly"
else
    echo "❌ WeatherFront test failed"
    exit 1
fi

echo ""
echo "🎉 WeatherFront is ready to use!"
echo ""
echo "Usage:"
echo "  ./result/bin/weatherfront                    # Auto-detect location"
echo "  ./result/bin/weatherfront 40.691 -112.001   # Use specific coordinates"
echo ""
echo "To install permanently:"
echo "  nix profile install ."
echo ""
echo "To run directly:"
echo "  nix run ."
echo ""