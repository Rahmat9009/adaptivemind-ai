export interface ProviderMedia {
  imageDataUrls: string[];
  youtubeUrls: string[];
}

export type NativeMediaPart =
  | { inlineData: { data: string; mimeType: string } }
  | { fileData: { fileUri: string } };

function parseImageDataUrl(value: string): { data: string; mimeType: string } | null {
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([a-zA-Z0-9+/=]+)$/);
  return match ? { mimeType: match[1], data: match[2] } : null;
}

export function createNativeMediaParts(media: ProviderMedia): NativeMediaPart[] {
  const videoParts: NativeMediaPart[] = media.youtubeUrls.map((url) => ({
    fileData: { fileUri: url },
  }));
  const imageParts: NativeMediaPart[] = media.imageDataUrls.flatMap((value) => {
    const parsed = parseImageDataUrl(value);
    return parsed ? [{ inlineData: parsed }] : [];
  });
  return [...videoParts, ...imageParts];
}
