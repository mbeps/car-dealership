import { buildVersionedLogoPath } from "@/lib/helpers/build-versioned-logo-path";
import { parseDataUrl } from "@/lib/helpers/parse-data-url";
import { validateAndPrepareLogoUpload } from "@/lib/helpers/validate-and-prepare-logo-upload";
import { validateMagicBytes } from "@/lib/helpers/validate-magic-bytes";
import { validateSvgSafeguards } from "@/lib/helpers/validate-svg-safeguards";

function toDataUrl(mimeType: string, bytes: Buffer): string {
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}

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
    0xff,
    0xd9,
  ]);
}

function createIcoBuffer(width: number, height: number): Buffer {
  const bytes = Buffer.alloc(22);
  bytes.writeUInt16LE(0, 0);
  bytes.writeUInt16LE(1, 2);
  bytes.writeUInt16LE(1, 4);
  bytes[6] = width === 256 ? 0 : width;
  bytes[7] = height === 256 ? 0 : height;
  return bytes;
}

describe("logo-upload helpers", () => {
  it("parses a valid data URL", () => {
    const bytes = Buffer.from("hello world");
    const parsed = parseDataUrl(toDataUrl("image/png", bytes));

    expect(parsed.mimeType).toBe("image/png");
    expect(parsed.bytes.equals(bytes)).toBe(true);
  });

  it("validates PNG/JPEG/ICO signatures", () => {
    expect(() =>
      validateMagicBytes(createPngBuffer(128, 128), "png"),
    ).not.toThrow();
    expect(() =>
      validateMagicBytes(createJpegBuffer(128, 128), "jpg"),
    ).not.toThrow();
    expect(() =>
      validateMagicBytes(createIcoBuffer(128, 128), "ico"),
    ).not.toThrow();
  });

  it("rejects dangerous SVG content", () => {
    const dangerous = Buffer.from(
      '<svg><script>alert("x")</script></svg>',
      "utf8",
    );
    expect(() => validateSvgSafeguards(dangerous)).toThrow(
      "SVG contains blocked content.",
    );
  });

  it("accepts valid PNG upload payload", () => {
    const png = createPngBuffer(512, 256);

    const validated = validateAndPrepareLogoUpload({
      name: "brand.png",
      type: "image/png",
      dataUrl: toDataUrl("image/png", png),
    });

    expect(validated.extension).toBe("png");
    expect(validated.mimeType).toBe("image/png");
    expect(validated.dimensions).toEqual({ width: 512, height: 256 });
  });

  it("rejects mismatched extension and MIME", () => {
    const png = createPngBuffer(256, 256);

    expect(() =>
      validateAndPrepareLogoUpload({
        name: "brand.jpg",
        type: "image/jpeg",
        dataUrl: toDataUrl("image/png", png),
      }),
    ).toThrow("File extension does not match file payload MIME type.");
  });

  it("rejects too-small raster dimensions", () => {
    const tinyPng = createPngBuffer(32, 32);

    expect(() =>
      validateAndPrepareLogoUpload({
        name: "tiny.png",
        type: "image/png",
        dataUrl: toDataUrl("image/png", tinyPng),
      }),
    ).toThrow("Image dimensions are too small.");
  });

  it("builds versioned paths", () => {
    expect(buildVersionedLogoPath("singleton", "1748000000", "svg")).toBe(
      "dealership/singleton/logo-1748000000.svg",
    );
  });
});
