import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./App";

function syncTerminalSize(renderer: { terminalWidth: number; terminalHeight: number }) {
  Object.defineProperty(process.stdout, "columns", { value: renderer.terminalWidth, writable: true, configurable: true });
  Object.defineProperty(process.stdout, "rows", { value: renderer.terminalHeight, writable: true, configurable: true });
  (globalThis as Record<string, unknown>).__wfCols = renderer.terminalWidth;
  (globalThis as Record<string, unknown>).__wfRows = renderer.terminalHeight;
}

async function main() {
  const args = process.argv.slice(2);
  
  let initialLat: number | undefined;
  let initialLon: number | undefined;
  let refreshMs: number | undefined;

  for (const arg of args) {
    if (arg.startsWith("--lat=")) {
      initialLat = Number(arg.slice(6));
    } else if (arg.startsWith("--long=")) {
      initialLon = Number(arg.slice(7));
    } else if (arg.startsWith("--refresh=")) {
      refreshMs = Number(arg.slice(10));
    }
  }

  const initialLatLon =
    typeof initialLat === "number" && isFinite(initialLat) &&
    typeof initialLon === "number" && isFinite(initialLon)
      ? { lat: initialLat, lon: initialLon }
      : undefined;

  if (typeof refreshMs === "number" && isFinite(refreshMs)) {
    process.env.WEATHERFRONT_REFRESH_INTERVAL = String(refreshMs);
  }

  Object.defineProperty(process.stdout, "isTTY", { value: true, writable: true, configurable: true });
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    useKittyKeyboard: {},
  });
  syncTerminalSize(renderer);
  (globalThis as Record<string, unknown>).__wfRenderer = renderer;
  process.on("SIGWINCH", () => syncTerminalSize(renderer));
  createRoot(renderer).render(<App initialLatLon={initialLatLon} />);
}

main().catch((err) => {
  console.error("Failed to start WeatherFront:", err);
  process.exit(1);
});
