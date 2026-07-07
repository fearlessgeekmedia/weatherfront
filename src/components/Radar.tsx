import { useEffect, useState, useRef } from "react";

const Omggif = await import("omggif");
const { GifReader } = Omggif;

class NativeGifDecoder {
  private _gifData: Uint8Array;
  private reader: GifReader | null = null;
  private width = 0;
  private height = 0;
  private _loopCount = 0;
  private bgColor: [number, number, number, number] = [0, 0, 0, 0];
  private targetWidth = 0;
  private targetHeight = 0;
  private rgba: Uint8ClampedArray = new Uint8ClampedArray(0);
  private pngBuffer: Buffer = Buffer.alloc(0);
  private base64 = "";
  private rafId = 0;
  private disposed = false;

  constructor(gifData: Uint8Array) {
    this._gifData = gifData;
  }

  private static getBackgroundColor(data: Uint8Array): [number, number, number, number] {
    const packedFields = data[10];
    const hasGlobalPalette = typeof packedFields === "number" && packedFields >= 128;
    const backgroundIndex = hasGlobalPalette ? ((data[11] as number) ?? 0) : 0;
    if (!hasGlobalPalette) return [0, 0, 0, 0];
    const paletteOffset = 13 + backgroundIndex * 3;
    return [data[paletteOffset]!, data[paletteOffset + 1]!, data[paletteOffset + 2]!, 255];
  }

  private fillBackground() {
    const [r, g, b, a] = this.bgColor;
    for (let i = 0; i < this.rgba.length; i += 4) {
      this.rgba[i] = r;
      this.rgba[i + 1] = g;
      this.rgba[i + 2] = b;
      this.rgba[i + 3] = a;
    }
  }

  private async encodePng() {
    const { Jimp } = await import("jimp");
    const image = Jimp.fromBitmap({ data: Buffer.from(this.rgba.buffer), width: this.width, height: this.height });
    this.pngBuffer = Buffer.from(await image.getBuffer("image/png"));
    this.base64 = this.pngBuffer.toString("base64");
  }

  start(onFrame: (base64: string) => void, onDone: () => void) {
    if (!this.reader) {
      this.reader = new GifReader(this._gifData);
      this.width = this.reader.width;
      this.height = this.reader.height;
      this._loopCount = this.reader.loopCount();
      this.bgColor = NativeGifDecoder.getBackgroundColor(this._gifData);
      this.targetWidth = this.reader!.width;
      this.targetHeight = this.reader!.height;
      this.rgba = new Uint8ClampedArray(this.width * this.height * 4);
      this.pngBuffer = Buffer.alloc(this.width * this.height * 4 + 1024);
    }

    const totalFrames = this.reader.numFrames();
    const totalLoops = this._loopCount === 0 ? Infinity : this._loopCount + 1;
    let completedLoops = 0;
    let frameIndex = 0;
    let lastRenderTime = 0;
    const minInterval = 1000 / 30;
    let previousCanvas: Uint8ClampedArray | undefined;

    const fillRect = (canvas: Uint8ClampedArray, x: number, y: number, w: number, h: number, r: number, g: number, b: number, a: number) => {
      for (let row = y; row < y + h; row++) {
        for (let col = x; col < x + w; col++) {
          const off = (row * this.width + col) * 4;
          canvas[off] = r;
          canvas[off + 1] = g;
          canvas[off + 2] = b;
          canvas[off + 3] = a;
        }
      }
    };

    const loop = async () => {
      if (this.disposed) return;
      if (completedLoops >= totalLoops) {
        onDone();
        return;
      }

      const frameInfo = this.reader!.frameInfo(frameIndex);
      if (frameInfo.disposal === 2) {
        fillRect(this.rgba, frameInfo.x, frameInfo.y, frameInfo.width, frameInfo.height, ...this.bgColor);
      } else if (frameInfo.disposal === 3 && previousCanvas) {
        this.rgba.set(previousCanvas);
      }

      previousCanvas = frameInfo.disposal === 3 ? new Uint8ClampedArray(this.rgba) : undefined;
      this.reader!.decodeAndBlitFrameRGBA(frameIndex, this.rgba);
      await this.encodePng();

      if (!this.disposed) {
        onFrame(this.base64);
      }

      const delay = Math.max(10, (frameInfo.delay ?? 10) * 10);
      const now = performance.now();
      const elapsed = now - lastRenderTime;
      const wait = elapsed < minInterval ? minInterval - elapsed : 0;

      this.rafId = requestAnimationFrame(async () => {
        if (this.disposed) return;
        if (wait > 0) await new Promise(r => setTimeout(r, wait));
        if (this.disposed) return;
        lastRenderTime = performance.now();
        await new Promise(r => setTimeout(r, delay));
        if (!this.disposed) loop();
      });

      frameIndex++;
      if (frameIndex >= totalFrames) {
        frameIndex = 0;
        this.fillBackground();
        completedLoops++;
      }
    };

    this.fillBackground();
    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    this.disposed = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  get decodedWidth() {
    return this.targetWidth;
  }

  get decodedHeight() {
    return this.targetHeight;
  }

  get loopCount() {
    return this._loopCount;
  }
}

function sendKittyImage(base64: string, columns: number, rows: number) {
  if (!base64) return;
  const chunkSize = 4096;
  for (let i = 0; i < base64.length; i += chunkSize) {
    const chunk = base64.slice(i, i + chunkSize);
    const isLast = i + chunkSize >= base64.length;
    if (i === 0) {
      process.stdout.write(`\x1b_Gf=100,a=T,m=${isLast ? 0 : 1},c=${columns},r=${rows};${chunk}\x1b\\`);
    } else {
      process.stdout.write(`\x1b_Gm=${isLast ? 0 : 1};${chunk}\x1b\\`);
    }
  }
}

export function Radar({ radarUrl }: { radarUrl: string }) {
  const [status, setStatus] = useState<string>("Loading radar...");
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState<number>(0);
  const currentFrameRef = useRef<string>("");
  const lastEmittedRef = useRef<string>("");
  const positionRef = useRef<{ row: number; col: number } | null>(null);
  const decoderRef = useRef<NativeGifDecoder | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;

    async function loadRadar() {
      try {
        const response = await fetch(radarUrl);
        if (!response.ok) throw new Error(`Radar fetch failed: ${response.status}`);
        const buffer = new Uint8Array(await response.arrayBuffer());
        if (cancelled) return;

        const decoder = new NativeGifDecoder(buffer);
        decoderRef.current = decoder;

        const totalLoops = decoder.loopCount === 0 ? Infinity : decoder.loopCount + 1;
        let completedLoops = 0;

        decoder.start(
          (base64: string) => {
            if (cancelled) return;
            currentFrameRef.current = base64;
            setTick((t) => t + 1);
          },
          () => {
            completedLoops++;
            if (completedLoops < totalLoops && !cancelled && decoderRef.current === decoder) {
              const d = decoderRef.current;
              if (d) {
                d.start(
                  (base64: string) => {
                    if (cancelled) return;
                    currentFrameRef.current = base64;
                    setTick((t) => t + 1);
                  },
                  () => { completedLoops++; }
                );
              }
            }
          }
        );

        setStatus("done");
      } catch (e: unknown) {
        if (!cancelled) {
          console.error("[radar] loadRadar error:", e);
          setError(e instanceof Error ? e.message : String(e));
          setStatus("error");
        }
      }
    }

    loadRadar();

    return () => {
      cancelled = true;
      decoderRef.current?.stop();
      decoderRef.current = null;
    };
  }, [radarUrl]);

  useEffect(() => {
    const tick = () => {
      const frame = currentFrameRef.current;
      const pos = positionRef.current;
      const decoder = decoderRef.current;
      if (frame && frame !== lastEmittedRef.current && pos && decoder) {
        lastEmittedRef.current = frame;
        process.stdout.write(`\x1b[${pos.row};${pos.col}H`);
        const availableCols = 60;
        const availableRows = 27;
        const imgW = decoder.decodedWidth;
        const imgH = Math.max(decoder.decodedHeight, 1);
        const aspect = imgW / imgH;
        const CELL_HEIGHT_TO_WIDTH_RATIO = 2;
        let cols: number;
        let rows: number;
        if (aspect * CELL_HEIGHT_TO_WIDTH_RATIO > availableCols / availableRows) {
          cols = availableCols;
          rows = Math.round(availableCols / (aspect * CELL_HEIGHT_TO_WIDTH_RATIO));
        } else {
          rows = availableRows;
          cols = Math.round(availableRows * aspect * CELL_HEIGHT_TO_WIDTH_RATIO);
        }
        sendKittyImage(frame, cols, rows);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      lastEmittedRef.current = "";
    };
  }, [radarUrl]);

  return (
    <box
      title="Local Radar"
      bottomTitle={`${radarUrl.split("/").pop()} | native`}
      style={{ flexDirection: "column", border: true, padding: 1, width: 64, height: 31, flexShrink: 0, overflow: "visible" }}
      renderAfter={function (this: any, _buffer: any) {
        positionRef.current = { row: this.screenY + 2, col: this.screenX + 2 };
      }}
    >
      {status !== "done" && (
        <text fg="gray">{error || "Loading radar..."}</text>
      )}
    </box>
  );
}
