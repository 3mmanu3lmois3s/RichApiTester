import { defineConfig } from "electron-vite";
import { resolve } from "path";

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, "electron/main.js")
        }
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          preload: resolve(__dirname, "electron/preload.js")
        }
      }
    }
  },
  renderer: {
    input: resolve(__dirname, "src/renderer/index.html")
  }
});
