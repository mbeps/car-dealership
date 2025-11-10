/** @type {import('next').NextConfig} */
const SUPABASE_REMOTE_PATTERNS = [];

const addSupabasePattern = (maybeUrl) => {
  if (!maybeUrl) return;
  try {
    const supabaseUrl = new URL(maybeUrl);
    SUPABASE_REMOTE_PATTERNS.push({
      protocol: supabaseUrl.protocol.replace(":", ""),
      hostname: supabaseUrl.hostname,
    });
  } catch (error) {
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

const nextConfig = {
  experimental: {
    serverComponentsHmrCache: false, // defaults to true
  },
  images: {
    remotePatterns: SUPABASE_REMOTE_PATTERNS,
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
