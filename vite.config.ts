// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    // Pre-bundle the app's UI libraries at startup. Discovering them lazily makes Vite
    // re-optimize mid-session, and an open preview can then mix two React copies
    // ("Cannot read properties of null (reading 'useRef')").
    optimizeDeps: {
      include: [
        "@radix-ui/react-dialog",
        "@radix-ui/react-label",
        "@radix-ui/react-slot",
        "@radix-ui/react-switch",
        "class-variance-authority",
        "clsx",
        "tailwind-merge",
        "lucide-react",
        "sonner",
        "recharts",
        "@supabase/supabase-js",
        "@lovable.dev/cloud-auth-js",
        "zod",
      ],
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
