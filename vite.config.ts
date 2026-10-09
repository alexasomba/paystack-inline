import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: { ignorePatterns: ["dist/**", "src/openapi-types.ts", "src/operations.ts"] },
  pack: {
    deps: {
      // tsdown <0.23 compatibility: resolve external dependency subpaths.
      // Remove to preserve subpath imports as written (the new default).
      // https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
      resolveDepSubpath: true,
    },
    entry: ["./src/index.ts"],
    format: ["esm"],
    platform: "browser",
    dts: { build: true, incremental: false },
    clean: true,
    tsconfig: "./tsconfig.build.json",
  },
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.ts"],
  },
});
