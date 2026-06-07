import fs from "fs";
import jpeg from "jpeg-js";
import { PNG } from "pngjs";

/**
 * Decode image to raw RGBA pixels without sharp.
 * Supports JPEG and PNG.
 */
export async function decodeImage(input) {
  const buffer = Buffer.isBuffer(input) ? input : await fs.promises.readFile(input);

  // Try PNG first
  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    const png = PNG.sync.read(buffer);
    return {
      data: new Uint8Array(png.data),
      width: png.width,
      height: png.height,
    };
  }

  // Fallback to JPEG
  const decoded = jpeg.decode(buffer, { useTArray: true });
  // jpeg-js returns RGB; convert to RGBA
  const { width, height, data } = decoded;
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = data[i * 3];
    rgba[i * 4 + 1] = data[i * 3 + 1];
    rgba[i * 4 + 2] = data[i * 3 + 2];
    rgba[i * 4 + 3] = 255;
  }
  return { data: rgba, width, height };
}
