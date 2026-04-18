import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	typedRoutes: true,
	poweredByHeader: false,
	generateEtags: true,
	compress: true,
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{
						key: 'X-DNS-Prefetch-Control',
						value: 'on',
					},
					{
						key: 'X-Content-Type-Options',
						value: 'nosniff',
					},
					{
						key: 'X-Frame-Options',
						value: 'SAMEORIGIN',
					},
				],
			},
		];
	}
};

export default nextConfig;