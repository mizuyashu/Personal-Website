import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    rules: {
      // Shaders live in shaders/*.glsl and import as strings.
      "*.glsl": {
        loaders: ["./loaders/glsl-loader.js"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
