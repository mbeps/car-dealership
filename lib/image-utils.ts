"use client";

const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_COMPRESSION_QUALITY = 0.82;

/**
 * Convert a File/Blob into a base64 data URL string.
 * @param file - Blob to convert
 * @returns Promise resolving with the base64 data URL
 */
const readAsDataUrl = (file: Blob): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read image data"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read image data"));
    reader.readAsDataURL(file);
  });

/**
 * Load an image element for a given source string.
 * @param src - Source URL/data URL
 * @returns Promise resolving with the loaded HTMLImageElement
 */
const loadImageElement = (src: string): Promise<HTMLImageElement> =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const imageElement = document.createElement("img");
    imageElement.onload = () => resolve(imageElement);
    imageElement.onerror = () => reject(new Error("Failed to load image"));
    imageElement.src = src;
  });

/**
 * Compress a single image file into a scaled base64 data URL.
 * @param file - Image File from the dropzone
 * @returns Promise resolving with the compressed data URL
 */
export const compressImageFile = async (file: File): Promise<string> => {
  const originalDataUrl = await readAsDataUrl(file);
  const imageElement = await loadImageElement(originalDataUrl);

  const { width, height } = imageElement;
  const maxDimension = Math.max(width, height);
  const scale =
    maxDimension > MAX_IMAGE_DIMENSION
      ? MAX_IMAGE_DIMENSION / maxDimension
      : 1;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context not available");
  }

  context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

  const outputType =
    file.type === "image/png"
      ? "image/png"
      : file.type === "image/webp"
        ? "image/webp"
        : "image/jpeg";

  const compressedBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Image compression failed"));
        }
      },
      outputType,
      outputType === "image/png" ? undefined : IMAGE_COMPRESSION_QUALITY
    );
  });

  return readAsDataUrl(compressedBlob);
};
