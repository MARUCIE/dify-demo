import type { NextConfig } from "next";

// Static export: demo mode OR direct Dify mode (no serverless needed)
const useStaticExport = process.env.STATIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  ...(useStaticExport ? { output: 'export' } : {}),
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  ...(!useStaticExport ? {
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
