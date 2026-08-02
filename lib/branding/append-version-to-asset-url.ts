export function appendVersionToAssetUrl(
  url: string,
  version: string | null | undefined,
): string {
  if (!version) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodeURIComponent(version)}`;
}
