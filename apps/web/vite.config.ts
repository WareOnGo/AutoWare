import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { reactRouter } from "@react-router/dev/vite";

// Suppress only Remotion worker file routing errors
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const message = args[0]?.toString() || '';
  // Only suppress errors that match: worker file + .js + routing error
  if (
    message.includes('worker-') &&
    message.includes('.js') &&
    (message.includes('No route matches') || message.includes('ErrorResponseImpl'))
  ) {
    return;
  }
  // All other errors pass through normally
  originalConsoleError.apply(console, args);
};

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    {
      name: 'remotion-worker-handler',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Silently handle worker file requests before they reach React Router
          if (req.url?.includes('worker-') && req.url?.endsWith('.js')) {
            res.statusCode = 404;
            res.end();
            return;
          }
          next();
        });
      },
    },
    reactRouter(),
    tsconfigPaths(),
    tailwindcss()
  ],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['@remotion/player'],
  },
});
