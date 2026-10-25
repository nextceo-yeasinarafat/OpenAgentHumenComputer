import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type ProxyOptions } from "vite";


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  const bridgePort = env.AGENT_HUMEN_COMPUTER_BRIDGE_PORT || "7071";
  const bridgeHost =
    env.AGENT_HUMEN_COMPUTER_BRIDGE_HOST &&
    env.AGENT_HUMEN_COMPUTER_BRIDGE_HOST !== "0.0.0.0"
      ? env.AGENT_HUMEN_COMPUTER_BRIDGE_HOST
      : "127.0.0.1";
  const bridgeTarget =
    env.AGENT_HUMEN_COMPUTER_BRIDGE_URL || `http://${bridgeHost}:${bridgePort}`;

  
  
  
  
  const proxy: Record<string, ProxyOptions> = {
    "/api": {
      target: bridgeTarget,
      changeOrigin: true,
    },
    "/ws": {
      target: bridgeTarget,
      changeOrigin: true,
      ws: true,
    },
    "/novnc": {
      target: bridgeTarget,
      changeOrigin: true,
    },
    "/websockify": {
      target: bridgeTarget,
      changeOrigin: true,
      ws: true,
    },
    
    
    "/vscode": {
      target: bridgeTarget,
      ws: true,
    },
  };

  return {
    plugins: [react(), tailwindcss()],
    
    publicDir: "public",
    
    
    server: {
      host: "0.0.0.0",
      port: 1010,
      strictPort: true,
      proxy,
    },
    preview: {
      host: "0.0.0.0",
      port: 1011,
      strictPort: true,
      proxy,
    },
  };
});
