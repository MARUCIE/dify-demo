import type { NextConfig } from "next";

const isStaticDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && process.env.STATIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  ...(isStaticDemo ? { output: 'export' } : {}),
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  ...(!isStaticDemo ? {
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            {
              key: 'Content-Security-Policy',
              value: [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: blob:",
                "font-src 'self'",
                "connect-src 'self' https://api.dify.ai https://agentdemo.hegui.cn",
              ].join('; '),
            },
          ],
        },
      ];
    },
  } : {}),
};

export default nextConfig;
