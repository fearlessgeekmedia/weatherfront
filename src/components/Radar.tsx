import { useEffect, useState, useRef } from "react";
import { fetchWithLog } from "../api";
import { GifReader } from "omggif";

// Minimal GIF decoder that converts frames to base64 PNGs for Kitty terminal
class NativeGifDecoder {
  private _gifData: Uint8Array;
  private reader: GifReader | null = null;
  private width = 0;
  private height = 0;
  private _loopCount = 0;
  private bgColor: [number, number, number, number] = [0, 0, 0, 0];
  private rgba: Uint8ClampedArray = new Uint8ClampedArray(0);
  private base64 = "";
  private rafId = 0;
  private disposed = false;

  constructor(gifData: Uint8Array) {
    this._gifData = gifData;
  }

  private static getBackgroundColor(data: Uint8Array): [number, number, number, number] {
    const packed = data[10];
    const hasGlobal = typeof packed === "number" && packed >= 128;
    const idx = hasGlobal ? (data[11] ?? 0) : 0;
    if (!hasGlobal) return [0, 0, 0, 0];
    const offset = 13 + idx * 3;
    return [data[offset]!, data[offset + 1]!, data[offset + 2]!, 255];
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
    try {
      const jimp = await import("jimp");
      const Jimp = jimp.Jimp;
      const image = Jimp.fromBitmap({ data: Buffer.from(this.rgba.buffer), width: this.width, height: this.height });
      const base64 = await image.getBase64("image/png");
      this.base64 = base64.split(",")[1];
    } catch (e) {
      this.base64 = "";
    }
  }

  async start(onFrame: (b64: string) => void, onDone: () => void) {
    if (!this.reader) {
      this.reader = new GifReader(this._gifData);
      this.width = this.reader.width;
      this.height = this.reader.height;
      this._loopCount = this.reader.loopCount();
      this.bgColor = NativeGifDecoder.getBackgroundColor(this._gifData);
      this.rgba = new Uint8ClampedArray(this.width * this.height * 4);
    }

    const totalFrames = this.reader.numFrames();
    const totalLoops = this._loopCount === 0 ? Infinity : this._loopCount + 1;
    let loops = 0;
    let frameIdx = 0;
    let lastTime = performance.now();
    const minInterval = 1000 / 30; // 30 fps cap

    const renderLoop = async () => {
      if (this.disposed) return;
      if (loops >= totalLoops) {
        onDone();
        return;
      }

      const info = this.reader!.frameInfo(frameIdx);
      if (info.disposal === 2) {
        this.fillBackground();
      }
      try {
        this.reader!.decodeAndBlitFrameRGBA(frameIdx, this.rgba);
        await this.encodePng();
        if (this.base64) {
          onFrame(this.base64);
        }
      } catch {
        // skip bad frames
      }

      const delay = Math.max(10, (info.delay ?? 10) * 10);
      const now = performance.now();
      const elapsed = now - lastTime;
      const wait = Math.max(0, minInterval - elapsed);
      await new Promise(r => setTimeout(r, wait + delay));
      lastTime = performance.now();

      frameIdx = (frameIdx + 1) % totalFrames;
      if (frameIdx === 0) loops++;
      this.rafId = requestAnimationFrame(renderLoop);
    };

    this.fillBackground();
    this.rafId = requestAnimationFrame(renderLoop);
  }

  stop() {
    this.disposed = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  get decodedWidth() { return this.width; }
  get decodedHeight() { return this.height; }
  get loopCount() { return this._loopCount; }
}

function sendKittyImage(base64: string, cols: number, rows: number) {
  if (!base64) return;
  const chunkSize = 4096;
  for (let i = 0; i < base64.length; i += chunkSize) {
    const chunk = base64.slice(i, i + chunkSize);
    const last = i + chunkSize >= base64.length;
    if (i === 0) {
      process.stdout.write(`\x1b_Gf=100,a=T,m=${last ? 0 : 1},c=${cols},r=${rows};${chunk}\x1b\\`);
    } else {
      process.stdout.write(`\x1b_Gm=${last ? 0 : 1};${chunk}\x1b\\`);
    }
  }
}

export function Radar({ radarUrl }: { radarUrl?: string }) {
  if (!radarUrl || !radarUrl.trim() || !radarUrl.includes('_loop.gif') || !radarUrl.startsWith('https://')) {
    return null;
  }

  const [status, setStatus] = useState<string>("Loading radar...");
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState<number>(0);
  const currentRef = useRef<string>("");
  const lastRef = useRef<string>("");
  const posRef = useRef<{ row: number; col: number } | null>(null);
  const decoderRef = useRef<NativeGifDecoder | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const resp = await fetchWithLog(radarUrl, "Radar", {});
        const buffer = new Uint8Array(await resp.arrayBuffer());
        if (cancelled) return;
        const dec = new NativeGifDecoder(buffer);
        decoderRef.current = dec;
        dec.start(
          (b64) => {
            if (cancelled) return;
            currentRef.current = b64;
            setTick(t => t + 1);
          },
          () => {
            if (!cancelled) setStatus("done");
          }
        );
        setStatus("done");
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setStatus("error");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
      decoderRef.current?.stop();
    };
  }, [radarUrl]);

  // Render loop: draw each new frame in the Kitty terminal
  useEffect(() => {
    const tick = () => {
      const frame = currentRef.current;
      const pos = posRef.current;
      const dec = decoderRef.current;
      if (frame && frame !== lastRef.current && pos && dec) {
        lastRef.current = frame;
        process.stdout.write(`\x1b[${pos.row};${pos.col}H`);
        const maxCols = 60;
        const maxRows = 27;
        const w = dec.decodedWidth;
        const h = Math.max(dec.decodedHeight, 1);
        const aspect = w / h;
        const ratio = 2; // terminal cell aspect ratio
        let cols: number, rows: number;
        if (aspect * ratio > maxCols / maxRows) {
          cols = maxCols;
          rows = Math.round(maxCols / (aspect * ratio));
        } else {
          rows = maxRows;
          cols = Math.round(maxRows * aspect * ratio);
        }
        sendKittyImage(frame, cols, rows);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = "";
    };
  }, [radarUrl]);

  return (
    <box
      title="Local Radar"
      bottomTitle={radarUrl ? `${radarUrl.split("/").pop()} | native` : "native"}
      style={{ flexDirection: "column", border: true, padding: 1, width: 64, height: 31, flexShrink: 0, overflow: "visible" }}
      renderAfter={function (this: any) {
        posRef.current = { row: this.screenY + 2, col: this.screenX + 2 };
      }}
    >
      {status !== "done" && (
        <text fg="gray">{error || "Loading radar..."}</text>
      )}
    </box>
  );
}
