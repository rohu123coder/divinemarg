/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["divinemarg-shared"],
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["swisseph"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("swisseph");
    }
    return config;
  },
};

export default nextConfig;
