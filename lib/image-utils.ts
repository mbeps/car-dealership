"use client";

/**
 * Convert a File/Blob into a base64 data URL string.
 * @param file - Blob to convert
 * @returns Promise resolving with the base64 data URL
 */
export const readAsDataUrl = (file: Blob): Promise<string> =>
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

