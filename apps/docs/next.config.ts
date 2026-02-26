import { withGTConfig } from 'gt-next/config'
import type { NextConfig } from 'next'
import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

const config: NextConfig = {
  reactStrictMode: true,
}

const mdxConfig = withMDX(config)
const gtConfig = withGTConfig(mdxConfig, {
  getLocalePath: './lib/getLocale.ts',
  getRegionPath: './lib/getRegion.ts',
})

export default gtConfig
