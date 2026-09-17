/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@messconnect/shared-types', '@messconnect/shared-constants', '@tabler/icons-react'],
  async redirects() {
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ALLOW_DEV_AUTH !== 'true') {
      return [
        {
          source: '/',
          destination: '/vendor/dashboard',
          permanent: false,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
