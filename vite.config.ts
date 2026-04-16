import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
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
