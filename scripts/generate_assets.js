const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = c ^ buf[n];
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crcVal = crc32(Buffer.concat([t, data]));
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, t, data, crcBuf]);
}

function createPng(width, height, renderPixel) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const rawLines = [];
  for (let y = 0; y < height; y++) {
    const line = Buffer.alloc(1 + width * 4);
    line[0] = 0; // no filter
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = renderPixel(x, y, width, height);
      const idx = 1 + x * 4;
      line[idx] = r;
      line[idx + 1] = g;
      line[idx + 2] = b;
      line[idx + 3] = a;
    }
    rawLines.push(line);
  }

  const rawData = Buffer.concat(rawLines);
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Distance to rounded box (squircle)
function isInsideSquircle(x, y, w, h, radius) {
  const rx = Math.max(0, Math.abs(x - w / 2) - (w / 2 - radius));
  const ry = Math.max(0, Math.abs(y - h / 2) - (h / 2 - radius));
  return (rx * rx + ry * ry) <= (radius * radius);
}

// Draw main Scanly App Icon (Red squircle, white scanner brackets, white document)
function renderScanlyIcon(x, y, w, h) {
  const scale = w / 512;
  const radius = 120 * scale;

  // Background check
  if (!isInsideSquircle(x, y, w, h, radius)) {
    return [0, 0, 0, 0]; // Transparent outside
  }

  // Red Background (#DC2626 / #E52E2E)
  let r = 220, g = 38, b = 38, a = 255;

  const cx = w / 2;
  const cy = h / 2;

  // Document Box Bounds (centered, elevated slightly)
  const docW = 160 * scale;
  const docH = 210 * scale;
  const docL = cx - docW / 2;
  const docR = cx + docW / 2;
  const docT = cy - docH / 2 - 15 * scale;
  const docB = cy + docH / 2 - 15 * scale;
  const foldSize = 40 * scale;

  // Scanner Bracket Corners
  const bGap = 25 * scale;
  const bLen = 35 * scale;
  const bThick = 12 * scale;

  const bL = docL - bGap;
  const bR = docR + bGap;
  const bT = docT - bGap;
  const bB = docB + bGap;

  // Check top-left corner bracket
  if ((x >= bL && x <= bL + bLen && y >= bT && y <= bT + bThick) ||
      (x >= bL && x <= bL + bThick && y >= bT && y <= bT + bLen)) {
    return [255, 255, 255, 255];
  }
  // Check top-right corner bracket
  if ((x >= bR - bLen && x <= bR && y >= bT && y <= bT + bThick) ||
      (x >= bR - bThick && x <= bR && y >= bT && y <= bT + bLen)) {
    return [255, 255, 255, 255];
  }
  // Check bottom-left corner bracket
  if ((x >= bL && x <= bL + bLen && y >= bB - bThick && y <= bB) ||
      (x >= bL && x <= bL + bThick && y >= bB - bLen && y <= bB)) {
    return [255, 255, 255, 255];
  }
  // Check bottom-right corner bracket
  if ((x >= bR - bLen && x <= bR && y >= bB - bThick && y <= bB) ||
      (x >= bR - bThick && x <= bR && y >= bB - bLen && y <= bB)) {
    return [255, 255, 255, 255];
  }

  // Document Body (rounded corners doc)
  if (x >= docL && x <= docR && y >= docT && y <= docB) {
    // Top right fold check
    if (x >= (docR - foldSize) && y <= (docT + foldSize)) {
      if ((x - (docR - foldSize)) + ((docT + foldSize) - y) > foldSize) {
        // Cut corner fold
      } else {
        return [255, 255, 255, 255];
      }
    } else {
      return [255, 255, 255, 255];
    }
  }

  // Fold flap overlay
  if (x >= (docR - foldSize) && x <= docR && y >= docT && y <= (docT + foldSize)) {
    if ((x - (docR - foldSize)) <= (y - docT)) {
      return [240, 240, 240, 255];
    }
  }

  // Default red background
  return [r, g, b, a];
}

// Android foreground icon
function renderAndroidForeground(x, y, w, h) {
  return renderScanlyIcon(x, y, w, h);
}

// Onboarding Illustration 1: Superior Quality
function renderOnboardingQuality(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = Math.hypot(x - cx, y - cy);

  if (dx < 220) {
    const alpha = Math.max(0, 1 - dx / 220);
    const r = Math.round(254 * alpha + 250 * (1 - alpha));
    const g = Math.round(242 * alpha + 250 * (1 - alpha));
    const b = Math.round(242 * alpha + 250 * (1 - alpha));
    
    // Draw centered scanner card
    if (x >= cx - 120 && x <= cx + 120 && y >= cy - 150 && y <= cy + 130) {
      if (x >= cx - 100 && x <= cx + 100 && y >= cy - 130 && y <= cy + 110) {
        // Document lines
        const lineY = [cy - 90, cy - 60, cy - 30, cy, cy + 30, cy + 60];
        for (const ly of lineY) {
          if (Math.abs(y - ly) < 4 && x >= cx - 70 && x <= cx + 70) {
            return [220, 38, 38, 255];
          }
        }
        return [255, 255, 255, 255];
      }
      return [220, 38, 38, 255];
    }
    return [r, g, b, 255];
  }
  return [250, 250, 250, 255];
}

// Onboarding Illustration 2: Smart OCR / Scan
function renderOnboardingOCR(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = Math.hypot(x - cx, y - cy);

  if (dx < 220) {
    if (x >= cx - 130 && x <= cx + 130 && y >= cy - 140 && y <= cy + 120) {
      if (Math.abs(y - (cy - 10)) < 12) {
        return [239, 68, 68, 255];
      }
      if (y >= cy - 80 && y <= cy - 60 && x >= cx - 90 && x <= cx + 90) {
        return [254, 226, 226, 255];
      }
      if (y >= cy + 30 && y <= cy + 50 && x >= cx - 90 && x <= cx + 90) {
        return [254, 226, 226, 255];
      }
      return [255, 255, 255, 255];
    }
    return [254, 242, 242, 255];
  }
  return [250, 250, 250, 255];
}

// Onboarding Illustration 3: Offline Sync / Storage Shield
function renderOnboardingSync(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = Math.hypot(x - cx, y - cy);

  if (dx < 220) {
    if (x >= cx - 110 && x <= cx + 110 && y >= cy - 130 && y <= cy + 110) {
      const lockDist = Math.hypot(x - cx, y - (cy - 40));
      if (lockDist >= 35 && lockDist <= 55 && y <= cy - 40) {
        return [220, 38, 38, 255];
      }
      if (x >= cx - 60 && x <= cx + 60 && y >= cy - 40 && y <= cy + 60) {
        return [220, 38, 38, 255];
      }
      return [255, 255, 255, 255];
    }
    return [254, 242, 242, 255];
  }
  return [250, 250, 250, 255];
}

const assetsDir = path.join(__dirname, '../assets/images');

console.log('Generating Scanly App Icon (512x512)...');
const iconBuffer = createPng(512, 512, renderScanlyIcon);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), iconBuffer);
fs.writeFileSync(path.join(assetsDir, 'logo.png'), iconBuffer);

console.log('Generating Splash Icon (256x256)...');
const splashBuffer = createPng(256, 256, renderScanlyIcon);
fs.writeFileSync(path.join(assetsDir, 'splash-icon.png'), splashBuffer);

console.log('Generating Favicon (64x64)...');
const faviconBuffer = createPng(64, 64, renderScanlyIcon);
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), faviconBuffer);

console.log('Generating Android Icons...');
const androidFgBuffer = createPng(432, 432, renderAndroidForeground);
fs.writeFileSync(path.join(assetsDir, 'android-icon-foreground.png'), androidFgBuffer);

const androidBgBuffer = createPng(432, 432, (x, y, w, h) => [220, 38, 38, 255]);
fs.writeFileSync(path.join(assetsDir, 'android-icon-background.png'), androidBgBuffer);

const androidMonoBuffer = createPng(432, 432, renderScanlyIcon);
fs.writeFileSync(path.join(assetsDir, 'android-icon-monochrome.png'), androidMonoBuffer);

console.log('Generating Onboarding Illustrations (500x500)...');
fs.writeFileSync(path.join(assetsDir, 'onboarding_quality.png'), createPng(500, 500, renderOnboardingQuality));
fs.writeFileSync(path.join(assetsDir, 'onboarding_ocr.png'), createPng(500, 500, renderOnboardingOCR));
fs.writeFileSync(path.join(assetsDir, 'onboarding_sync.png'), createPng(500, 500, renderOnboardingSync));

console.log('All Scanly assets generated successfully!');
