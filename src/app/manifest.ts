import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ScriptureIQ",
    short_name: "ScriptureIQ",
    description: "A companion for the One Story That Leads to Jesus reading plan.",
    start_url: "/home",
    display: "standalone",
    background_color: "#f7f5f0",
    theme_color: "#1f3a5f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
