import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // heic-convertはNode.jsネイティブモジュールを使うためサーバーサイドのみ
  serverExternalPackages: ['heic-convert', 'sharp'],
}

export default nextConfig
