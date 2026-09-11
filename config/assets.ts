/**
 * Centralised static asset registry for the application.
 */
export const ASSETS = {
  LOGO: {
    FALLBACK: { path: "/logo.png", alt: "Dealership logo fallback" },
    WHITE_FALLBACK: {
      path: "/logo-white.png",
      alt: "Dealership white logo fallback",
    },
  },
  FAVICON: {
    FALLBACK: { path: "/favicon.ico" },
  },
} as const;

export const brandingConstants = {
  HEADER_LOGO_FALLBACK_SRC: ASSETS.LOGO.FALLBACK.path,
  ICON_FALLBACK_SRC: ASSETS.FAVICON.FALLBACK.path,
  ICON_SECONDARY_FALLBACK_SRC: ASSETS.LOGO.WHITE_FALLBACK.path,
} as const;

export type Assets = typeof ASSETS;
