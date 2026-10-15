/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["playwright"],

  outputFileTracingIncludes: {
    "/api/check": [
      "./node_modules/playwright/**",
      "./node_modules/playwright-core/**"
    ]
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;