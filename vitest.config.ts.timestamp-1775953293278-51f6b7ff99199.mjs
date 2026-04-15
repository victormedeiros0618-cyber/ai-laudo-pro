// vitest.config.ts
import { defineConfig } from "file:///sessions/peaceful-gracious-wright/mnt/vsemmp/ia-laudo/node_modules/vitest/dist/config.js";
import react from "file:///sessions/peaceful-gracious-wright/mnt/vsemmp/ia-laudo/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
var __vite_injected_original_dirname = "/sessions/peaceful-gracious-wright/mnt/vsemmp/ia-laudo";
var vitest_config_default = defineConfig({
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
        "src/lib/supabase.ts",
        // cliente externo — não testável em unit
        "src/lib/pdfGenerator.ts",
        // depende de jsPDF/DOM — E2E scope
        "src/hooks/useAuth.tsx"
        // depende de Supabase Auth context
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60
      }
    }
  },
  resolve: {
    alias: { "@": path.resolve(__vite_injected_original_dirname, "./src") }
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9zZXNzaW9ucy9wZWFjZWZ1bC1ncmFjaW91cy13cmlnaHQvbW50L3ZzZW1tcC9pYS1sYXVkb1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3Nlc3Npb25zL3BlYWNlZnVsLWdyYWNpb3VzLXdyaWdodC9tbnQvdnNlbW1wL2lhLWxhdWRvL3ZpdGVzdC5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3Nlc3Npb25zL3BlYWNlZnVsLWdyYWNpb3VzLXdyaWdodC9tbnQvdnNlbW1wL2lhLWxhdWRvL3ZpdGVzdC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZXN0L2NvbmZpZ1wiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbcmVhY3QoKV0sXHJcbiAgdGVzdDoge1xyXG4gICAgZW52aXJvbm1lbnQ6IFwianNkb21cIixcclxuICAgIGdsb2JhbHM6IHRydWUsXHJcbiAgICBzZXR1cEZpbGVzOiBbXCIuL3NyYy90ZXN0L3NldHVwLnRzXCJdLFxyXG4gICAgaW5jbHVkZTogW1wic3JjLyoqLyoue3Rlc3Qsc3BlY30ue3RzLHRzeH1cIl0sXHJcbiAgICBjb3ZlcmFnZToge1xyXG4gICAgICBwcm92aWRlcjogXCJ2OFwiLFxyXG4gICAgICBpbmNsdWRlOiBbXCJzcmMvbGliLyoqLyoudHNcIiwgXCJzcmMvaG9va3MvKiovKi50c1wiXSxcclxuICAgICAgZXhjbHVkZTogW1xyXG4gICAgICAgIFwic3JjL2xpYi9zdXBhYmFzZS50c1wiLCAgICAgICAvLyBjbGllbnRlIGV4dGVybm8gXHUyMDE0IG5cdTAwRTNvIHRlc3RcdTAwRTF2ZWwgZW0gdW5pdFxyXG4gICAgICAgIFwic3JjL2xpYi9wZGZHZW5lcmF0b3IudHNcIiwgICAvLyBkZXBlbmRlIGRlIGpzUERGL0RPTSBcdTIwMTQgRTJFIHNjb3BlXHJcbiAgICAgICAgXCJzcmMvaG9va3MvdXNlQXV0aC50c3hcIiwgICAgIC8vIGRlcGVuZGUgZGUgU3VwYWJhc2UgQXV0aCBjb250ZXh0XHJcbiAgICAgIF0sXHJcbiAgICAgIHRocmVzaG9sZHM6IHtcclxuICAgICAgICBsaW5lczogICAgICA2MCxcclxuICAgICAgICBmdW5jdGlvbnM6ICA2MCxcclxuICAgICAgICBicmFuY2hlczogICA2MCxcclxuICAgICAgICBzdGF0ZW1lbnRzOiA2MCxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczogeyBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSB9LFxyXG4gIH0sXHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXdWLFNBQVMsb0JBQW9CO0FBQ3JYLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFJekMsSUFBTyx3QkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLE1BQU07QUFBQSxJQUNKLGFBQWE7QUFBQSxJQUNiLFNBQVM7QUFBQSxJQUNULFlBQVksQ0FBQyxxQkFBcUI7QUFBQSxJQUNsQyxTQUFTLENBQUMsK0JBQStCO0FBQUEsSUFDekMsVUFBVTtBQUFBLE1BQ1IsVUFBVTtBQUFBLE1BQ1YsU0FBUyxDQUFDLG1CQUFtQixtQkFBbUI7QUFBQSxNQUNoRCxTQUFTO0FBQUEsUUFDUDtBQUFBO0FBQUEsUUFDQTtBQUFBO0FBQUEsUUFDQTtBQUFBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsWUFBWTtBQUFBLFFBQ1YsT0FBWTtBQUFBLFFBQ1osV0FBWTtBQUFBLFFBQ1osVUFBWTtBQUFBLFFBQ1osWUFBWTtBQUFBLE1BQ2Q7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTyxFQUFFLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU8sRUFBRTtBQUFBLEVBQ2pEO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
