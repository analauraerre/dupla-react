/**
 * Genera íconos PNG (RGBA, fondo transparente) + favicon.ico de Dupla.
 *
 * Diseño — isotipo según manual de marca:
 *   Anillo donut: outer R = 28/64 × size, inner R = 18/64 × size
 *   Segmento coral (#FF6B5B): 0° → 120° horario (12h → 4h) = upper-right ~1/3
 *   Resto del anillo en verde (#0F7B5C)
 *   Centro y exterior = transparente
 *
 * Salida:
 *   public/favicon-16x16.png
 *   public/favicon-32x32.png
 *   public/apple-touch-icon.png     (180×180)
 *   public/android-chrome-192x192.png
 *   public/android-chrome-512x512.png
 *   public/favicon.ico              (contiene 16×16 y 32×32)
 */

import zlib from 'zlib';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dir  = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dir, '..', 'public');

// ── Colores ──────────────────────────────────────────────────────────────────
const CORAL = [255, 107,  91];   // #FF6B5B
const GREEN = [ 15, 123,  92];   // #0F7B5C

// ── CRC32 ────────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf  = Buffer.alloc(4); lenBuf.writeUInt32BE(data.length);
  const crcBuf  = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// ── Supersampling (anti-aliasing) ─────────────────────────────────────────────
const SS = 4; // 4×4 subpixels

/**
 * Devuelve [R, G, B, A] para el pixel (px, py).
 *
 * Regiones:
 *   d > outerR              → transparente
 *   d < innerR              → transparente (hueco)
 *   innerR ≤ d ≤ outerR     → coral si ángulo en [0°,120°], verde si no
 *
 * Ángulo: medido en grados horarios desde las 12h (top).
 *   atan2(dx, -dy) → 0° = top, 90° = right, 120° = "4 o'clock"
 */
function samplePixel(px, py, cx, cy, outerR, innerR) {
  let sumR = 0, sumG = 0, sumB = 0, sumA = 0;

  for (let sy = 0; sy < SS; sy++) {
    for (let sx = 0; sx < SS; sx++) {
      const x  = px + (sx + 0.5) / SS;
      const y  = py + (sy + 0.5) / SS;
      const dx = x - cx;
      const dy = y - cy;
      const d  = Math.sqrt(dx * dx + dy * dy);

      if (d >= innerR && d <= outerR) {
        // Ángulo horario desde las 12h, 0–360
        const angleDeg = ((Math.atan2(dx, -dy) * 180 / Math.PI) + 360) % 360;
        const col = (angleDeg <= 120) ? CORAL : GREEN;
        sumR += col[0]; sumG += col[1]; sumB += col[2]; sumA += 255;
      }
      // fuera del anillo: no suma nada (transparente)
    }
  }

  const n     = SS * SS;
  const alpha = Math.round(sumA / n);
  if (alpha === 0) return [0, 0, 0, 0];

  // Straight alpha: deshacer premultiplicación
  const weight = sumA / 255;
  return [
    Math.round(sumR / weight),
    Math.round(sumG / weight),
    Math.round(sumB / weight),
    alpha,
  ];
}

// ── Generador PNG ─────────────────────────────────────────────────────────────
// bg: null → fondo transparente | [R,G,B] → fondo sólido (para iOS touch icon)
function generatePNGBuffer(size, bg = null) {
  const cx     = size / 2;
  const cy     = size / 2;
  const outerR = size * (28 / 64);
  const innerR = size * (18 / 64);

  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(size * 4 + 1); // RGBA (4 bytes/px) + 1 byte filtro
    row[0] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      let [r, g, b, a] = samplePixel(x, y, cx, cy, outerR, innerR);
      // Fondo sólido: composite over-bg para pixels semi/totalmente transparentes
      if (bg && a < 255) {
        const alpha = a / 255;
        r = Math.round(r * alpha + bg[0] * (1 - alpha));
        g = Math.round(g * alpha + bg[1] * (1 - alpha));
        b = Math.round(b * alpha + bg[2] * (1 - alpha));
        a = 255;
      }
      const off = 1 + x * 4;
      row[off] = r; row[off + 1] = g; row[off + 2] = b; row[off + 3] = a;
    }
    rows.push(row);
  }

  const raw        = Buffer.concat(rows);
  const compressed = zlib.deflateSync(raw, { level: 9 });

  // IHDR: color type 6 = RGBA
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth = 8
  ihdr[9] = 6;  // color type = RGBA

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function generatePNG(size, outPath, bg = null) {
  const png = generatePNGBuffer(size, bg);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, png);
  console.log(`✓  ${path.basename(outPath)}  (${size}×${size})`);
  return png;
}

// ── Generador ICO (contiene 16×16 y 32×32) ───────────────────────────────────
function generateICO(sizes, outPath) {
  const pngBuffers = sizes.map(s => generatePNGBuffer(s));
  const count      = sizes.length;

  // ICONDIR header (6 bytes)
  const iconDir = Buffer.alloc(6);
  iconDir.writeUInt16LE(0, 0);     // reserved
  iconDir.writeUInt16LE(1, 2);     // type: 1 = ICO
  iconDir.writeUInt16LE(count, 4); // number of images

  // ICONDIRENTRY × count (16 bytes each)
  const entrySize  = 16;
  const dataOffset = 6 + count * entrySize;
  const entries    = [];
  let   offset     = dataOffset;

  for (let i = 0; i < count; i++) {
    const s   = sizes[i];
    const buf = pngBuffers[i];
    const e   = Buffer.alloc(entrySize);
    e[0] = s >= 256 ? 0 : s;  // width  (0 = 256)
    e[1] = s >= 256 ? 0 : s;  // height (0 = 256)
    e[2] = 0;                  // colorCount
    e[3] = 0;                  // reserved
    e.writeUInt16LE(1,    4);  // planes
    e.writeUInt16LE(32,   6);  // bitCount (32-bit RGBA)
    e.writeUInt32LE(buf.length, 8);  // bytesInRes
    e.writeUInt32LE(offset,    12);  // imageOffset
    entries.push(e);
    offset += buf.length;
  }

  const ico = Buffer.concat([iconDir, ...entries, ...pngBuffers]);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, ico);
  console.log(`✓  ${path.basename(outPath)}  (${sizes.join(', ')}px)`);
}

// ── Generar todo ──────────────────────────────────────────────────────────────
const BG_LIGHT = [250, 250, 247]; // #FAFAF7 — fondo claro para iOS

generatePNG( 16, path.join(PUBLIC, 'favicon-16x16.png'));
generatePNG( 32, path.join(PUBLIC, 'favicon-32x32.png'));
generatePNG(180, path.join(PUBLIC, 'apple-touch-icon.png'), BG_LIGHT); // iOS: fondo sólido
generatePNG(192, path.join(PUBLIC, 'android-chrome-192x192.png'));
generatePNG(512, path.join(PUBLIC, 'android-chrome-512x512.png'));
generateICO([16, 32], path.join(PUBLIC, 'favicon.ico'));

console.log('\nDone — PNGs con fondo transparente (RGBA) + favicon.ico');
