import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts", "src/hooks/**/*.ts"],
      exclude: [
        "src/lib/supabase.ts",       // cliente externo — não testável em unit
        "src/lib/pdfGenerator.ts",   // depende de jsPDF/DOM — E2E scope
        "src/hooks/useAuth.tsx",     // depende de Supabase Auth context
      ],
      thresholds: {
        lines:      60,
        functions:  60,
        branches:   60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
