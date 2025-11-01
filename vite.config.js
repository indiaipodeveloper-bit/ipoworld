import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  server: {
    host: "0.0.0.0", // listen on all network interfaces
    // port: 5173, // optional: choose a fixed port
  },
  plugins: [react()],
});
