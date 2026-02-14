import createMDX from '@next/mdx';
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// This line patches the Next.js dev server for Cloudflare bindings
initOpenNextCloudflareForDev();

// @type {import('next').NextConfig} 
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  output: 'standalone',
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

export default withMDX(nextConfig);