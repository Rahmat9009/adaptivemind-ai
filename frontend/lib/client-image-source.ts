"use client";

import {
  MAX_IMAGE_DATA_URL_CHARACTERS,
  type TutorSource,
} from "@/lib/sources";

const MAX_IMAGE_DIMENSION = 1_600;
const TARGET_IMAGE_BYTES = 1_000_000;

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("The image could not be encoded."));
    };
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.readAsDataURL(blob);
  });
}
function canvasBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("The image could not be prepared."));
      },
      "image/jpeg",
      quality,
    );
  });
}

async function decodeImage(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new Error("The selected image is malformed or unsupported.");
  }
}

export async function prepareImageSource(
  file: File,
  safeName: string,
): Promise<TutorSource> {
  const bitmap = await decodeImage(file);
  try {
    let scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    let blob: Blob | null = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image processing is unavailable.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      blob = await canvasBlob(canvas, Math.max(0.62, 0.9 - attempt * 0.07));
      if (blob.size <= TARGET_IMAGE_BYTES) break;
      scale *= 0.82;
    }

    if (!blob || blob.size > TARGET_IMAGE_BYTES * 1.25) {
      throw new Error("The image is too detailed to prepare within the upload limit.");
    }
    const imageDataUrl = await readBlobAsDataUrl(blob);
    if (imageDataUrl.length > MAX_IMAGE_DATA_URL_CHARACTERS) {
      throw new Error("The prepared image still exceeds the request limit.");
    }

    return {
      id: crypto.randomUUID(),
      title: safeName,
      type: "image",
      mimeType: "image/jpeg",
      size: blob.size,
      sections: [{
        label: "Image",
        content:
          "Educational image attached for visual analysis. AdaptiveMind did not store OCR text for this image.",
      }],
      imageDataUrl,
      extractionNote:
        "Prepared in the browser with metadata removed. The raw image is not stored by AdaptiveMind.",
    };
  } finally {
    bitmap.close();
  }
}
