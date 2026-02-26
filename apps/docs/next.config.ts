import { withGTConfig } from 'gt-next/config'
import type { NextConfig } from 'next'
import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'h8dxkfmaphn8o0p3.public.blob.vercel-storage.com',
        pathname: '/docs/**',
      },
    ],
  },
}

const mdxConfig = withMDX(config)
const gtConfig = withGTConfig(mdxConfig, {
  getLocalePath: './lib/getLocale.ts',
  getRegionPath: './lib/getRegion.ts',
})

export default gtConfig
