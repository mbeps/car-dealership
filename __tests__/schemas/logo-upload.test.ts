import { describe, it, expect } from "vitest";
import {
  logoUploadPayloadSchema,
  normaliseLogoMimeType,
  getLogoExtensionFromFileName,
  isAllowedLogoMimeType,
  isCompatibleLogoExtensionAndMimeType,
  getMimeTypeFromFileName,
  LOGO_ALLOWED_EXTENSIONS,
  LOGO_MIME_BY_EXTENSION,
} from "@/schemas/logo-upload";

describe("logoUploadPayloadSchema", () => {
  it("accepts a valid payload with MIME type", () => {
    const result = logoUploadPayloadSchema.safeParse({
      name: "logo.png",
      type: "image/png",
      dataUrl: "data:image/png;base64,AAAA",
    });
    expect(result.success).toBe(true);
  });

  it("defaults missing type to empty string", () => {
    const result = logoUploadPayloadSchema.parse({
      name: "logo.png",
      dataUrl: "data:image/png;base64,AAAA",
    });
    expect(result.type).toBe("");
  });

  it("trims whitespace around type", () => {
    const result = logoUploadPayloadSchema.parse({
      name: "logo.png",
      type: "  image/png  ",
      dataUrl: "data:image/png;base64,AAAA",
    });
    expect(result.type).toBe("image/png");
  });

  it("rejects an empty file name", () => {
    const result = logoUploadPayloadSchema.safeParse({
      name: "",
      type: "image/png",
      dataUrl: "data:image/png;base64,AAAA",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty data URL", () => {
    const result = logoUploadPayloadSchema.safeParse({
      name: "logo.png",
      type: "image/png",
      dataUrl: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("normaliseLogoMimeType", () => {
  it("lowercases and trims the MIME type", () => {
    expect(normaliseLogoMimeType("  Image/PNG ")).toBe("image/png");
  });
});

describe("getLogoExtensionFromFileName", () => {
  it.each(["photo.png", "photo.PNG", " photo.jpg ", "icon.ico", "mark.svg"])(
    "extracts extension from %s",
    (fileName) => {
      const ext = getLogoExtensionFromFileName(fileName);
      expect(ext).not.toBeNull();
      expect(LOGO_ALLOWED_EXTENSIONS).toContain(ext);
    },
  );

  it("returns null for unsupported extensions", () => {
    expect(getLogoExtensionFromFileName("file.gif")).toBeNull();
  });

  it("returns null when there is no extension", () => {
    expect(getLogoExtensionFromFileName("noextension")).toBeNull();
  });
});

describe("isAllowedLogoMimeType", () => {
  it("accepts known MIME types regardless of casing", () => {
    expect(isAllowedLogoMimeType("IMAGE/SVG+XML")).toBe(true);
  });

  it("rejects unknown MIME types", () => {
    expect(isAllowedLogoMimeType("application/octet-stream")).toBe(false);
  });
});

describe("isCompatibleLogoExtensionAndMimeType", () => {
  it("accepts matching pairs", () => {
    expect(isCompatibleLogoExtensionAndMimeType("png", "image/png")).toBe(true);
    expect(isCompatibleLogoExtensionAndMimeType("ico", "image/x-icon")).toBe(
      true,
    );
  });

  it("rejects mismatched pairs", () => {
    expect(isCompatibleLogoExtensionAndMimeType("svg", "image/png")).toBe(
      false,
    );
  });
});

describe("getMimeTypeFromFileName", () => {
  it("maps jpg to image/jpeg", () => {
    expect(getMimeTypeFromFileName("car.jpg")).toBe("image/jpeg");
  });

  it("returns null for unsupported files", () => {
    expect(getMimeTypeFromFileName("car.bmp")).toBeNull();
  });
});

describe("LOGO_MIME_BY_EXTENSION", () => {
  it("covers every allowed extension", () => {
    for (const ext of LOGO_ALLOWED_EXTENSIONS) {
      expect(LOGO_MIME_BY_EXTENSION[ext].length).toBeGreaterThan(0);
    }
  });
});
