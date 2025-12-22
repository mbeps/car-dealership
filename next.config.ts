import type { NextConfig } from "next";

const SUPABASE_REMOTE_PATTERNS: {
  protocol: "http" | "https";
  hostname: string;
}[] = [];

const addSupabasePattern = (maybeUrl: string | undefined) => {
  if (!maybeUrl) return;
  try {
    const supabaseUrl = new URL(maybeUrl);
    const protocol = supabaseUrl.protocol.replace(":", "") as "http" | "https";
    SUPABASE_REMOTE_PATTERNS.push({
      protocol,
      hostname: supabaseUrl.hostname,
    });
  } catch {
    console.warn(
      "Invalid NEXT_PUBLIC_SUPABASE_URL value. Remote images from Supabase will be blocked until it is fixed."
    );
  }
};

addSupabasePattern(process.env.NEXT_PUBLIC_SUPABASE_URL);

// Allow any Supabase storage bucket as a fallback (covers dev misconfig).
SUPABASE_REMOTE_PATTERNS.push({
  protocol: "https",
  hostname: "*.supabase.co",
});

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  images: {
    remotePatterns: [
      ...SUPABASE_REMOTE_PATTERNS,
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/embed",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-src 'self' https://roadsidecoder.created.app;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
