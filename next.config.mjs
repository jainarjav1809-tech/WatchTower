/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium"],

  outputFileTracingIncludes: {
    "/api/check": [
      "./node_modules/playwright-core/**",
      "./node_modules/@sparticuz/chromium/**"
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