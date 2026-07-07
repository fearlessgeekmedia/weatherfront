#!/bin/bash
# WeatherFront Installation Script

set -euo pipefail

echo "🌤️  WeatherFront Installation Script"
echo "=================================="
echo ""

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    echo "   # Or visit: https://bun.sh"
    exit 1
fi

echo "✅ Bun is installed"
echo ""

# Check if chafa is installed
if ! command -v chafa &> /dev/null; then
    echo "❌ Chafa is not installed. Please install Chafa first:"
    echo "   # On Debian/Ubuntu: sudo apt install chafa"
    echo "   # On Fedora: sudo dnf install chafa"
    echo "   # On macOS: brew install chafa"
    echo "   # Or visit: https://hpjansson.org/chafa/"
    exit 1
fi

echo "✅ Chafa is installed"
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

# Install dependencies
echo "📦 Installing dependencies..."
bun install

echo ""
echo "✅ Dependencies installed"
echo ""

# Build standalone binary
echo "🔨 Building standalone binary..."
bun build --compile --outfile weatherfront src/main.tsx

echo ""
echo "✅ Build successful"
echo ""

# Test the built binary
echo "🧪 Testing WeatherFront..."
if ./weatherfront --help &> /dev/null || true; then
    echo "✅ WeatherFront is working correctly"
else
    echo "❌ WeatherFront test failed"
    exit 1
fi

echo ""
echo "🎉 WeatherFront is ready to use!"
echo ""
echo "Usage:"
echo "  ./weatherfront                    # Auto-detect location"
echo "  ./weatherfront 40.691 -112.001   # Use specific coordinates"
echo ""
echo "Or run with Bun:"
echo "  bun start                          # Development mode with auto-reload"
echo "  bun run weatherfront              # Production mode"
echo ""
