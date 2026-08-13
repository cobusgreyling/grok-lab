import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use local tsc CLI so TypeScript 7 (native) can typecheck during next build.
  // The `typescript` package is aliased to @typescript/typescript6 for the JS API
  // (required by typescript-eslint until TS >=7.1 support).
  // Silence multi-lockfile workspace root inference in this monorepo layout
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
