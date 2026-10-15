
/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["playwright"],

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
