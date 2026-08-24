import { describe, it, expect } from "vitest";
import { extractRasterDimensions } from "@/lib/helpers/extract-raster-dimensions";

function createPngBuffer(width: number, height: number): Buffer {
  const bytes = Buffer.alloc(24);
  bytes[0] = 0x89;
  bytes[1] = 0x50;
  bytes[2] = 0x4e;
  bytes[3] = 0x47;
  bytes[4] = 0x0d;
  bytes[5] = 0x0a;
  bytes[6] = 0x1a;
  bytes[7] = 0x0a;
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

function createJpegBuffer(width: number, height: number): Buffer {
  return Buffer.from([
    0xff,
    0xd8,
    0xff,
    0xe0,
    0x00,
    0x10,
    0x4a,
    0x46,
    0x49,
    0x46,
    0x00,
    0x01,
    0x01,
    0x00,
    0x00,
    0x01,
    0x00,
    0x01,
    0x00,
    0x00,
    0xff,
    0xc0,
    0x00,
    0x11,
    0x08,
    (height >> 8) & 0xff,
    height & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    0x03,
    0x01,
    0x11,
    0x00,
    0x02,
    0x11,
    0x01,
    0x03,
    0x11,
    0x01,
  ]);
}

function createIcoBuffer(width: number, height: number): Buffer {
  const bytes = Buffer.alloc(8);
  bytes.writeUInt16LE(1, 4); // one image
  bytes[6] = width; // 256 is encoded as 0
  bytes[7] = height;
  return bytes;
}

describe("extractRasterDimensions", () => {
  it("extracts PNG dimensions", () => {
    expect(extractRasterDimensions(createPngBuffer(320, 240), "png")).toEqual({
      width: 320,
      height: 240,
    });
  });

  it("throws when PNG payload is too small", () => {
    expect(() => extractRasterDimensions(Buffer.alloc(10), "png")).toThrowError(
      /too small/i,
    );
  });

  it("extracts JPEG dimensions from SOF0 marker", () => {
    expect(extractRasterDimensions(createJpegBuffer(640, 480), "jpg")).toEqual({
      width: 640,
      height: 480,
    });
  });

  it("treats jpeg extension the same as jpg", () => {
    expect(extractRasterDimensions(createJpegBuffer(100, 50), "jpeg")).toEqual({
      width: 100,
      height: 50,
    });
  });

  it("throws on invalid JPEG header", () => {
    const bad = createJpegBuffer(10, 10);
    bad[0] = 0x00;
    expect(() => extractRasterDimensions(bad, "jpg")).toThrowError(
      /header is invalid/i,
    );
  });

  it("throws when JPEG dimensions cannot be found", () => {
    // Valid SOI header but only garbage markers, never a SOF marker
    expect(() =>
      extractRasterDimensions(Buffer.from([0xff, 0xd8, 0x00, 0x00]), "jpg"),
    ).toThrowError(/could not be determined/i);
  });

  it("extracts ICO dimensions", () => {
    expect(extractRasterDimensions(createIcoBuffer(64, 32), "ico")).toEqual({
      width: 64,
      height: 32,
    });
  });

  it("maps ICO zero byte to 256px", () => {
    expect(extractRasterDimensions(createIcoBuffer(0, 0), "ico")).toEqual({
      width: 256,
      height: 256,
    });
  });

  it("throws when ICO contains no images", () => {
    const bytes = Buffer.alloc(8);
    bytes.writeUInt16LE(0, 4);
    expect(() => extractRasterDimensions(bytes, "ico")).toThrowError(
      /no images/i,
    );
  });
});
