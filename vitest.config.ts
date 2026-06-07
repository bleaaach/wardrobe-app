import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test-utils/setupComponents.ts"],
    server: {
      deps: {
        inline: ["expo-file-system"],
      },
    },
  },
  resolve: {
    alias: {
      "expo-file-system/legacy": path.resolve(__dirname, "src/test-utils/mockExpoFileSystem.ts"),
      "expo-sqlite": path.resolve(__dirname, "src/test-utils/mockExpoSQLite.ts"),
    },
  },
});
